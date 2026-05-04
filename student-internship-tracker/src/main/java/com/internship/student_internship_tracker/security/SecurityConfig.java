package com.internship.student_internship_tracker.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        System.out.println("═══════════════════════════════════════════");
        System.out.println("🔒 CHARGEMENT SecurityConfig");
        System.out.println("═══════════════════════════════════════════");
        
        http
            .csrf(csrf -> {
                System.out.println("✓ CSRF désactivé");
                csrf.disable();
            })
            .cors(cors -> {
                System.out.println("✓ CORS activé");
                cors.configurationSource(corsConfigurationSource());
            })
            .sessionManagement(session -> {
                System.out.println("✓ Session STATELESS");
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
            })
            .authorizeHttpRequests(auth -> {
                System.out.println("📋 Configuration des autorisations :");
                System.out.println("  ✓ OPTIONS /** → PUBLIC");
                System.out.println("  ✓ /api/auth/login → PUBLIC");
                System.out.println("  ✓ /api/auth/register → PUBLIC (temporaire)");
                System.out.println("  ✓ /graphql → PUBLIC");
                System.out.println("  ✓ /uploads/** → PUBLIC");
                System.out.println("  ✓ Reste → AUTHENTICATED");
                
                auth
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers("/api/auth/login").permitAll()
                    .requestMatchers("/api/auth/register").permitAll()  // Temporaire pour debug
                    .requestMatchers("/graphql", "/graphiql/**").permitAll()
                    .requestMatchers("/uploads/**").permitAll()
                    .anyRequest().authenticated();
            })
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        System.out.println("═══════════════════════════════════════════");
        System.out.println("✅ SecurityConfig CHARGÉ AVEC SUCCÈS");
        System.out.println("═══════════════════════════════════════════");
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        System.out.println("🔐 BCryptPasswordEncoder créé");
        return new BCryptPasswordEncoder();
    }
}