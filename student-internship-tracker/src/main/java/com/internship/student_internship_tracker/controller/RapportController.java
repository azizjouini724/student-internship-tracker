package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.Rapport;
import com.internship.student_internship_tracker.service.RapportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rapports")
@RequiredArgsConstructor
public class RapportController {

    private final RapportService rapportService;

    @GetMapping
    public ResponseEntity<List<Rapport>> getAllRapports() {
        return ResponseEntity.ok(rapportService.getAllRapports());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rapport> getRapportById(@PathVariable Long id) {
        return ResponseEntity.ok(rapportService.getRapportById(id));
    }

    @GetMapping("/etudiant/{auteurId}")
    public ResponseEntity<List<Rapport>> getRapportsByEtudiant(@PathVariable Long auteurId) {
        return ResponseEntity.ok(rapportService.getRapportsByEtudiant(auteurId));
    }

    @GetMapping("/encadrant/{encadrantId}")
    public ResponseEntity<List<Rapport>> getRapportsByEncadrant(@PathVariable Long encadrantId) {
        return ResponseEntity.ok(rapportService.getRapportsByEncadrant(encadrantId));
    }

    @PostMapping
    public ResponseEntity<Rapport> createRapport(@RequestBody Map<String, String> body) {
        Rapport rapport = rapportService.createRapport(
            body.get("titre"),
            body.get("contenu"),
            Long.parseLong(body.get("auteurId")),
            Long.parseLong(body.get("encadrantId"))
        );
        return ResponseEntity.ok(rapport);
    }

    @PutMapping("/{id}/valider")
    public ResponseEntity<Rapport> validerRapport(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(rapportService.validerRapport(id, body.get("statut")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRapport(@PathVariable Long id) {
        rapportService.deleteRapport(id);
        return ResponseEntity.ok("Rapport supprimé");
    }
}