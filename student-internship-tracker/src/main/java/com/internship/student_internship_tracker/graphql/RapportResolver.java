package com.internship.student_internship_tracker.graphql;

import com.internship.student_internship_tracker.entity.Commentaire;
import com.internship.student_internship_tracker.entity.Rapport;
import com.internship.student_internship_tracker.entity.Rapport.StatutRapport;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.CommentaireRepository;
import com.internship.student_internship_tracker.repository.DeadlineRepository;
import com.internship.student_internship_tracker.repository.RapportRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class RapportResolver {

    private final RapportRepository rapportRepository;
    private final UserRepository userRepository;
    private final CommentaireRepository commentaireRepository;
    private final DeadlineRepository deadlineRepository;

    @QueryMapping
    public List<Rapport> rapports() {
        return rapportRepository.findAll();
    }

    @QueryMapping
    public Rapport rapportById(@Argument Long id) {
        return rapportRepository.findById(id).orElse(null);
    }

    @QueryMapping
    public List<Rapport> mesRapports(@Argument Long auteurId) {
        return rapportRepository.findByAuteurId(auteurId);
    }

    @QueryMapping
    public List<User> users() {
        return userRepository.findAll();
    }

    @QueryMapping
    public User userById(@Argument Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @QueryMapping
    public List<Commentaire> commentairesByRapport(@Argument Long rapportId) {
        return commentaireRepository.findByRapportId(rapportId);
    }

    @MutationMapping
    public Rapport createRapport(
            @Argument String titre,
            @Argument String contenu,
            @Argument Long auteurId,
            @Argument Long encadrantId) {

        User auteur = userRepository.findById(auteurId).orElseThrow();
        User encadrant = userRepository.findById(encadrantId).orElseThrow();

        Rapport rapport = Rapport.builder()
                .titre(titre)
                .contenu(contenu)
                .statut(Rapport.StatutRapport.SOUMIS)
                .dateDepot(LocalDateTime.now())
                .auteur(auteur)
                .encadrant(encadrant)
                .build();

        return rapportRepository.save(rapport);
    }

    @MutationMapping
    public Rapport validerRapport(@Argument Long id, @Argument String statut) {
        Rapport rapport = rapportRepository.findById(id).orElseThrow();
        rapport.setStatut(StatutRapport.valueOf(statut.toUpperCase()));
        return rapportRepository.save(rapport);
    }

    @MutationMapping
    public Commentaire addCommentaire(
            @Argument String contenu,
            @Argument Long rapportId,
            @Argument Long auteurId) {

        Rapport rapport = rapportRepository.findById(rapportId).orElseThrow();
        User auteur = userRepository.findById(auteurId).orElseThrow();

        Commentaire commentaire = Commentaire.builder()
                .contenu(contenu)
                .dateCreation(LocalDateTime.now())
                .rapport(rapport)
                .auteur(auteur)
                .build();

        return commentaireRepository.save(commentaire);
    }
}
