package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.Commentaire;
import com.internship.student_internship_tracker.entity.Rapport;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.CommentaireRepository;
import com.internship.student_internship_tracker.repository.RapportRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/commentaires")
@RequiredArgsConstructor
public class CommentaireController {

    private final CommentaireRepository commentaireRepository;
    private final RapportRepository rapportRepository;
    private final UserRepository userRepository;

    // ── GET commentaires d'un rapport ───────────────────────────────────────
    @GetMapping("/rapport/{rapportId}")
    public ResponseEntity<List<Map<String, Object>>> getByRapport(@PathVariable Long rapportId) {
        List<Commentaire> commentaires = commentaireRepository.findByRapportId(rapportId);
        List<Map<String, Object>> result = commentaires.stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── POST créer un commentaire ──────────────────────────────────────────
    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        try {
            String contenu = (String) body.get("contenu");
            Long rapportId = Long.valueOf(body.get("rapportId").toString());
            Long auteurId = Long.valueOf(body.get("auteurId").toString());

            Rapport rapport = rapportRepository.findById(rapportId)
                    .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
            User auteur = userRepository.findById(auteurId)
                    .orElseThrow(() -> new RuntimeException("Auteur non trouvé"));

            Commentaire commentaire = Commentaire.builder()
                    .contenu(contenu)
                    .dateCreation(LocalDateTime.now())
                    .rapport(rapport)
                    .auteur(auteur)
                    .build();

            Commentaire saved = commentaireRepository.save(commentaire);
            return ResponseEntity.ok(toMap(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Convertir en Map (évite boucle JSON) ──────────────────────────────
    private Map<String, Object> toMap(Commentaire c) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", c.getId());
        map.put("contenu", c.getContenu());
        map.put("dateCreation", c.getDateCreation() != null ? c.getDateCreation().toString() : null);
        if (c.getAuteur() != null) {
            Map<String, Object> auteurMap = new HashMap<>();
            auteurMap.put("id", c.getAuteur().getId());
            auteurMap.put("nom", c.getAuteur().getNom());
            map.put("auteur", auteurMap);
        }
        return map;
    }
}