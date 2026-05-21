package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;

@Entity
@Table(name = "deadlines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deadline {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;
    private LocalDate dateLimite;

    @ManyToOne
    @JoinColumn(name = "encadrant_id")
    @JsonIgnore  // ⭐ AJOUT — Empêche la boucle JSON Deadline → User → Deadline
    private User encadrant;
}