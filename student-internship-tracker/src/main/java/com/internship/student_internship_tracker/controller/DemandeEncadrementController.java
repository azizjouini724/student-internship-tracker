package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.DemandeEncadrement;
import com.internship.student_internship_tracker.service.DemandeEncadrementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demandes")
@RequiredArgsConstructor
public class DemandeEncadrementController {

    private final DemandeEncadrementService demandeService;

    @PostMapping
    public ResponseEntity<?> soumettreDemande(@RequestBody Map<String, Object> body) {
        try {
            DemandeEncadrement demande = demandeService.soumettreDemande(
                Long.parseLong(body.get("etudiantId").toString()),
                Long.parseLong(body.get("encadrantId").toString()),
                body.get("message").toString()
            );
            return ResponseEntity.ok(demande);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/repondre")
    public ResponseEntity<?> repondre(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        try {
            DemandeEncadrement demande = demandeService.repondre(id, body.get("accepte"));
            return ResponseEntity.ok(demande);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/encadrant/{encadrantId}")
    public ResponseEntity<List<DemandeEncadrement>> getDemandesEncadrant(
            @PathVariable Long encadrantId) {
        return ResponseEntity.ok(demandeService.getDemandesEncadrant(encadrantId));
    }

    @GetMapping("/etudiant/{etudiantId}")
    public ResponseEntity<List<DemandeEncadrement>> getDemandesEtudiant(
            @PathVariable Long etudiantId) {
        return ResponseEntity.ok(demandeService.getDemandesEtudiant(etudiantId));
    }

    @GetMapping("/encadrant/{encadrantId}/en-attente")
    public ResponseEntity<List<DemandeEncadrement>> getDemandesEnAttente(
            @PathVariable Long encadrantId) {
        return ResponseEntity.ok(demandeService.getDemandesEnAttente(encadrantId));
    }
}