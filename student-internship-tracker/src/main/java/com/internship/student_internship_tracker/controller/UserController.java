package com.internship.student_internship_tracker.controller;

import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // ✅ FIX UNIQUE — Students par encadrant sans erreur JSON
    @GetMapping("/encadrant/{encadrantId}/etudiants")
    public ResponseEntity<List<Map<String, Object>>> getEtudiantsByEncadrant(@PathVariable Long encadrantId) {
        return ResponseEntity.ok(userService.getEtudiantsByEncadrant(encadrantId).stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("nom", u.getNom());
            map.put("email", u.getEmail());
            map.put("role", u.getRole().name());
            map.put("telephone", u.getTelephone());
            map.put("ville", u.getVille());
            map.put("entreprise", u.getEntreprise());
            return map;
        }).collect(Collectors.toList()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(userService.updateUser(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

   @PutMapping("/{id}/photo")
public ResponseEntity<?> updatePhoto(@PathVariable Long id, @RequestBody Map<String, String> body) {
    try {
        String photoUrl = body.get("photoUrl");
        if (photoUrl == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "photoUrl est requis"));
        }
        userService.updatePhoto(id, photoUrl);
        return ResponseEntity.ok(Map.of("message", "Photo mise à jour avec succès"));
    } catch (RuntimeException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String ancienMdp = body.get("ancienMotDePasse");
        String nouveauMdp = body.get("nouveauMotDePasse");
        if (ancienMdp == null || ancienMdp.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "L'ancien mot de passe est requis."));
        if (nouveauMdp == null || nouveauMdp.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Le nouveau mot de passe est requis."));
        if (nouveauMdp.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("error", "Le nouveau mot de passe doit contenir au moins 6 caractères."));
        try {
            userService.changePassword(id, ancienMdp, nouveauMdp);
            return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

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