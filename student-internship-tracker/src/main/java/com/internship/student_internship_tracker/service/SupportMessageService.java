package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.SupportMessage;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.SupportMessageRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportMessageService {

    private final SupportMessageRepository supportRepository;
    private final UserRepository           userRepository;
    private final NotificationService      notificationService;

    // ── Envoyer un message ─────────────────────────────────────────────────
    public SupportMessage envoyerMessage(
            Long   auteurId,
            String sujet,
            String type,
            String message
    ) {
        User auteur = userRepository.findById(auteurId)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        SupportMessage msg = new SupportMessage();
        msg.setSujet(sujet);
        msg.setType(type);
        msg.setMessage(message);
        msg.setAuteur(auteur);
        msg.setDateEnvoi(LocalDateTime.now());
        msg.setLu(false);
        msg.setStatut(SupportMessage.Statut.EN_ATTENTE);

        SupportMessage saved = supportRepository.save(msg);

        // Notifier tous les admins
        userRepository.findAll().stream()
            .filter(u -> u.getRole() == User.Role.ADMIN)
            .forEach(admin ->
                notificationService.createNotification(
                    "Nouveau message support",
                    "📩 Message de " + auteur.getNom() + " : \"" + sujet + "\"",
                    admin.getId()
                )
            );

        return saved;
    }

    // ── Tous les messages (admin) ──────────────────────────────────────────
    public List<SupportMessage> getTousLesMessages() {
        return supportRepository.findAllByOrderByDateEnvoiDesc();
    }

    // ── Messages non lus (admin) ───────────────────────────────────────────
    public List<SupportMessage> getMessagesNonLus() {
        return supportRepository.findByLuFalseOrderByDateEnvoiDesc();
    }

    // ── Messages d'un utilisateur ──────────────────────────────────────────
    public List<SupportMessage> getMessagesParUtilisateur(Long auteurId) {
        return supportRepository.findByAuteurIdOrderByDateEnvoiDesc(auteurId);
    }

    // ── Marquer comme lu ───────────────────────────────────────────────────
    public SupportMessage marquerLu(Long id) {
        SupportMessage msg = supportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Message introuvable"));
        msg.setLu(true);
        return supportRepository.save(msg);
    }

    // ── Répondre à un message ──────────────────────────────────────────────
    public SupportMessage repondre(Long id, Long adminId, String reponse) {
        SupportMessage msg = supportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Message introuvable"));

        User admin = userRepository.findById(adminId)
            .orElseThrow(() -> new RuntimeException("Admin introuvable"));

        msg.setReponse(reponse);
        msg.setAdmin(admin);
        msg.setDateReponse(LocalDateTime.now());
        msg.setStatut(SupportMessage.Statut.RESOLU);
        msg.setLu(true);

        SupportMessage saved = supportRepository.save(msg);

        // Notifier l'auteur
        notificationService.createNotification(
            "Réponse à votre demande",
            "✅ Votre demande \"" + msg.getSujet() + "\" a reçu une réponse.",
            msg.getAuteur().getId()
        );

        return saved;
    }

    // ── Changer le statut ──────────────────────────────────────────────────
    public SupportMessage changerStatut(Long id, String statut) {
        SupportMessage msg = supportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Message introuvable"));
        msg.setStatut(SupportMessage.Statut.valueOf(statut.toUpperCase()));
        return supportRepository.save(msg);
    }

    // ── Compter les non lus ────────────────────────────────────────────────
    public long compterNonLus() {
        return supportRepository.countByLuFalse();
    }

    // ── Supprimer ──────────────────────────────────────────────────────────
    public void supprimer(Long id) {
        supportRepository.deleteById(id);
    }
}