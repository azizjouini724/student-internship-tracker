package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.Notification;
import com.internship.student_internship_tracker.entity.NotificationType;
import com.internship.student_internship_tracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // ✅ Déjà existantes
    List<Notification> findByUserId(Long userId);
    List<Notification> findByUserIdAndEstLueFalse(Long userId);
    
    // ✨ NOUVELLES MÉTHODES (ajoute ci-dessous)
    
    // 1. Trouver notifications d'un user par type (ex: RETARD_DEPOT)
    List<Notification> findByUserAndTypeOrderByDateEnvoiDesc(User user, NotificationType type);
    
    // 2. Compter les retards non lus pour un user
    long countByUserAndEstLueAndType(User user, boolean estLue, NotificationType type);
    
    // 3. Trouver toutes les notifications d'un type non lues (pour le scheduler)
    List<Notification> findByTypeAndEstLueFalse(NotificationType type);
}