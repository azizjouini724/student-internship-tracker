package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.Notification;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.NotificationRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

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
}