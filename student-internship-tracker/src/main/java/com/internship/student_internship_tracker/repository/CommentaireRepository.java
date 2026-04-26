package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.Commentaire;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentaireRepository extends JpaRepository<Commentaire, Long> {
    List<Commentaire> findByRapportId(Long rapportId);
}