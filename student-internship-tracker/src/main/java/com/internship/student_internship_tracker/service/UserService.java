package com.internship.student_internship_tracker.service;

import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Tous les users ─────────────────────────────────────────────────────
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ── User par ID ────────────────────────────────────────────────────────
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + id));
    }

    // ── Mettre à jour le profil ────────────────────────────────────────────
    public User updateUser(Long id, Map<String, String> fields) {
        User user = getUserById(id);

        if (fields.containsKey("nom")           && fields.get("nom")           != null)
            user.setNom(fields.get("nom").trim());
        if (fields.containsKey("email")         && fields.get("email")         != null)
            user.setEmail(fields.get("email").trim());
        if (fields.containsKey("telephone")     && fields.get("telephone")     != null)
            user.setTelephone(fields.get("telephone").trim());
        if (fields.containsKey("ville")         && fields.get("ville")         != null)
            user.setVille(fields.get("ville").trim());
        if (fields.containsKey("entreprise")    && fields.get("entreprise")    != null)
            user.setEntreprise(fields.get("entreprise").trim());
        if (fields.containsKey("specialite")    && fields.get("specialite")    != null)
            user.setSpecialite(fields.get("specialite").trim());
        if (fields.containsKey("disponibilite") && fields.get("disponibilite") != null)
            user.setDisponibilite(fields.get("disponibilite").trim());

        return userRepository.save(user);
    }

    // ── Mettre à jour la photo ─────────────────────────────────────────────
    public User updatePhoto(Long id, String photoUrl) {
        User user = getUserById(id);
        user.setPhotoUrl(photoUrl);
        return userRepository.save(user);
    }

    // ── Changer le mot de passe ────────────────────────────────────────────
    public void changePassword(Long id, String ancienMotDePasse, String nouveauMotDePasse) {
        User user = getUserById(id);

        // ✅ Vérifier avec BCrypt
        if (!passwordEncoder.matches(ancienMotDePasse, user.getMotDePasse())) {
            throw new RuntimeException("Mot de passe actuel incorrect.");
        }

        // Hacher et sauvegarder
        user.setMotDePasse(passwordEncoder.encode(nouveauMotDePasse));
        userRepository.save(user);
    }

    // ── Supprimer un user ──────────────────────────────────────────────────
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Utilisateur introuvable : " + id);
        }
        userRepository.deleteById(id);
    }}