package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.Rapport;
import com.internship.student_internship_tracker.entity.Rapport.StatutRapport;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.entity.Notification;
import com.internship.student_internship_tracker.repository.RapportRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RapportService {

    private final RapportRepository      rapportRepository;
    private final UserRepository         userRepository;
    private final FileStorageService     fileStorageService;
    private final NotificationService    notificationService;

    // ── Lister tous les rapports ───────────────────────────────────────────
    public List<Rapport> getAllRapports() {
        return rapportRepository.findAll();
    }

    // ── Rapports d'un étudiant ─────────────────────────────────────────────
    public List<Rapport> getRapportsByEtudiant(Long etudiantId) {
        return rapportRepository.findByAuteurId(etudiantId);
    }

    // ── Rapports d'un encadrant (ses étudiants) ────────────────────────────
    public List<Rapport> getRapportsByEncadrant(Long encadrantId) {
        return rapportRepository.findByEncadrantId(encadrantId);
    }

    // ── Un rapport par ID ──────────────────────────────────────────────────
    public Rapport getRapportById(Long id) {
        return rapportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Rapport introuvable : " + id));
    }

    // ── Créer un rapport avec fichier ──────────────────────────────────────
    public Rapport createRapport(
            String titre,
            Long auteurId,
            Long encadrantId,
            MultipartFile fichier
    ) throws IOException {

        // Validation titre
        if (titre == null || titre.isBlank()) {
            throw new IllegalArgumentException("Le titre est obligatoire.");
        }

        // Récupérer l'auteur
        User auteur = userRepository.findById(auteurId)
            .orElseThrow(() -> new RuntimeException("Étudiant introuvable : " + auteurId));

        // Récupérer l'encadrant (optionnel)
        User encadrant = null;
        if (encadrantId != null) {
            encadrant = userRepository.findById(encadrantId)
                .orElseThrow(() -> new RuntimeException("Encadrant introuvable : " + encadrantId));
        }

        // Sauvegarder le fichier
        Rapport rapport = new Rapport();
        rapport.setTitre(titre);
        rapport.setAuteur(auteur);
        rapport.setEncadrant(encadrant);
        rapport.setStatut(StatutRapport.SOUMIS);
        rapport.setDateDepot(LocalDateTime.now());

        if (fichier != null && !fichier.isEmpty()) {
            String cheminFichier = fileStorageService.saveFile(fichier);
            rapport.setFichierNom(fichier.getOriginalFilename());
            rapport.setFichierChemin(cheminFichier);
            rapport.setFichierType(fichier.getContentType());
            rapport.setFichierTaille(fichier.getSize());
        }

        Rapport saved = rapportRepository.save(rapport);

        // Notification à l'encadrant
        if (encadrant != null) {
            notificationService.createNotification(
            "Nouveau rapport soumis", 
            "Nouveau rapport soumis par " + auteur.getNom() + " : \"" + titre + "\"",
            encadrant.getId()
);
        }

        return saved;
    }

    // ── Créer un rapport sans fichier (compatibilité GraphQL / texte) ──────
    public Rapport createRapportTexte(String titre, String contenu, Long auteurId, Long encadrantId) {
        User auteur = userRepository.findById(auteurId)
            .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

        User encadrant = encadrantId != null
            ? userRepository.findById(encadrantId).orElse(null)
            : null;

        Rapport rapport = new Rapport();
        rapport.setTitre(titre);
        rapport.setContenu(contenu);
        rapport.setAuteur(auteur);
        rapport.setEncadrant(encadrant);
        rapport.setStatut(StatutRapport.SOUMIS);
        rapport.setDateDepot(LocalDateTime.now());

        return rapportRepository.save(rapport);
    }

    // ── Valider / Rejeter un rapport ───────────────────────────────────────
    public Rapport validerRapport(Long id, String statut) {
        Rapport rapport = getRapportById(id);

        StatutRapport nouveauStatut;
        try {
            nouveauStatut = StatutRapport.valueOf(statut.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Statut invalide : " + statut + ". Valeurs acceptées : VALIDE, REJETE");
        }

        rapport.setStatut(nouveauStatut);
        Rapport saved = rapportRepository.save(rapport);

        // Notification à l'étudiant
        if (rapport.getAuteur() != null) {
            String msg = nouveauStatut == StatutRapport.VALIDE
                ? "✅ Votre rapport \"" + rapport.getTitre() + "\" a été validé !"
                : "❌ Votre rapport \"" + rapport.getTitre() + "\" a été rejeté. Consultez les commentaires.";
           notificationService.createNotification(
    nouveauStatut == StatutRapport.VALIDE ? "Rapport validé" : "Rapport rejeté",
    msg,
    rapport.getAuteur().getId()
);
        }

        return saved;
    }

    // ── Supprimer un rapport (et son fichier) ──────────────────────────────
    public void deleteRapport(Long id) {
        Rapport rapport = getRapportById(id);

        // Supprimer le fichier physique
        if (rapport.getFichierChemin() != null) {
            fileStorageService.deleteFile(rapport.getFichierChemin());
        }

        rapportRepository.deleteById(id);
    }
}