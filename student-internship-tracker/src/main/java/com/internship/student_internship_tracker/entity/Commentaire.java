package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
    @JsonIgnore 
    @ManyToOne
    @JoinColumn(name = "rapport_id")
    private Rapport rapport;
    @JsonIgnore 
    @ManyToOne
    @JoinColumn(name = "auteur_id")
    private User auteur;
}