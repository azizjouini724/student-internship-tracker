package com.internship.student_internship_tracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/rapports}")
    private String uploadDir;

    /**
     * Expose le dossier d'upload en ressource statique.
     *
     * Exemple d'accès :
     *   GET /uploads/rapports/1234567890_abcd1234.pdf
     *   → sert le fichier depuis uploads/rapports/ sur le disque
     *
     * Note : l'accès direct par URL est en plus du endpoint /api/rapports/{id}/fichier
     * qui gère les headers Content-Disposition, Content-Type etc.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();

        registry
            .addResourceHandler("/uploads/rapports/**")
            .addResourceLocations("file:" + uploadPath.getParent().toString() + "/");
    }
}