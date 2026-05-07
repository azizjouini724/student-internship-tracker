package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.PersonalEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonalEventRepository extends JpaRepository<PersonalEvent, Long> {

    // Tous les événements d'un utilisateur
    List<PersonalEvent> findByUserIdOrderByDateAsc(Long userId);

    // Événements importants d'un utilisateur
    List<PersonalEvent> findByUserIdAndImportantTrue(Long userId);
}