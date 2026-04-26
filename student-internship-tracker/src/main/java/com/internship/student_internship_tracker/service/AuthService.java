package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.Role;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.UserRepository;
import com.internship.student_internship_tracker.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public String register(String nom, String email, String password, String role) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email déjà utilisé");
        }
        User user = User.builder()
                .nom(nom)
                .email(email)
                .motDePasse(passwordEncoder.encode(password))
                .role(Role.valueOf(role))
                .build();
        userRepository.save(user);
        return jwtService.generateToken(email, role);
    }

    public String login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        if (!passwordEncoder.matches(password, user.getMotDePasse())) {
            throw new RuntimeException("Mot de passe incorrect");
        }
        return jwtService.generateToken(email, user.getRole().name());
    }
}
