package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@NoArgsConstructor   // ✅ OBLIGATOIRE — sinon "constructor undefined"
@AllArgsConstructor  // ✅ Constructeur complet pour tests
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, unique = true)
    private String email;

    // ✅ @JsonIgnore — ne JAMAIS envoyer le hash au frontend
    @JsonIgnore
    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // ── Infos profil ────────────────────────────────────────────────────────
    private String telephone;
    private String ville;
    private String entreprise;
    private String specialite;
    private String disponibilite;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    // ── Relation encadrant ───────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "encadrant_id")
    @JsonIgnore
    private User encadrant;

    // ── Enum rôle ─────────────────────────────────────────────────────────────
    public enum Role {
        ETUDIANT, ENCADRANT, ADMIN
    }
}