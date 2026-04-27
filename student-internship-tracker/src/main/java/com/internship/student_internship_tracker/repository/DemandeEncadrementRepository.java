package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.DemandeEncadrement;
import com.internship.student_internship_tracker.entity.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DemandeEncadrementRepository extends JpaRepository<DemandeEncadrement, Long> {
    List<DemandeEncadrement> findByEncadrantId(Long encadrantId);
    List<DemandeEncadrement> findByEtudiantId(Long etudiantId);
    List<DemandeEncadrement> findByEncadrantIdAndStatut(Long encadrantId, StatutDemande statut);
    boolean existsByEtudiantIdAndEncadrantIdAndStatut(Long etudiantId, Long encadrantId, StatutDemande statut);
}