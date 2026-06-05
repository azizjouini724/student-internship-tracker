package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.Deadline;
import com.internship.student_internship_tracker.entity.Notification;
import com.internship.student_internship_tracker.entity.NotificationType;
import com.internship.student_internship_tracker.entity.PersonalEvent;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.entity.Role;
import com.internship.student_internship_tracker.repository.DeadlineRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import com.internship.student_internship_tracker.repository.NotificationRepository;
import com.internship.student_internship_tracker.repository.PersonalEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
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

      
        // [*] CONTRAINTE : 1 création par semaine par encadrant
        if (encadrant != null) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime debutSemaine = now.with(DayOfWeek.MONDAY)
                    .withHour(0).withMinute(0).withSecond(0).withNano(0);

            List<Deadline> createdThisWeek = deadlineRepository
                    .findByEncadrantIdAndDateCreationAfter(encadrantId, debutSemaine);

            // [*] DEBUG — Regarde ça dans le terminal Spring Boot
            System.out.println("========== DEADLINE CREATION CHECK ==========");
            System.out.println("encadrantId = " + encadrantId);
            System.out.println("debutSemaine = " + debutSemaine);
            System.out.println("now = " + now);
            System.out.println("Deadlines creees cette semaine = " + createdThisWeek.size());

            if (!createdThisWeek.isEmpty()) {
                System.out.println("[!] BLOQUE ! Déjà " + createdThisWeek.size() + " deadline(s) cette semaine");
                LocalDateTime finSemaine = debutSemaine.plusWeeks(1);
                throw new IllegalArgumentException(
                    "Limite hebdomadaire atteinte : vous avez déjà créé une deadline cette semaine. "
                    + "Prochaine création possible le "
                    + finSemaine.format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
                );
            }
            System.out.println("[+] AUTORISE ! Aucune deadline cette semaine");
            System.out.println("==============================================");
        }

        Deadline deadline = Deadline.builder()
                .type(type)
                .dateLimite(dateLimite)
                .encadrant(encadrant)
                .dateCreation(LocalDateTime.now())
                .build();

        Deadline saved = deadlineRepository.save(deadline);

        // Notifier + Ajouter au calendrier de chaque etudiant encadre
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
                    System.out.println("[!] Erreur notification: " + e.getMessage());
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
                    System.out.println("[!] Erreur PersonalEvent: " + e.getMessage());
                }
            }
        }

        return saved;
    }

    public Deadline createDeadline(String type, LocalDate dateLimite) {
        return createDeadline(type, dateLimite, null);
    }

    // ── Modifier une deadline (illimite) ─────────────────────────────────────
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

        deadline.setDateModification(LocalDateTime.now());

        Deadline saved = deadlineRepository.save(deadline);

        // Si la date a change -> notifier + mettre a jour calendrier
        if (dateChanged && deadline.getEncadrant() != null) {
            User encadrant = deadline.getEncadrant();
            List<User> etudiants = userRepository.findByEncadrantIdAndRole(encadrant.getId(), Role.ETUDIANT);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String ancienneStr = ancienneDate.format(formatter);
            String nouvelleStr = dateLimite.format(formatter);

            for (User etudiant : etudiants) {
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
                    System.out.println("[!] Erreur notif update: " + e.getMessage());
                }

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
                    System.out.println("[!] Erreur update event: " + e.getMessage());
                }
            }
        }

        return saved;
    }

    public void deleteDeadline(Long id) {
        deadlineRepository.deleteById(id);
    }

    // [NEW] Vérifier les retards et notifier
    /**
     * Vérifie tous les deadlines dépassées et crée des notifications de retard
     * Cette méthode est appelée par le Scheduler tous les jours a 8h00
     */
    public void checkRetardsAndNotify() {
        System.out.println("[>>>] Vérification des retards de dépôt...");
        
        List<Deadline> allDeadlines = deadlineRepository.findAll();
        LocalDate today = LocalDate.now();
        int retardsDetectes = 0;
        
        for (Deadline deadline : allDeadlines) {
            // [+] Vérifier si la deadline est dépassée
            if (deadline.getDateLimite().isBefore(today)) {
                System.out.println("[TIME] Retard détecté : " + deadline.getType() + " (échéance: " + deadline.getDateLimite() + ")");
                
                // Trouver tous les étudiants encadrés par cet encadrant
                if (deadline.getEncadrant() != null) {
                    List<User> etudiants = userRepository.findByEncadrantIdAndRole(
                        deadline.getEncadrant().getId(), 
                        Role.ETUDIANT
                    );
                    
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                    String deadlineStr = deadline.getDateLimite().format(formatter);
                    
                    for (User etudiant : etudiants) {
                        try {
                            // Vérifier qu'une notification de retard n'existe pas déjà
                            // (éviter les doublons)
                            List<Notification> existantes = notificationRepository
                                .findByUserAndTypeOrderByDateEnvoiDesc(
                                    etudiant, 
                                    NotificationType.RETARD_DEPOT
                                );
                            
                            boolean dejaNotifie = existantes.stream()
                                .anyMatch(n -> n.getMessage().contains(deadline.getType()));
                            
                            if (!dejaNotifie) {
                                System.out.println("[MAIL] Notification envoyée a : " + etudiant.getNom());
                                
                                // Créer la notification de retard
                                Notification notif = Notification.builder()
                                        .titre("[TIME] Retard de dépôt détecté")
                                        .message(String.format(
                                            "Rapport '%s' était dû le %s. Veuillez le soumettre au plus tôt.",
                                            deadline.getType(),
                                            deadlineStr
                                        ))
                                        .estLue(false)
                                        .dateEnvoi(LocalDateTime.now())
                                        .type(NotificationType.RETARD_DEPOT)
                                        .user(etudiant)
                                        .build();
                                
                                notificationRepository.save(notif);
                                retardsDetectes++;
                            }
                        } catch (Exception e) {
                            System.out.println("[ERROR] Erreur notification retard: " + e.getMessage());
                        }
                    }
                }
            }
        }
        
        System.out.println("[OK] Vérification terminée. " + retardsDetectes + " retard(s) détecté(s)");
    }
}