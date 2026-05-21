package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.*;
import com.internship.student_internship_tracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DemandeEncadrementService {

    private final DemandeEncadrementRepository demandeRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public DemandeEncadrement soumettreDemande(Long etudiantId, Long encadrantId, String message) {

        // ✅ NOUVEAU — Bloquer si l'étudiant a déjà un encadrant ACCEPTÉ
        boolean dejaAccepte = demandeRepository
                .existsByEtudiantIdAndStatut(etudiantId, StatutDemande.ACCEPTE);
        if (dejaAccepte) {
            throw new RuntimeException("Vous avez déjà un encadrant accepté");
        }

        // ✅ NOUVEAU — Bloquer si l'étudiant a déjà une demande EN ATTENTE (peu importe l'encadrant)
        boolean dejaEnAttente = demandeRepository
                .existsByEtudiantIdAndStatut(etudiantId, StatutDemande.EN_ATTENTE);
        if (dejaEnAttente) {
            throw new RuntimeException("Vous avez déjà une demande en attente. Attendez la réponse avant d'en envoyer une autre.");
        }

        User etudiant  = userRepository.findById(etudiantId)
                .orElseThrow(() -> new RuntimeException("Étudiant non trouvé"));
        User encadrant = userRepository.findById(encadrantId)
                .orElseThrow(() -> new RuntimeException("Encadrant non trouvé"));

        DemandeEncadrement demande = DemandeEncadrement.builder()
                .etudiant(etudiant)
                .encadrant(encadrant)
                .message(message)
                .statut(StatutDemande.EN_ATTENTE)
                .dateDemande(LocalDateTime.now())
                .build();

        DemandeEncadrement saved = demandeRepository.save(demande);

        // Notifier UNIQUEMENT l'encadrant ciblé
        Notification notification = Notification.builder()
                .titre("Nouvelle demande d'encadrement")
                .message(etudiant.getNom() + " vous a envoyé une demande d'encadrement")
                .estLue(false)
                .dateEnvoi(LocalDateTime.now())
                .user(encadrant)
                .build();
        notificationRepository.save(notification);

        return saved;
    }

    public DemandeEncadrement repondre(Long demandeId, boolean accepte) {
        DemandeEncadrement demande = demandeRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        demande.setStatut(accepte ? StatutDemande.ACCEPTE : StatutDemande.REFUSE);
        demande.setDateReponse(LocalDateTime.now());
        DemandeEncadrement saved = demandeRepository.save(demande);

        // ✅ Si accepté → lier l'encadrant à l'étudiant dans la table users
        if (accepte) {
            User etudiant = demande.getEtudiant();
            etudiant.setEncadrant(demande.getEncadrant());
            userRepository.save(etudiant);

            // ✅ NOUVEAU — Refuser automatiquement toutes les autres demandes EN_ATTENTE de cet étudiant
            List<DemandeEncadrement> autresDemandes = demandeRepository
                    .findByEtudiantIdAndStatut(demande.getEtudiant().getId(), StatutDemande.EN_ATTENTE);
            for (DemandeEncadrement autre : autresDemandes) {
                autre.setStatut(StatutDemande.REFUSE);
                autre.setDateReponse(LocalDateTime.now());
                demandeRepository.save(autre);
            }
        }

        // Notifier l'étudiant
        Notification notification = Notification.builder()
                .titre(accepte ? "Demande acceptée ✅" : "Demande refusée ❌")
                .message(accepte
                    ? demande.getEncadrant().getNom() + " a accepté votre demande d'encadrement"
                    : demande.getEncadrant().getNom() + " a refusé votre demande d'encadrement")
                .estLue(false)
                .dateEnvoi(LocalDateTime.now())
                .user(demande.getEtudiant())
                .build();
        notificationRepository.save(notification);

        return saved;
    }

    public List<DemandeEncadrement> getDemandesEncadrant(Long encadrantId) {
        return demandeRepository.findByEncadrantId(encadrantId);
    }

    public List<DemandeEncadrement> getDemandesEtudiant(Long etudiantId) {
        return demandeRepository.findByEtudiantId(etudiantId);
    }

    public List<DemandeEncadrement> getDemandesEnAttente(Long encadrantId) {
        return demandeRepository.findByEncadrantIdAndStatut(encadrantId, StatutDemande.EN_ATTENTE);
    }
}