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
        // Vérifier que l'étudiant n'a pas déjà une demande en attente
        if (demandeRepository.existsByEtudiantIdAndEncadrantIdAndStatut(
                etudiantId, encadrantId, StatutDemande.EN_ATTENTE)) {
            throw new RuntimeException("Une demande est déjà en attente pour cet encadrant");
        }

        User etudiant = userRepository.findById(etudiantId).orElseThrow();
        User encadrant = userRepository.findById(encadrantId).orElseThrow();

        DemandeEncadrement demande = DemandeEncadrement.builder()
                .etudiant(etudiant)
                .encadrant(encadrant)
                .message(message)
                .statut(StatutDemande.EN_ATTENTE)
                .dateDemande(LocalDateTime.now())
                .build();

        DemandeEncadrement saved = demandeRepository.save(demande);

        // Notifier l'encadrant
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

        // Si accepté → lier l'encadrant à l'étudiant
        if (accepte) {
            User etudiant = demande.getEtudiant();
            etudiant.setEncadrant(demande.getEncadrant());
            userRepository.save(etudiant);
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