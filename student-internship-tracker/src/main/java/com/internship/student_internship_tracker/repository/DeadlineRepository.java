package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.Deadline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DeadlineRepository extends JpaRepository<Deadline, Long> {

    // Deadlines d'un encadrant
    List<Deadline> findByEncadrantId(Long encadrantId);

    // ⭐ NOUVEAU — Deadlines créées par un encadrant après une date (pour la limite 1/semaine)
    List<Deadline> findByEncadrantIdAndDateCreationAfter(Long encadrantId, LocalDateTime date);
}