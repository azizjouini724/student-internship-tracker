package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "support_messages")
public class SupportMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String sujet;

    @Column(nullable = false)
    private String type; // "question", "bug", "autre"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // Auteur (étudiant ou encadrant)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "auteur_id")
    private User auteur;

    @Column(name = "date_envoi")
    private LocalDateTime dateEnvoi = LocalDateTime.now();

    @Column(nullable = false)
    private boolean lu = false;

    // Réponse de l'admin
    @Column(columnDefinition = "TEXT")
    private String reponse;

    @Column(name = "date_reponse")
    private LocalDateTime dateReponse;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "admin_id")
    private User admin; // admin qui a répondu

    // Statut
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut statut = Statut.EN_ATTENTE;

    public enum Statut {
        EN_ATTENTE, EN_COURS, RESOLU
    }
}