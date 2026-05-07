package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.PersonalEvent;
import com.internship.student_internship_tracker.service.PersonalEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class PersonalEventController {

    private final PersonalEventService eventService;

    // ── GET /api/events/user/{userId} ──────────────────────────────────────
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PersonalEvent>> getEvents(@PathVariable Long userId) {
        return ResponseEntity.ok(eventService.getEventsByUser(userId));
    }

    // ── POST /api/events ───────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> body) {
        try {
            Long    userId      = Long.valueOf(body.get("userId").toString());
            String  titre       = (String)  body.get("titre");
            String  date        = (String)  body.get("date");
            String  description = (String)  body.getOrDefault("description", "");
            boolean important   = Boolean.parseBoolean(
                body.getOrDefault("important", false).toString()
            );

            PersonalEvent event = eventService.createEvent(userId, titre, date, description, important);
            return ResponseEntity.ok(event);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT /api/events/{id} ───────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Long    userId      = Long.valueOf(body.get("userId").toString());
            String  titre       = (String)  body.get("titre");
            String  date        = (String)  body.get("date");
            String  description = (String)  body.getOrDefault("description", "");
            boolean important   = Boolean.parseBoolean(
                body.getOrDefault("important", false).toString()
            );

            PersonalEvent event = eventService.updateEvent(id, userId, titre, date, description, important);
            return ResponseEntity.ok(event);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT /api/events/{id}/important ─────────────────────────────────────
    @PutMapping("/{id}/important")
    public ResponseEntity<?> toggleImportant(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Long userId = Long.valueOf(body.get("userId").toString());
            return ResponseEntity.ok(eventService.toggleImportant(id, userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── DELETE /api/events/{id} ────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(
            @PathVariable Long id,
            @RequestParam Long userId
    ) {
        try {
            eventService.deleteEvent(id, userId);
            return ResponseEntity.ok(Map.of("message", "Événement supprimé."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}