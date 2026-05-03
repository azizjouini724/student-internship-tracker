package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "rapports")
public class Rapport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    // Contenu texte optionnel (on garde pour compatibilité GraphQL)
    @Column(columnDefinition = "TEXT")
    private String contenu;

    // ── Fichier joint ──────────────────────────────────────────────────────
    /** Nom original du fichier uploadé (ex: rapport_semaine3.pdf) */
    @Column(name = "fichier_nom")
    private String fichierNom;

    /** Chemin relatif sur le serveur (ex: uploads/rapports/1234567890_rapport.pdf) */
    @Column(name = "fichier_chemin")
    private String fichierChemin;

    /** Type MIME du fichier (ex: application/pdf) */
    @Column(name = "fichier_type")
    private String fichierType;

    /** Taille du fichier en octets */
    @Column(name = "fichier_taille")
    private Long fichierTaille;

    // ── Statut ─────────────────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private StatutRapport statut = StatutRapport.SOUMIS;

    @Column(name = "date_depot")
    @Builder.Default
    private LocalDateTime dateDepot = LocalDateTime.now();

    // ── Relations ──────────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "auteur_id")
    private User auteur;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "encadrant_id")
    private User encadrant;

    @OneToMany(mappedBy = "rapport", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Commentaire> commentaires;

    // ── Enum statut ────────────────────────────────────────────────────────
    public enum StatutRapport {
        SOUMIS, VALIDE, REJETE
    }
}