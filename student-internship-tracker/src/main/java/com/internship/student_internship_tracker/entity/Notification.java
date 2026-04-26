package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

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

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "rapport_id")
    private Rapport rapport;

    @ManyToOne
    @JoinColumn(name = "deadline_id")
    private Deadline deadline;
}