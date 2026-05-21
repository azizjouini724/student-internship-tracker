package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.Message;
import com.internship.student_internship_tracker.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    // ── Envoyer un message à un utilisateur ─────────────────────────────
    @PostMapping
    public ResponseEntity<Map<String, Object>> envoyerMessage(@RequestBody Map<String, Object> body) {
        try {
            Long expediteurId = Long.valueOf(body.get("expediteurId").toString());
            Long destinataireId = Long.valueOf(body.get("destinataireId").toString());
            String contenu = (String) body.get("contenu");

            Message message = messageService.envoyerMessage(expediteurId, destinataireId, contenu);
            return ResponseEntity.ok(toMap(message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Envoyer à tous les étudiants de l'encadrant ─────────────────────
    @PostMapping("/tous")
    public ResponseEntity<?> envoyerATous(@RequestBody Map<String, Object> body) {
        try {
            Long encadrantId = Long.valueOf(body.get("encadrantId").toString());
            String contenu = (String) body.get("contenu");

            List<Message> messages = messageService.envoyerATous(encadrantId, contenu);
            List<Map<String, Object>> result = messages.stream()
                    .map(this::toMap)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Récupérer une conversation entre 2 utilisateurs ────────────────
    @GetMapping("/conversation")
    public ResponseEntity<List<Map<String, Object>>> getConversation(
            @RequestParam Long userId1,
            @RequestParam Long userId2) {
        List<Message> messages = messageService.getConversation(userId1, userId2);
        List<Map<String, Object>> result = messages.stream()
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Récupérer toutes les conversations d'un utilisateur ─────────────
    @GetMapping("/conversations/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getConversations(@PathVariable Long userId) {
        List<Message> messages = messageService.getConversations(userId);
        List<Map<String, Object>> result = messages.stream()
                .map(this::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Marquer comme lu ────────────────────────────────────────────────
    @PutMapping("/lu")
    public ResponseEntity<?> marquerCommeLu(@RequestBody Map<String, Object> body) {
        try {
            Long userId1 = Long.valueOf(body.get("userId1").toString());
            Long userId2 = Long.valueOf(body.get("userId2").toString());
            Long currentUserId = Long.valueOf(body.get("currentUserId").toString());
            messageService.marquerCommeLu(userId1, userId2, currentUserId);
            return ResponseEntity.ok(Map.of("message", "Messages marqués comme lus"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Nombre de messages non lus ─────────────────────────────────────
    @GetMapping("/non-lus/{userId}")
    public ResponseEntity<Map<String, Object>> countNonLus(@PathVariable Long userId) {
        long count = messageService.countNonLus(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    // ── Convertir Message en Map (évite boucle JSON) ───────────────────
    private Map<String, Object> toMap(Message m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("contenu", m.getContenu());
        map.put("dateEnvoi", m.getDateEnvoi() != null ? m.getDateEnvoi().toString() : null);
        map.put("estLu", m.getEstLu());
        map.put("conversationId", m.getConversationId());

        if (m.getExpediteur() != null) {
            Map<String, Object> exp = new HashMap<>();
            exp.put("id", m.getExpediteur().getId());
            exp.put("nom", m.getExpediteur().getNom());
            exp.put("photoUrl", m.getExpediteur().getPhotoUrl());
            map.put("expediteur", exp);
        }

        if (m.getDestinataire() != null) {
            Map<String, Object> dest = new HashMap<>();
            dest.put("id", m.getDestinataire().getId());
            dest.put("nom", m.getDestinataire().getNom());
            dest.put("photoUrl", m.getDestinataire().getPhotoUrl());
            map.put("destinataire", dest);
        }

        return map;
    }
}