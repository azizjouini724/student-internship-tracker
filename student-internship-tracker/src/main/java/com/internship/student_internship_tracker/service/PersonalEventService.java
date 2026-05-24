package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.PersonalEvent;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.PersonalEventRepository;
import com.internship.student_internship_tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PersonalEventService {

    private final PersonalEventRepository eventRepository;
    private final UserRepository          userRepository;

    public List<PersonalEvent> getEventsByUser(Long userId) {
        return eventRepository.findByUserIdOrderByDateAsc(userId);
    }

    public PersonalEvent createEvent(Long userId, String titre, String date, String description, boolean important) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + userId));

        PersonalEvent event = new PersonalEvent();
        event.setUser(user);
        event.setTitre(titre);
        event.setDate(LocalDate.parse(date));
        event.setDescription(description);
        event.setImportant(important);

        return eventRepository.save(event);
    }

    public PersonalEvent updateEvent(Long id, Long userId, String titre, String date, String description, boolean important) {
        PersonalEvent event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Événement introuvable : " + id));
        if (userId != null && !event.getUser().getId().equals(userId)) {
            throw new RuntimeException("Accès non autorisé.");
        }
        event.setTitre(titre);
        event.setDate(LocalDate.parse(date));
        event.setDescription(description);
        event.setImportant(important);
        return eventRepository.save(event);
    }

    public void deleteEvent(Long id, Long userId) {
        PersonalEvent event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Événement introuvable : " + id));
        if (!event.getUser().getId().equals(userId)) {
            throw new RuntimeException("Accès non autorisé.");
        }
        eventRepository.deleteById(id);
    }

    // ✅ FIX : userId optionnel
    public PersonalEvent toggleImportant(Long id, Long userId) {
        PersonalEvent event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Événement introuvable : " + id));
        if (userId != null && !event.getUser().getId().equals(userId)) {
            throw new RuntimeException("Accès non autorisé.");
        }
        event.setImportant(!event.isImportant());
        return eventRepository.save(event);
    }
}