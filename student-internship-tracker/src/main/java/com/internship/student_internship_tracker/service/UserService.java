package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User non trouvé"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User non trouvé"));
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}

