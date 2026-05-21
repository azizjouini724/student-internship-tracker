package com.internship.student_internship_tracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Qui envoie ──────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "expediteur_id", nullable = false)
    private User expediteur;

    // ── Qui reçoit ──────────────────────────────────────────────────────
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destinataire_id", nullable = false)
    private User destinataire;

    // ── Contenu ─────────────────────────────────────────────────────────
    @Column(columnDefinition = "TEXT", nullable = false)
    private String contenu;

    @Column(name = "date_envoi", nullable = false)
    @Builder.Default
    private LocalDateTime dateEnvoi = LocalDateTime.now();

    @Column(name = "est_lu", nullable = false)
    @Builder.Default
    private Boolean estLu = false;

    // ── Conversation ID ─────────────────────────────────────────────────
    // Pour grouper les messages entre 2 personnes
    // Format : "petitId_grandId" (ex: "1_8" pour user 1 et user 8)
    @Column(name = "conversation_id", nullable = false)
    private String conversationId;

    // ── Helper : générer un conversationId consistent ──────────────────
    public static String generateConversationId(Long userId1, Long userId2) {
        Long min = Math.min(userId1, userId2);
        Long max = Math.max(userId1, userId2);
        return min + "_" + max;
    }
}