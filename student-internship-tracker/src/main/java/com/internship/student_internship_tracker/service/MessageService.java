package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.Message;
import com.internship.student_internship_tracker.entity.Notification;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.entity.Role;
import com.internship.student_internship_tracker.repository.MessageRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import com.internship.student_internship_tracker.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    // ── Envoyer un message à un utilisateur ─────────────────────────────
    public Message envoyerMessage(Long expediteurId, Long destinataireId, String contenu) {
        User expediteur = userRepository.findById(expediteurId)
                .orElseThrow(() -> new RuntimeException("Expéditeur non trouvé"));
        User destinataire = userRepository.findById(destinataireId)
                .orElseThrow(() -> new RuntimeException("Destinataire non trouvé"));

        String conversationId = Message.generateConversationId(expediteurId, destinataireId);

        Message message = Message.builder()
                .expediteur(expediteur)
                .destinataire(destinataire)
                .contenu(contenu)
                .conversationId(conversationId)
                .dateEnvoi(LocalDateTime.now())
                .estLu(false)
                .build();

        Message saved = messageRepository.save(message);

        // Notification automatique au destinataire
        Notification notif = Notification.builder()
                .titre("Nouveau message 💬")
                .message(expediteur.getNom() + " vous a envoyé un message")
                .estLue(false)
                .dateEnvoi(LocalDateTime.now())
                .user(destinataire)
                .build();
        notificationRepository.save(notif);

        return saved;
    }

    // ── Envoyer un message à TOUS les étudiants de l'encadrant ──────────
    @Transactional
    public List<Message> envoyerATous(Long encadrantId, String contenu) {
        User encadrant = userRepository.findById(encadrantId)
                .orElseThrow(() -> new RuntimeException("Encadrant non trouvé"));

        // Récupérer tous les étudiants de cet encadrant
        List<User> etudiants = userRepository.findByEncadrantIdAndRole(encadrantId, Role.ETUDIANT);
        if (etudiants.isEmpty()) {
            throw new RuntimeException("Vous n'avez aucun étudiant assigné");
        }

        return etudiants.stream().map(etudiant -> {
            String conversationId = Message.generateConversationId(encadrantId, etudiant.getId());

            Message message = Message.builder()
                    .expediteur(encadrant)
                    .destinataire(etudiant)
                    .contenu(contenu)
                    .conversationId(conversationId)
                    .dateEnvoi(LocalDateTime.now())
                    .estLu(false)
                    .build();

            Message saved = messageRepository.save(message);

            // Notification pour chaque étudiant
            Notification notif = Notification.builder()
                    .titre("Message de votre encadrant 📢")
                    .message(encadrant.getNom() + " a envoyé un message à tous ses étudiants")
                    .estLue(false)
                    .dateEnvoi(LocalDateTime.now())
                    .user(etudiant)
                    .build();
            notificationRepository.save(notif);

            return saved;
        }).toList();
    }

    // ── Récupérer tous les messages d'une conversation ──────────────────
    public List<Message> getConversation(Long userId1, Long userId2) {
        String conversationId = Message.generateConversationId(userId1, userId2);
        return messageRepository.findByConversationIdOrderByDateEnvoiAsc(conversationId);
    }

    // ── Récupérer la liste des conversations d'un utilisateur ───────────
    public List<Message> getConversations(Long userId) {
        return messageRepository.findLatestByUserId(userId);
    }

    // ── Marquer les messages d'une conversation comme lus ───────────────
    @Transactional
    public void marquerCommeLu(Long conversationUserId1, Long conversationUserId2, Long currentUserId) {
        String conversationId = Message.generateConversationId(conversationUserId1, conversationUserId2);
        List<Message> nonLus = messageRepository
                .findByConversationIdAndDestinataireIdAndEstLuFalse(conversationId, currentUserId);
        nonLus.forEach(m -> m.setEstLu(true));
        messageRepository.saveAll(nonLus);
    }

    // ── Compter les messages non lus ────────────────────────────────────
    public long countNonLus(Long userId) {
        return messageRepository.countByDestinataireIdAndEstLuFalse(userId);
    }
}