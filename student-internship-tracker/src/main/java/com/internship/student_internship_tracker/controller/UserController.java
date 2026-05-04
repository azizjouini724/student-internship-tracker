package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService     userService;
    private final PasswordEncoder passwordEncoder;

    // ── GET tous les users ─────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // ── GET un user par ID ─────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // ── PUT mettre à jour le profil ────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        try {
            User updated = userService.updateUser(id, body);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT mettre à jour la photo ─────────────────────────────────────────
    @PutMapping("/{id}/photo")
    public ResponseEntity<?> updatePhoto(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        try {
            String photoUrl = body.get("photoUrl");
            User updated = userService.updatePhoto(id, photoUrl);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── PUT changer le mot de passe ────────────────────────────────────────
    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        // Les 2 clés acceptées (frontend envoie "ancienMotDePasse"/"nouveauMotDePasse")
        String ancienMdp  = body.get("ancienMotDePasse");
        String nouveauMdp = body.get("nouveauMotDePasse");

        // Validation champs
        if (ancienMdp == null || ancienMdp.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "L'ancien mot de passe est requis."));
        }
        if (nouveauMdp == null || nouveauMdp.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Le nouveau mot de passe est requis."));
        }
        if (nouveauMdp.length() < 6) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Le nouveau mot de passe doit contenir au moins 6 caractères."));
        }

        try {
            userService.changePassword(id, ancienMdp, nouveauMdp);
            return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── DELETE supprimer un user ───────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "Utilisateur supprimé."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}