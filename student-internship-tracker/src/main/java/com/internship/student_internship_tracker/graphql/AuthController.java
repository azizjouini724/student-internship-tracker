package com.internship.student_internship_tracker.graphql;

import com.internship.student_internship_tracker.repository.UserRepository;
import com.internship.student_internship_tracker.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepository;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            String token = authService.register(
                body.get("nom"),
                body.get("email"),
                body.get("password"),
                body.get("role")
            );
            return ResponseEntity.ok(Map.of("token", token));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

   @PostMapping("/login")
public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
    try {
        String email = body.get("email");
        String token = authService.login(email, body.get("password"));
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(Map.of(
            "token", token,
            "role", user.getRole().name(),
            "nom", user.getNom()
        ));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}
}