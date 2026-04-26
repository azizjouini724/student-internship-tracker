package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.Rapport;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.RapportRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RapportService {

    private final RapportRepository rapportRepository;
    private final UserRepository userRepository;

    public List<Rapport> getAllRapports() {
        return rapportRepository.findAll();
    }

    public List<Rapport> getRapportsByEtudiant(Long auteurId) {
        return rapportRepository.findByAuteurId(auteurId);
    }

    public List<Rapport> getRapportsByEncadrant(Long encadrantId) {
        return rapportRepository.findByEncadrantId(encadrantId);
    }

    public Rapport getRapportById(Long id) {
        return rapportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé"));
    }

    public Rapport createRapport(String titre, String contenu,
                                  Long auteurId, Long encadrantId) {
        User auteur = userRepository.findById(auteurId).orElseThrow();
        User encadrant = userRepository.findById(encadrantId).orElseThrow();

        Rapport rapport = Rapport.builder()
                .titre(titre)
                .contenu(contenu)
                .statut("SOUMIS")
                .dateDepot(LocalDateTime.now())
                .auteur(auteur)
                .encadrant(encadrant)
                .build();

        return rapportRepository.save(rapport);
    }

    public Rapport validerRapport(Long id, String statut) {
        Rapport rapport = getRapportById(id);
        rapport.setStatut(statut);
        return rapportRepository.save(rapport);
    }

    public void deleteRapport(Long id) {
        rapportRepository.deleteById(id);
    }
}