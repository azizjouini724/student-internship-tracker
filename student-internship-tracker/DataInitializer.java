package com.internship.student_internship_tracker;

import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        reset("encadrant@test.com", "123456");
        reset("admin@test.com",     "123456");
        System.out.println("✅ Done !");
    }

    private void reset(String email, String password) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setMotDePasse(passwordEncoder.encode(password));
            userRepository.save(user);
            System.out.println("🔄 Reset : " + email + " → " + password);
        });
    }
}