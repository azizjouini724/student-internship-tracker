package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.Commentaire;
import com.internship.student_internship_tracker.entity.Rapport;
import com.internship.student_internship_tracker.repository.CommentaireRepository;
import com.internship.student_internship_tracker.repository.RapportRepository;
import com.internship.student_internship_tracker.service.FileStorageService;
import com.internship.student_internship_tracker.service.RapportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rapports")
@RequiredArgsConstructor
public class RapportController {

    private final RapportService     rapportService;
    private final FileStorageService fileStorageService;
    private final CommentaireRepository commentaireRepository;
    private final RapportRepository rapportRepository;

    // ── GET tous les rapports ──────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllRapports() {
        List<Rapport> rapports = rapportService.getAllRapports();
        return ResponseEntity.ok(rapports.stream().map(this::toMap).collect(Collectors.toList()));
    }

    // ── GET rapports d'un étudiant ─────────────────────────────────────────
    @GetMapping("/etudiant/{id}")
    public ResponseEntity<List<Map<String, Object>>> getRapportsByEtudiant(@PathVariable Long id) {
        List<Rapport> rapports = rapportService.getRapportsByEtudiant(id);
        return ResponseEntity.ok(rapports.stream().map(this::toMap).collect(Collectors.toList()));
    }

    // ── GET rapports d'un encadrant ────────────────────────────────────────
    @GetMapping("/encadrant/{id}")
    public ResponseEntity<List<Map<String, Object>>> getRapportsByEncadrant(@PathVariable Long id) {
        List<Rapport> rapports = rapportService.getRapportsByEncadrant(id);
        return ResponseEntity.ok(rapports.stream().map(this::toMap).collect(Collectors.toList()));
    }

    // ── GET un rapport par ID ──────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getRapportById(@PathVariable Long id) {
        return ResponseEntity.ok(toMap(rapportService.getRapportById(id)));
    }

    // ── GET commentaires d'un rapport ──────────────────────────────────────
    @GetMapping("/{id}/commentaires")
    public ResponseEntity<List<Map<String, Object>>> getCommentaires(@PathVariable Long id) {
        List<Commentaire> commentaires = commentaireRepository.findByRapportId(id);
        List<Map<String, Object>> result = commentaires.stream().map(c -> {
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
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── POST créer rapport avec fichier (multipart) ────────────────────────
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createRapportAvecFichier(
            @RequestParam("titre")                        String        titre,
            @RequestParam("auteurId")                     Long          auteurId,
            @RequestParam(value = "encadrantId", required = false) Long encadrantId,
            @RequestParam(value = "deadlineId",  required = false) Long deadlineId,
            @RequestParam(value = "fichier",     required = false) MultipartFile fichier
    ) {
        try {
            Rapport rapport = rapportService.createRapport(titre, auteurId, encadrantId, fichier);
            rapport.setDeadlineId(deadlineId);
            Rapport saved = rapportRepository.save(rapport);
            return ResponseEntity.ok(toMap(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Erreur lors de la sauvegarde du fichier : " + e.getMessage()));
        }
    }

    // ── POST créer rapport texte (JSON — compatibilité GraphQL) ───────────
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createRapportTexte(@RequestBody Map<String, Object> body) {
        try {
            String titre       = (String) body.get("titre");
            String contenu     = (String) body.get("contenu");
            Long   auteurId    = Long.valueOf(body.get("auteurId").toString());
            Long   encadrantId = body.get("encadrantId") != null
                ? Long.valueOf(body.get("encadrantId").toString()) : null;
            Long   deadlineId  = body.get("deadlineId") != null
                ? Long.valueOf(body.get("deadlineId").toString()) : null;

            Rapport rapport = rapportService.createRapportTexte(titre, contenu, auteurId, encadrantId);
            rapport.setDeadlineId(deadlineId);
            Rapport saved = rapportRepository.save(rapport);
            return ResponseEntity.ok(toMap(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT valider / rejeter ──────────────────────────────────────────────
    @PutMapping("/{id}/valider")
    public ResponseEntity<?> validerRapport(
            @PathVariable Long id,
            @RequestBody  Map<String, String> body
    ) {
        try {
            String  statut  = body.get("statut");
            Rapport rapport = rapportService.validerRapport(id, statut);
            return ResponseEntity.ok(toMap(rapport));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT score ──────────────────────────────────────────────────────────
    @PutMapping("/{id}/score")
    public ResponseEntity<?> updateScore(
            @PathVariable Long id,
            @RequestBody  Map<String, Object> body
    ) {
        try {
            Rapport rapport = rapportService.getRapportById(id);
            if (body.containsKey("score")) {
                rapport.setScore(((Number) body.get("score")).intValue());
            }
            Rapport saved = rapportRepository.save(rapport);
            return ResponseEntity.ok(toMap(saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── DELETE supprimer un rapport ────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRapport(@PathVariable Long id) {
        try {
            rapportService.deleteRapport(id);
            return ResponseEntity.ok(Map.of("message", "Rapport supprimé avec succès."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── GET télécharger/afficher le fichier d'un rapport ──────────────────
    @GetMapping("/{id}/fichier")
    public ResponseEntity<Resource> downloadFichier(@PathVariable Long id) {
        Rapport rapport = rapportService.getRapportById(id);

        if (rapport.getFichierChemin() == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            Path filePath = fileStorageService.getFilePath(rapport.getFichierChemin());
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = rapport.getFichierType() != null
                ? rapport.getFichierType()
                : "application/octet-stream";

            String disposition = contentType.equals("application/pdf")
                ? "inline"
                : "attachment";

            String filename = rapport.getFichierNom() != null
                ? rapport.getFichierNom()
                : "rapport_" + id;

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    disposition + "; filename=\"" + filename + "\"")
                .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── toMap ──────────────────────────────────────────────────────────────
    private Map<String, Object> toMap(Rapport r) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", r.getId());
        map.put("titre", r.getTitre());
        map.put("contenu", r.getContenu());
        map.put("statut", r.getStatut());
        map.put("dateDepot", r.getDateDepot() != null ? r.getDateDepot().toString() : null);
        map.put("score", r.getScore());
        map.put("deadlineId", r.getDeadlineId());
        map.put("fichierNom", r.getFichierNom());
        map.put("fichierChemin", r.getFichierChemin());
        map.put("fichierType", r.getFichierType());
        map.put("fichierTaille", r.getFichierTaille());
        if (r.getAuteur() != null) {
            Map<String, Object> auteurMap = new HashMap<>();
            auteurMap.put("id", r.getAuteur().getId());
            auteurMap.put("nom", r.getAuteur().getNom());
            auteurMap.put("email", r.getAuteur().getEmail());
            map.put("auteur", auteurMap);
            map.put("auteurId", r.getAuteur().getId());
            map.put("auteurNom", r.getAuteur().getNom());
        }
        if (r.getEncadrant() != null) {
            Map<String, Object> encadrantMap = new HashMap<>();
            encadrantMap.put("id", r.getEncadrant().getId());
            encadrantMap.put("nom", r.getEncadrant().getNom());
            map.put("encadrant", encadrantMap);
            map.put("encadrantId", r.getEncadrant().getId());
            map.put("encadrantNom", r.getEncadrant().getNom());
        }
        return map;
    }
}