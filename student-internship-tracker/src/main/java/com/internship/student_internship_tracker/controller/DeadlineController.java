package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.Deadline;
import com.internship.student_internship_tracker.service.DeadlineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deadlines")
@RequiredArgsConstructor
public class DeadlineController {

    private final DeadlineService deadlineService;

    @GetMapping
    public ResponseEntity<List<Deadline>> getAllDeadlines() {
        return ResponseEntity.ok(deadlineService.getAllDeadlines());
    }

    @PostMapping
    public ResponseEntity<Deadline> createDeadline(@RequestBody Map<String, String> body) {
        Deadline deadline = deadlineService.createDeadline(
            body.get("type"),
            LocalDate.parse(body.get("dateLimite"))
        );
        return ResponseEntity.ok(deadline);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDeadline(@PathVariable Long id) {
        deadlineService.deleteDeadline(id);
        return ResponseEntity.ok("Deadline supprimée");
    }
}
