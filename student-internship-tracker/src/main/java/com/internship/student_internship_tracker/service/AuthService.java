package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.UserRepository;
import com.internship.student_internship_tracker.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService      jwtService;

    // ── Login ──────────────────────────────────────────────────────────────
    public String login(String email, String password) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Email introuvable"));

    // ── DEBUG TEMPORAIRE ───────────────────────────────────────
    System.out.println("=== DEBUG LOGIN ===");
    System.out.println("Email      : " + email);
    System.out.println("Password saisi  : " + password);
    System.out.println("Hash en base    : " + user.getMotDePasse());
    System.out.println("BCrypt matches  : " + passwordEncoder.matches(password, user.getMotDePasse()));
    System.out.println("===================");
    // ──────────────────────────────────────────────────────────

    if (!passwordEncoder.matches(password, user.getMotDePasse())) {
        throw new RuntimeException("Mot de passe incorrect.");
    }

    return jwtService.generateToken(
        user.getEmail(),
        user.getRole().name(),
        user.getId(),
        user.getNom()
    );
}

    // ── Register ───────────────────────────────────────────────────────────
    public String register(String nom, String email, String password, String role) {

        // 1. Vérifier unicité email
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Un compte existe déjà avec cet email.");
        }

        // 2. Parser le rôle
        User.Role userRole;
        try {
            userRole = User.Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException(
                "Rôle invalide : " + role + ". Valeurs acceptées : ETUDIANT, ENCADRANT, ADMIN"
            );
        }
        

        // 3. Créer + sauvegarder l'utilisateur
        User user = new User();
        user.setNom(nom);
        user.setEmail(email);
        user.setMotDePasse(passwordEncoder.encode(password)); // ✅ BCrypt hash
        user.setRole(userRole);
        userRepository.save(user);

        // 4. Retourner le token JWT
        return jwtService.generateToken(
            user.getEmail(),
            user.getRole().name(),
            user.getId(),
            user.getNom()
        );
    }
    
}