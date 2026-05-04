package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.UserRepository;
import com.internship.student_internship_tracker.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final AuthService    authService;

    // ── POST /api/auth/login ───────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String token = authService.login(email, body.get("password"));
            User user = userRepository.findByEmail(email).orElseThrow();
            return ResponseEntity.ok(Map.of(
                "token", token,
                "role",  user.getRole().name(),
                "nom",   user.getNom(),
                "id",    user.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── POST /api/auth/register ────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String token = authService.register(
                body.get("nom"),
                email,
                body.get("password"),
                body.get("role")
            );
            User user = userRepository.findByEmail(email).orElseThrow();
            return ResponseEntity.ok(Map.of(
                "token", token,
                "role",  user.getRole().name(),
                "nom",   user.getNom(),
                "id",    user.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}