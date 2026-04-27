package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "demandes_encadrement")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeEncadrement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private StatutDemande statut;

    private String message;
    private LocalDateTime dateDemande;
    private LocalDateTime dateReponse;

    @ManyToOne
    @JoinColumn(name = "etudiant_id")
    private User etudiant;

    @ManyToOne
    @JoinColumn(name = "encadrant_id")
    private User encadrant;
}