package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String message;
    private boolean estLue;
    private LocalDateTime dateEnvoi;
    @JsonIgnore 
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    @JsonIgnore 
    @ManyToOne
    @JoinColumn(name = "rapport_id")
    private Rapport rapport;
    @JsonIgnore 
    @ManyToOne
    @JoinColumn(name = "deadline_id")
    private Deadline deadline;
}