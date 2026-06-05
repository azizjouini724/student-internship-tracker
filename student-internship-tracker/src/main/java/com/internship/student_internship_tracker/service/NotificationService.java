package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.Notification;
import com.internship.student_internship_tracker.entity.NotificationType;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.NotificationRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // ✅ Méthodes existantes
    public List<Notification> getMesNotifications(Long userId) {
        return notificationRepository.findByUserId(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndEstLueFalse(userId);
    }

    public Notification createNotification(String titre, String message, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        Notification notification = Notification.builder()
                .titre(titre)
                .message(message)
                .estLue(false)
                .dateEnvoi(LocalDateTime.now())
                .user(user)
                .build();

        return notificationRepository.save(notification);
    }

    public Notification marquerCommeLue(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée"));
        notification.setEstLue(true);
        return notificationRepository.save(notification);
    }

    // ✨ NOUVELLES MÉTHODES POUR LES RETARDS

    /**
     * Crée une notification de retard de dépôt
     * @param userId L'étudiant en retard
     * @param rapportTitre Titre du rapport
     * @param deadlineDate Date limite dépassée
     */
    public Notification createRetardNotification(Long userId, String rapportTitre, String deadlineDate) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return null;

        User user = userOpt.get();
        Notification notification = Notification.builder()
                .titre("⏰ Retard de dépôt détecté")
                .message(String.format("Rapport '%s' était dû le %s. Veuillez le soumettre au plus tôt.",
                        rapportTitre, deadlineDate))
                .estLue(false)
                .dateEnvoi(LocalDateTime.now())
                .type(NotificationType.RETARD_DEPOT)  // ← Type RETARD
                .user(user)
                .build();

        return notificationRepository.save(notification);
    }

    /**
     * Crée une notification de deadline qui approche
     */
    public Notification createDeadlineApprocheNotification(Long userId, String deadlineDate) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return null;

        User user = userOpt.get();
        Notification notification = Notification.builder()
                .titre("⏰ Deadline approche")
                .message(String.format("Une deadline approche : %s", deadlineDate))
                .estLue(false)
                .dateEnvoi(LocalDateTime.now())
                .type(NotificationType.DEADLINE_APPROCHE)  // ← Type DEADLINE_APPROCHE
                .user(user)
                .build();

        return notificationRepository.save(notification);
    }

    /**
     * Récupère les notifications d'un type spécifique pour un user
     * @param userId L'utilisateur
     * @param type Le type de notification (ex: RETARD_DEPOT)
     */
    public List<Notification> getNotificationsByType(Long userId, NotificationType type) {
        Optional<User> userOpt = userRepository.findById(userId);
        return userOpt.map(user -> 
            notificationRepository.findByUserAndTypeOrderByDateEnvoiDesc(user, type)
        ).orElse(List.of());
    }

    /**
     * Compte les retards NON lus pour un user
     * @param userId L'étudiant
     */
    public long countRetardsNonLus(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        return userOpt.map(user -> 
            notificationRepository.countByUserAndEstLueAndType(user, false, NotificationType.RETARD_DEPOT)
        ).orElse(0L);
    }

    /**
     * Récupère TOUS les retards non lus (pour le scheduler)
     */
    public List<Notification> getAllRetardsNonLus() {
        return notificationRepository.findByTypeAndEstLueFalse(NotificationType.RETARD_DEPOT);
    }

    /**
     * Supprime une notification
     */
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
}