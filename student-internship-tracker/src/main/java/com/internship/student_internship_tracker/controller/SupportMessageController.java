package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.SupportMessage;
import com.internship.student_internship_tracker.service.SupportMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportMessageController {

    private final SupportMessageService supportService;

    // ── POST /api/support — envoyer un message ─────────────────────────────
    @PostMapping
    public ResponseEntity<?> envoyerMessage(@RequestBody Map<String, Object> body) {
        try {
            Long   auteurId = Long.valueOf(body.get("auteurId").toString());
            String sujet    = (String) body.get("sujet");
            String type     = (String) body.getOrDefault("type", "question");
            String message  = (String) body.get("message");

            SupportMessage msg = supportService.envoyerMessage(auteurId, sujet, type, message);
            return ResponseEntity.ok(msg);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── GET /api/support — tous les messages (admin) ───────────────────────
    @GetMapping
    public ResponseEntity<List<SupportMessage>> getTousLesMessages() {
        return ResponseEntity.ok(supportService.getTousLesMessages());
    }

    // ── GET /api/support/non-lus — messages non lus (admin) ───────────────
    @GetMapping("/non-lus")
    public ResponseEntity<List<SupportMessage>> getMessagesNonLus() {
        return ResponseEntity.ok(supportService.getMessagesNonLus());
    }

    // ── GET /api/support/count — compter les non lus ──────────────────────
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> compterNonLus() {
        return ResponseEntity.ok(Map.of("nonLus", supportService.compterNonLus()));
    }

    // ── GET /api/support/user/{id} — messages d'un utilisateur ────────────
    @GetMapping("/user/{id}")
    public ResponseEntity<List<SupportMessage>> getMessagesParUtilisateur(@PathVariable Long id) {
        return ResponseEntity.ok(supportService.getMessagesParUtilisateur(id));
    }

    // ── PUT /api/support/{id}/lire — marquer comme lu ─────────────────────
    @PutMapping("/{id}/lire")
    public ResponseEntity<?> marquerLu(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(supportService.marquerLu(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT /api/support/{id}/repondre — répondre (admin) ─────────────────
    @PutMapping("/{id}/repondre")
    public ResponseEntity<?> repondre(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Long   adminId = Long.valueOf(body.get("adminId").toString());
            String reponse = (String) body.get("reponse");
            return ResponseEntity.ok(supportService.repondre(id, adminId, reponse));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT /api/support/{id}/statut — changer le statut ──────────────────
    @PutMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        try {
            return ResponseEntity.ok(supportService.changerStatut(id, body.get("statut")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── DELETE /api/support/{id} — supprimer ──────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimer(@PathVariable Long id) {
        try {
            supportService.supprimer(id);
            return ResponseEntity.ok(Map.of("message", "Message supprimé."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}