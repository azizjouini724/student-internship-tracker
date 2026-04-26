package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "commentaires")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Commentaire {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String contenu;
    private LocalDateTime dateCreation;

    @ManyToOne
    @JoinColumn(name = "rapport_id")
    private Rapport rapport;

    @ManyToOne
    @JoinColumn(name = "auteur_id")
    private User auteur;
}