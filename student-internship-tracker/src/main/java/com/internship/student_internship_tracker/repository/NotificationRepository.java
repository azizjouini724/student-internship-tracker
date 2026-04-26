package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long userId);
    List<Notification> findByUserIdAndEstLueFalse(Long userId);
}