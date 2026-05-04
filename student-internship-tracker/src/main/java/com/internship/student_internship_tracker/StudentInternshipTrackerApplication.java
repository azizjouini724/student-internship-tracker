package com.internship.student_internship_tracker;

import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class StudentInternshipTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudentInternshipTrackerApplication.class, args);
    }

    // ── Reset mots de passe au démarrage ──────────────────────────────────
    @Bean
    CommandLineRunner resetPasswords(UserRepository userRepo, PasswordEncoder encoder) {
        return args -> {
            String[] emails = {
                "encadrant@test.com",
                "admin@test.com",
                "etudiant@test.com"
            };
            for (String email : emails) {
                userRepo.findByEmail(email).ifPresent(user -> {
                    user.setMotDePasse(encoder.encode("123456"));
                    userRepo.save(user);
                    System.out.println("✅ Reset : " + email + " → 123456");
                });
            }
        };
    }
}