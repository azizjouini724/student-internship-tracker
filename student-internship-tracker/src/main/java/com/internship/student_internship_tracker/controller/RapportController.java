package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.Rapport;
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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rapports")
@RequiredArgsConstructor
public class RapportController {

    private final RapportService     rapportService;
    private final FileStorageService fileStorageService;

    // ── GET tous les rapports ──────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<Rapport>> getAllRapports() {
        return ResponseEntity.ok(rapportService.getAllRapports());
    }

    // ── GET rapports d'un étudiant ─────────────────────────────────────────
    @GetMapping("/etudiant/{id}")
    public ResponseEntity<List<Rapport>> getRapportsByEtudiant(@PathVariable Long id) {
        return ResponseEntity.ok(rapportService.getRapportsByEtudiant(id));
    }

    // ── GET rapports d'un encadrant ────────────────────────────────────────
    @GetMapping("/encadrant/{id}")
    public ResponseEntity<List<Rapport>> getRapportsByEncadrant(@PathVariable Long id) {
        return ResponseEntity.ok(rapportService.getRapportsByEncadrant(id));
    }

    // ── GET un rapport par ID ──────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Rapport> getRapportById(@PathVariable Long id) {
        return ResponseEntity.ok(rapportService.getRapportById(id));
    }

    // ── POST créer rapport avec fichier (multipart) ────────────────────────
    /**
     * Endpoint principal : accepte un fichier joint (PDF, Word, etc.)
     *
     * Form-data params :
     *   - titre        (String, requis)
     *   - auteurId     (Long,   requis)
     *   - encadrantId  (Long,   optionnel)
     *   - fichier      (MultipartFile, requis)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createRapportAvecFichier(
            @RequestParam("titre")                        String        titre,
            @RequestParam("auteurId")                     Long          auteurId,
            @RequestParam(value = "encadrantId", required = false) Long encadrantId,
            @RequestParam(value = "fichier",     required = false) MultipartFile fichier
    ) {
        try {
            Rapport rapport = rapportService.createRapport(titre, auteurId, encadrantId, fichier);
            return ResponseEntity.ok(rapport);
        } catch (IllegalArgumentException e) {
            // Erreur de validation (format, taille...)
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

            Rapport rapport = rapportService.createRapportTexte(titre, contenu, auteurId, encadrantId);
            return ResponseEntity.ok(rapport);
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
            return ResponseEntity.ok(rapport);
        } catch (RuntimeException e) {
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
    /**
     * Permet au frontend de télécharger ou afficher le fichier joint.
     * URL : GET /api/rapports/{id}/fichier
     */
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

            // Détermine le type MIME
            String contentType = rapport.getFichierType() != null
                ? rapport.getFichierType()
                : "application/octet-stream";

            // Inline pour les PDF (affichage dans navigateur), attachment pour le reste
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
}