package com.internship.student_internship_tracker.graphql;

import com.internship.student_internship_tracker.entity.User;
import com.internship.student_internship_tracker.repository.UserRepository;
import com.internship.student_internship_tracker.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;


@Controller
@RequiredArgsConstructor
public class AuthResolver {

    private final AuthService    authService;
    private final UserRepository userRepository;

    // ── Mutation GraphQL : login ───────────────────────────────────────────
    @MutationMapping
    public Map<String, Object> loginGraphQL(
            @Argument String email,
            @Argument String password
    ) {
        Map<String, Object> result = new HashMap<>();
        try {
            String token = authService.login(email, password);
            Optional<User> userOpt = userRepository.findByEmail(email);

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                result.put("token",   token);
                result.put("role",    user.getRole().name());
                result.put("nom",     user.getNom());
                result.put("id",      user.getId());
                result.put("success", true);
                result.put("message", "Connexion réussie");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
            result.put("token",   null);
        }
        return result;
    }

    // ── Mutation GraphQL : register ────────────────────────────────────────
    @MutationMapping
    public Map<String, Object> registerGraphQL(
            @Argument String nom,
            @Argument String email,
            @Argument String password,
            @Argument String role
    ) {
        Map<String, Object> result = new HashMap<>();
        try {
            String token = authService.register(nom, email, password, role);
            Optional<User> userOpt = userRepository.findByEmail(email);

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                result.put("token",   token);
                result.put("role",    user.getRole().name());
                result.put("nom",     user.getNom());
                result.put("id",      user.getId());
                result.put("success", true);
                result.put("message", "Compte créé avec succès");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
            result.put("token",   null);
        }
        return result;
    }

    // ── Query GraphQL : vérifier si email existe ───────────────────────────
    @QueryMapping
    public boolean emailExists(@Argument String email) {
        return userRepository.findByEmail(email).isPresent();
    }
}