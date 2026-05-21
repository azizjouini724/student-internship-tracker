package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.Deadline;
import com.internship.student_internship_tracker.service.DeadlineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/deadlines")
@RequiredArgsConstructor
public class DeadlineController {

    private final DeadlineService deadlineService;

    // ✅ Toutes les deadlines (admin) — en Map pour éviter boucle JSON
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllDeadlines() {
        List<Deadline> deadlines = deadlineService.getAllDeadlines();
        return ResponseEntity.ok(deadlines.stream().map(this::toMap).collect(Collectors.toList()));
    }

    // ✅ Deadlines d'un encadrant — en Map pour éviter boucle JSON
    @GetMapping("/encadrant/{encadrantId}")
    public ResponseEntity<List<Map<String, Object>>> getDeadlinesByEncadrant(@PathVariable Long encadrantId) {
        List<Deadline> deadlines = deadlineService.getDeadlinesByEncadrant(encadrantId);
        return ResponseEntity.ok(deadlines.stream().map(this::toMap).collect(Collectors.toList()));
    }

    // ✅ Create avec encadrantId
    @PostMapping
    public ResponseEntity<Map<String, Object>> createDeadline(@RequestBody Map<String, String> body) {
        String type = body.get("type");
        LocalDate dateLimite = LocalDate.parse(body.get("dateLimite"));

        Long encadrantId = null;
        if (body.containsKey("encadrantId") && body.get("encadrantId") != null) {
            try {
                encadrantId = Long.parseLong(body.get("encadrantId"));
            } catch (NumberFormatException e) {
                encadrantId = null;
            }
        }

        Deadline deadline = deadlineService.createDeadline(type, dateLimite, encadrantId);
        return ResponseEntity.ok(toMap(deadline));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDeadline(@PathVariable Long id) {
        deadlineService.deleteDeadline(id);
        return ResponseEntity.ok(Map.of("message", "Deadline supprimée"));
    }

    // ⭐ Méthode utilitaire — Convertir Deadline en Map (évite boucle JSON)
    private Map<String, Object> toMap(Deadline d) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", d.getId());
        map.put("type", d.getType() != null ? d.getType() : "");
        map.put("titre", d.getType() != null ? d.getType() : "");  // Frontend utilise "titre"
        map.put("dateLimite", d.getDateLimite() != null ? d.getDateLimite().toString() : null);
        map.put("encadrantId", d.getEncadrant() != null ? d.getEncadrant().getId() : null);
        map.put("encadrantNom", d.getEncadrant() != null ? d.getEncadrant().getNom() : null);
        return map;
    }
}