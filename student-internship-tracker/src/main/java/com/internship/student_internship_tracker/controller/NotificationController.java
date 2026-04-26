package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.Notification;
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
}