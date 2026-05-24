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

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PersonalEvent>> getEvents(@PathVariable Long userId) {
        return ResponseEntity.ok(eventService.getEventsByUser(userId));
    }

    // ✅ FIX : accepte "date" OU "dateEcheance"
    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> body) {
        try {
            Long    userId      = Long.valueOf(body.get("userId").toString());
            String  titre       = (String)  body.get("titre");
            // ✅ Accepte les deux noms
            String  date        = (String)  body.getOrDefault("dateEcheance", body.get("date"));
            String  description = (String)  body.getOrDefault("description", "");
            boolean important   = Boolean.parseBoolean(
                body.getOrDefault("important", false).toString()
            );

            if (titre == null || titre.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "Le titre est requis"));
            if (date == null || date.isBlank())
                return ResponseEntity.badRequest().body(Map.of("error", "La date est requise"));

            PersonalEvent event = eventService.createEvent(userId, titre, date, description, important);
            return ResponseEntity.ok(event);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Long    userId      = Long.valueOf(body.get("userId").toString());
            String  titre       = (String)  body.get("titre");
            String  date        = (String)  body.getOrDefault("dateEcheance", body.get("date"));
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

    // ✅ FIX : userId optionnel dans le body
    @PutMapping("/{id}/important")
    public ResponseEntity<?> toggleImportant(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        try {
            Long userId = null;
            if (body != null && body.containsKey("userId")) {
                userId = Long.valueOf(body.get("userId").toString());
            }
            return ResponseEntity.ok(eventService.toggleImportant(id, userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

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