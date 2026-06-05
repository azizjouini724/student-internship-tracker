package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.Notification;
import com.internship.student_internship_tracker.entity.NotificationType;
import com.internship.student_internship_tracker.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // ✅ Endpoints existants
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getMesNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getMesNotifications(userId));
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(userId));
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Map<String, String> body) {
        Notification notification = notificationService.createNotification(
            body.get("titre"),
            body.get("message"),
            Long.parseLong(body.get("userId"))
        );
        return ResponseEntity.ok(notification);
    }

    @PutMapping("/{id}/lire")
    public ResponseEntity<Notification> marquerCommeLue(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.marquerCommeLue(id));
    }

    // ✨ NOUVEAUX ENDPOINTS POUR LES RETARDS

    /**
     * Récupère les notifications d'un type spécifique pour un user
     * GET /api/notifications/user/{userId}/type/RETARD_DEPOT
     */
    @GetMapping("/user/{userId}/type/{type}")
    public ResponseEntity<List<Notification>> getNotificationsByType(
            @PathVariable Long userId,
            @PathVariable NotificationType type) {
        return ResponseEntity.ok(notificationService.getNotificationsByType(userId, type));
    }

    /**
     * Compte les retards NON lus pour un user
     * GET /api/notifications/user/{userId}/retards/count
     */
    @GetMapping("/user/{userId}/retards/count")
    public ResponseEntity<Long> countRetardsNonLus(@PathVariable Long userId) {
        return ResponseEntity.ok(notificationService.countRetardsNonLus(userId));
    }

    /**
     * Récupère TOUS les retards non lus (pour le scheduler)
     * GET /api/notifications/retards/non-lus
     */
    @GetMapping("/retards/non-lus")
    public ResponseEntity<List<Notification>> getAllRetardsNonLus() {
        return ResponseEntity.ok(notificationService.getAllRetardsNonLus());
    }

    /**
     * Supprime une notification
     * DELETE /api/notifications/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }
}