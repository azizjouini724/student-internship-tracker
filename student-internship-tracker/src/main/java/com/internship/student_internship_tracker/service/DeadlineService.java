package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.Deadline;
import com.internship.student_internship_tracker.repository.DeadlineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeadlineService {

    private final DeadlineRepository deadlineRepository;

    public List<Deadline> getAllDeadlines() {
        return deadlineRepository.findAll();
    }

    public Deadline createDeadline(String type, LocalDate dateLimite) {
        Deadline deadline = Deadline.builder()
                .type(type)
                .dateLimite(dateLimite)
                .build();
        return deadlineRepository.save(deadline);
    }

    public void deleteDeadline(Long id) {
        deadlineRepository.deleteById(id);
    }
}