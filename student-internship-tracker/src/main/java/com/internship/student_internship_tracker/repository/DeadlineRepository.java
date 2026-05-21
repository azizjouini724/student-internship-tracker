package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.Deadline;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeadlineRepository extends JpaRepository<Deadline, Long> {

    // ⭐ Deadlines créées par un encadrant spécifique
    List<Deadline> findByEncadrantId(Long encadrantId);
}