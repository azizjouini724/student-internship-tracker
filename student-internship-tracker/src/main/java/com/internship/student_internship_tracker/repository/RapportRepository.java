package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.Rapport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RapportRepository extends JpaRepository<Rapport, Long> {

    // Rapports d'un étudiant
    List<Rapport> findByAuteurId(Long auteurId);

    // Rapports d'un encadrant
    List<Rapport> findByEncadrantId(Long encadrantId);

    // Rapports par statut
    List<Rapport> findByStatut(Rapport.StatutRapport statut);

    // Rapports d'un étudiant filtrés par statut
    List<Rapport> findByAuteurIdAndStatut(Long auteurId, Rapport.StatutRapport statut);
}