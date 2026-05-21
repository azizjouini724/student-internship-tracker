package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    List<User> findByRole(Role role);
    
    @Query("SELECT u FROM User u WHERE u.encadrant.id = :encadrantId AND u.role = :role")
    List<User> findByEncadrantIdAndRole(@Param("encadrantId") Long encadrantId, @Param("role") Role role);
}