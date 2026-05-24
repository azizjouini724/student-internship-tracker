package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.Deadline;
import com.internship.student_internship_tracker.entity.Notification;
import com.internship.student_internship_tracker.entity.PersonalEvent;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.entity.Role;
import com.internship.student_internship_tracker.repository.DeadlineRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import com.internship.student_internship_tracker.repository.NotificationRepository;
import com.internship.student_internship_tracker.repository.PersonalEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeadlineService {

    private final DeadlineRepository deadlineRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final PersonalEventRepository personalEventRepository;

    public List<Deadline> getAllDeadlines() {
        return deadlineRepository.findAll();
    }

    public List<Deadline> getDeadlinesByEncadrant(Long encadrantId) {
        return deadlineRepository.findByEncadrantId(encadrantId);
    }

    // ── Créer une deadline ─────────────────────────────────────────────────
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

        // Notifier + Ajouter au calendrier de chaque étudiant encadré
        if (encadrant != null) {
            List<User> etudiants = userRepository.findByEncadrantIdAndRole(encadrantId, Role.ETUDIANT);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

            for (User etudiant : etudiants) {
                try {
                    Notification notif = Notification.builder()
                            .titre("Nouvelle deadline")
                            .message(encadrant.getNom() + " a ajoute une deadline : " + type
                                    + " — avant le " + dateLimite.format(formatter))
                            .estLue(false)
                            .dateEnvoi(LocalDateTime.now())
                            .user(etudiant)
                            .build();
                    notificationRepository.save(notif);
                } catch (Exception e) {
                    System.out.println("Erreur notification: " + e.getMessage());
                }

                try {
                    PersonalEvent event = new PersonalEvent();
                    event.setUser(etudiant);
                    event.setTitre(type);
                    event.setDate(dateLimite);
                    event.setDescription("Deadline de " + encadrant.getNom() + " — " + type);
                    event.setImportant(true);
                    personalEventRepository.save(event);
                } catch (Exception e) {
                    System.out.println("Erreur PersonalEvent: " + e.getMessage());
                }
            }
        }

        return saved;
    }

    public Deadline createDeadline(String type, LocalDate dateLimite) {
        return createDeadline(type, dateLimite, null);
    }

    // ── Modifier une deadline + notifier ────────────────────────────────────
    public Deadline updateDeadline(Long id, String type, LocalDate dateLimite) {
        Deadline deadline = deadlineRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Deadline introuvable : " + id));

        boolean dateChanged = dateLimite != null && !dateLimite.equals(deadline.getDateLimite());
        LocalDate ancienneDate = deadline.getDateLimite();

        if (type != null && !type.isBlank()) {
            deadline.setType(type);
        }
        if (dateLimite != null) {
            deadline.setDateLimite(dateLimite);
        }

        Deadline saved = deadlineRepository.save(deadline);

        // Si la date a changé → notifier + mettre à jour calendrier
        if (dateChanged && deadline.getEncadrant() != null) {
            User encadrant = deadline.getEncadrant();
            List<User> etudiants = userRepository.findByEncadrantIdAndRole(encadrant.getId(), Role.ETUDIANT);
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String ancienneStr = ancienneDate.format(formatter);
            String nouvelleStr = dateLimite.format(formatter);

            for (User etudiant : etudiants) {
                // Notification
                try {
                    Notification notif = Notification.builder()
                            .titre("Deadline modifiee")
                            .message(encadrant.getNom() + " a modifie la deadline \"" + deadline.getType()
                                    + "\" : " + ancienneStr + " -> " + nouvelleStr)
                            .estLue(false)
                            .dateEnvoi(LocalDateTime.now())
                            .user(etudiant)
                            .build();
                    notificationRepository.save(notif);
                } catch (Exception e) {
                    System.out.println("Erreur notif update: " + e.getMessage());
                }

                // Mettre à jour le PersonalEvent
                try {
                    List<PersonalEvent> events = personalEventRepository.findByUserIdOrderByDateAsc(etudiant.getId());
                    for (PersonalEvent event : events) {
                        if (event.getDate().equals(ancienneDate)
                            && event.getTitre().contains(deadline.getType())) {
                            event.setDate(dateLimite);
                            personalEventRepository.save(event);
                        }
                    }
                } catch (Exception e) {
                    System.out.println("Erreur update event: " + e.getMessage());
                }
            }
        }

        return saved;
    }

    public void deleteDeadline(Long id) {
        deadlineRepository.deleteById(id);
    }
}