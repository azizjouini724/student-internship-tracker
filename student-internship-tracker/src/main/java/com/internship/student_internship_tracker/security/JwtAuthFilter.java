package com.internship.student_internship_tracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String requestURI = request.getRequestURI();
        System.out.println("🔍 JwtAuthFilter - URI: " + requestURI);
        
        // Ignorer le filtre pour les routes publiques
        if (requestURI.equals("/api/auth/login") || 
            requestURI.equals("/api/auth/register") ||
            requestURI.startsWith("/graphql") ||
            requestURI.startsWith("/uploads")) {
            System.out.println("✅ Route publique - skip JWT filter");
            filterChain.doFilter(request, response);
            return;
        }
        
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            System.out.println("🎫 Token trouvé: " + token.substring(0, 20) + "...");
            
            try {
                String email = jwtService.extractEmail(token);
                
                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    String role = jwtService.extractRole(token);
                    
                    // ⚠️ Ajouter le préfixe ROLE_ obligatoire pour Spring Security
                    String springRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                    
                    System.out.println("✅ Token valide - Email: " + email + " | Role: " + springRole);
                    
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority(springRole);
                    
                    UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(email, null, Collections.singletonList(authority));
                    
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception e) {
                System.out.println("❌ Token invalide: " + e.getMessage());
            }
        } else {
            System.out.println("⚠️ Pas de token dans le header Authorization");
        }
        
        filterChain.doFilter(request, response);
    }
}