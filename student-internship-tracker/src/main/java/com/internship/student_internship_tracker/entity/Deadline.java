package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "deadlines")
public class Deadline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private LocalDate dateLimite;

    // ⭐ NOUVEAU — Date de création (pour limiter à 1/semaine)
    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    // ⭐ NOUVEAU — Date de modification
    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @ManyToOne
    @JoinColumn(name = "encadrant_id")
    private User encadrant;
}