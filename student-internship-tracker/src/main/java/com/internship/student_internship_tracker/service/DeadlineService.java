package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.Deadline;
import com.internship.student_internship_tracker.entity.Notification;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.entity.Role;
import com.internship.student_internship_tracker.repository.DeadlineRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import com.internship.student_internship_tracker.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeadlineService {

    private final DeadlineRepository deadlineRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;  // ⭐ AJOUT

    public List<Deadline> getAllDeadlines() {
        return deadlineRepository.findAll();
    }

    public List<Deadline> getDeadlinesByEncadrant(Long encadrantId) {
        return deadlineRepository.findByEncadrantId(encadrantId);
    }

    // ⭐ MODIFIÉ — Create avec encadrant + notification automatique
    public Deadline createDeadline(String type, LocalDate dateLimite, Long encadrantId) {
        User encadrant = null;
        if (encadrantId != null) {
            encadrant = userRepository.findById(encadrantId).orElse(null);
        }

        Deadline deadline = Deadline.builder()
                .type(type)
                .dateLimite(dateLimite)
                .encadrant(encadrant)
                .build();

        Deadline saved = deadlineRepository.save(deadline);

        // ⭐ NOUVEAU — Notifier tous les étudiants de cet encadrant
        if (encadrant != null) {
            List<User> etudiants = userRepository.findByEncadrantIdAndRole(encadrantId, Role.ETUDIANT);

            for (User etudiant : etudiants) {
                Notification notif = Notification.builder()
                        .titre("Nouvelle deadline 📅")
                        .message(encadrant.getNom() + " a ajouté une deadline : " + type
                                + " — avant le " + dateLimite.format(
                                    java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                        .estLue(false)
                        .dateEnvoi(LocalDateTime.now())
                        .user(etudiant)
                        .build();
                notificationRepository.save(notif);
            }
        }

        return saved;
    }

    public Deadline createDeadline(String type, LocalDate dateLimite) {
        return createDeadline(type, dateLimite, null);
    }

    public void deleteDeadline(Long id) {
        deadlineRepository.deleteById(id);
    }
}