package com.internship.student_internship_tracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import io.jsonwebtoken.JwtParserBuilder;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    // Clé secrète — à mettre dans application.properties
    @Value("${app.jwt.secret:MonSuperSecretJWTDossierPro2025CleSuffisamentLongue}")
    private String secret;

    // Durée du token : 24h
    @Value("${app.jwt.expiration:86400000}")
    private long expiration;

    // ── Générer un token ───────────────────────────────────────────────────
    public String generateToken(String email, String role, Long userId, String nom) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role",   role);     // ex: "ETUDIANT"
        claims.put("userId", userId);
        claims.put("nom",    nom);

        return Jwts.builder()
            .setClaims(claims)
            .setSubject(email)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    // ── Extraire l'email (subject) ─────────────────────────────────────────
    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    // ── Extraire le rôle ───────────────────────────────────────────────────
    public String extractRole(String token) {
        return (String) extractClaims(token).get("role");
    }

    // ── Extraire l'ID utilisateur ──────────────────────────────────────────
    public Long extractUserId(String token) {
        Object userId = extractClaims(token).get("userId");
        if (userId instanceof Integer) return ((Integer) userId).longValue();
        if (userId instanceof Long)    return (Long) userId;
        return null;
    }

    // ── Valider le token ───────────────────────────────────────────────────
    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    // ── Extraire tous les claims ───────────────────────────────────────────
    private Claims extractClaims(String token) {
        return Jwts.parser()
            .setSigningKey(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // ── Clé de signature ───────────────────────────────────────────────────
    private Key getKey() {
        byte[] keyBytes = secret.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }
}