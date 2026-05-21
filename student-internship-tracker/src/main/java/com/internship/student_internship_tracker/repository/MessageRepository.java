package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    // ── Tous les messages d'une conversation (entre 2 personnes) ────────
    List<Message> findByConversationIdOrderByDateEnvoiAsc(String conversationId);

    // ── Toutes les conversations d'un utilisateur ───────────────────────
    // Retourne le dernier message de chaque conversation
    @Query("SELECT m FROM Message m WHERE m.id IN (" +
           "SELECT MAX(m2.id) FROM Message m2 " +
           "WHERE m2.expediteur.id = :userId OR m2.destinataire.id = :userId " +
           "GROUP BY m2.conversationId) ORDER BY m.dateEnvoi DESC")
    List<Message> findLatestByUserId(@Param("userId") Long userId);

    // ── Nombre de messages non lus pour un utilisateur ──────────────────
    long countByDestinataireIdAndEstLuFalse(Long destinataireId);

    // ── Messages non lus dans une conversation ──────────────────────────
    List<Message> findByConversationIdAndDestinataireIdAndEstLuFalse(String conversationId, Long destinataireId);

    // ── Marquer tous les messages d'une conversation comme lus ──────────
    @Query("UPDATE Message m SET m.estLu = true " +
           "WHERE m.conversationId = :conversationId " +
           "AND m.destinataire.id = :userId AND m.estLu = false")
    void markAsReadByConversation(@Param("conversationId") String conversationId, @Param("userId") Long userId);
}