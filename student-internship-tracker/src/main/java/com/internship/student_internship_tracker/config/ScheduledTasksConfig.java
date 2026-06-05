package com.internship.student_internship_tracker.config;

import com.internship.student_internship_tracker.service.DeadlineService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScheduledTasksConfig {

    private final DeadlineService deadlineService;

    // [TASK] Vérifie les retards chaque jour a 8h00
    @Scheduled(cron = "0 0 8 * * *")
    public void checkRetardsDailyAt8AM() {
        System.out.println("[SCHEDULER] ===== Tâche planifiée démarrée à 8h00 =====");
        try {
            deadlineService.checkRetardsAndNotify();
            System.out.println("[SCHEDULER] ===== Tâche planifiée terminée =====");
        } catch (Exception e) {
            System.out.println("[SCHEDULER] [ERROR] Erreur lors de la vérification des retards: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // [ALTERNATIVE] Vérifier aussi toutes les heures (optionnel)
    @Scheduled(fixedDelay = 3600000) // 1 heure en millisecondes
    public void checkRetardsEveryHour() {
        System.out.println("[SCHEDULER] [HOURLY] Vérification horaire des retards...");
        try {
            deadlineService.checkRetardsAndNotify();
        } catch (Exception e) {
            System.out.println("[SCHEDULER] [ERROR] Erreur vérification horaire: " + e.getMessage());
        }
    }
}