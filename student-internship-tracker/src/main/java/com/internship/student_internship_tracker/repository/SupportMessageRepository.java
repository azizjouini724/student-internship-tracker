package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

    // Messages d'un utilisateur
    List<SupportMessage> findByAuteurIdOrderByDateEnvoiDesc(Long auteurId);

    // Tous les messages non lus
    List<SupportMessage> findByLuFalseOrderByDateEnvoiDesc();

    // Tous les messages triés par date
    List<SupportMessage> findAllByOrderByDateEnvoiDesc();

    // Par statut
    List<SupportMessage> findByStatutOrderByDateEnvoiDesc(SupportMessage.Statut statut);

    // Compter les non lus
    long countByLuFalse();
}