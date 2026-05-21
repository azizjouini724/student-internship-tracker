package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.DemandeEncadrement;
import com.internship.student_internship_tracker.entity.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DemandeEncadrementRepository extends JpaRepository<DemandeEncadrement, Long> {

    // Demandes d'un étudiant vers un encadrant avec un statut précis
    boolean existsByEtudiantIdAndEncadrantIdAndStatut(Long etudiantId, Long encadrantId, StatutDemande statut);

    // ✅ NOUVEAU — Vérifier si l'étudiant a déjà une demande avec ce statut (tous encadrants)
    boolean existsByEtudiantIdAndStatut(Long etudiantId, StatutDemande statut);

    // Toutes les demandes d'un étudiant
    List<DemandeEncadrement> findByEtudiantId(Long etudiantId);

    // Toutes les demandes reçues par un encadrant
    List<DemandeEncadrement> findByEncadrantId(Long encadrantId);

    // Demandes d'un encadrant avec un statut précis
    List<DemandeEncadrement> findByEncadrantIdAndStatut(Long encadrantId, StatutDemande statut);

    // ✅ NOUVEAU — Demandes d'un étudiant avec un statut précis (pour annuler les autres)
    List<DemandeEncadrement> findByEtudiantIdAndStatut(Long etudiantId, StatutDemande statut);
}