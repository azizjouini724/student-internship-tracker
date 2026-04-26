package com.internship.student_internship_tracker.repository;

import com.internship.student_internship_tracker.entity.Deadline;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeadlineRepository extends JpaRepository<Deadline, Long> {
}