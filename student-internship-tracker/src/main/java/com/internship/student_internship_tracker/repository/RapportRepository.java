package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.Rapport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RapportRepository extends JpaRepository<Rapport, Long> {
    List<Rapport> findByAuteurId(Long auteurId);
    List<Rapport> findByEncadrantId(Long encadrantId);
}
