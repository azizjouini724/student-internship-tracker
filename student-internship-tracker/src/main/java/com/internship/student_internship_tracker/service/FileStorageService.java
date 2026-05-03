package com.internship.student_internship_tracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    // Dossier de stockage — configurable dans application.properties
    @Value("${app.upload.dir:uploads/rapports}")
    private String uploadDir;

    // Types MIME autorisés
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip",
        "image/png",
        "image/jpeg",
        "image/jpg"
    );

    // Taille max : 20 Mo
    private static final long MAX_SIZE = 20L * 1024 * 1024;

    /**
     * Sauvegarde un fichier sur le disque et retourne son chemin relatif.
     */
    public String saveFile(MultipartFile file) throws IOException {
        // ── Validations ───────────────────────────────────────────────────
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Le fichier est vide ou manquant.");
        }

        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("Fichier trop volumineux. Maximum 20 Mo.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                "Format non autorisé. Formats acceptés : PDF, Word, PowerPoint, ZIP, image."
            );
        }

        // ── Création du dossier si nécessaire ─────────────────────────────
        Path dirPath = Paths.get(uploadDir);
        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }

        // ── Nom de fichier unique ─────────────────────────────────────────
        String originalName = sanitizeFilename(file.getOriginalFilename());
        String extension    = getExtension(originalName);
        String uniqueName   = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

        // ── Sauvegarde ────────────────────────────────────────────────────
        Path targetPath = dirPath.resolve(uniqueName);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        // Retourne le chemin relatif (ex: uploads/rapports/1234_abcd1234.pdf)
        return uploadDir + "/" + uniqueName;
    }

    /**
     * Supprime un fichier du disque.
     */
    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) return;
        try {
            Path path = Paths.get(filePath);
            Files.deleteIfExists(path);
        } catch (IOException e) {
            System.err.println("Impossible de supprimer le fichier : " + filePath);
        }
    }

    /**
     * Retourne le chemin absolu d'un fichier.
     */
    public Path getFilePath(String relativePath) {
        return Paths.get(relativePath).toAbsolutePath();
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private String sanitizeFilename(String name) {
        if (name == null) return "fichier";
        // Enlève tout ce qui n'est pas alphanumérique, point, tiret ou underscore
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }
}