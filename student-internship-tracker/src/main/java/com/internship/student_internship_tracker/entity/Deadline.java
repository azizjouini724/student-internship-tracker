package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.*;
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
}