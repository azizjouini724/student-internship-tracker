package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@NoArgsConstructor
@AllArgsConstructor
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

    @JsonIgnore
    @Column(name = "mot_de_passe", nullable = false)
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;          // ✅ Maintenant référence entity.Role (standalone)

    private String telephone;
    private String ville;
    private String entreprise;
    private String specialite;
    private String disponibilite;

    @ManyToOne
    @JoinColumn(name = "encadrant_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "encadrant"})
    private User encadrant;

    @Column(name = "photo_url", columnDefinition = "LONGTEXT")
    private String photoUrl;

    // ❌ SUPPRIMÉ — Plus d'enum interne Role
    // Utilise entity/Role.java à la place
}