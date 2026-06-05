package com.internship.student_internship_tracker.entity;

public enum NotificationType {
    RAPPORT_VALIDE,           // Rapport accepté
    RAPPORT_REJETE,           // Rapport refusé
    NOUVEAU_COMMENTAIRE,      // Commentaire ajouté
    NOUVELLE_DEMANDE,         // Demande encadrement reçue
    DEMANDE_ACCEPTEE,         // Demande encadrement acceptée
    DEMANDE_REFUSEE,          // Demande encadrement refusée
    RETARD_DEPOT,             // ← NOUVEAU : Dépôt en retard
    DEADLINE_APPROCHE,        // ← NOUVEAU : Deadline proche
    NOUVEAU_MESSAGE,          // Nouveau message
    MODIFICATION_PROFIL       // Profil modifié
}