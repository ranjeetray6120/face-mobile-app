package com.eventphoto.service;

import com.eventphoto.entity.GoogleToken;
import com.eventphoto.repository.GoogleTokenRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class GoogleDriveService {

    private final GoogleTokenRepository tokenRepository;

    @Value("${google.drive.oauth.client-id}")
    private String clientId;

    @Value("${google.drive.oauth.client-secret}")
    private String clientSecret;

    @Value("${google.drive.main-folder-id}")
    private String mainFolderId;

    private Drive getDriveService() throws IOException, GeneralSecurityException {
        GoogleToken token = tokenRepository.findFirstByOrderByIdDesc()
                .orElseThrow(
                        () -> new RuntimeException("Google Drive not connected. Please login via /api/oauth/login"));

        GoogleCredential credential = new GoogleCredential.Builder()
                .setTransport(new NetHttpTransport())
                .setJsonFactory(GsonFactory.getDefaultInstance())
                .setClientSecrets(clientId, clientSecret)
                .build()
                .setAccessToken(token.getAccessToken())
                .setRefreshToken(token.getRefreshToken());

        // Auto-refresh if expired
        if (token.getExpiryTime().isBefore(LocalDateTime.now().plusMinutes(5))) {
            credential.refreshToken();
            token.setAccessToken(credential.getAccessToken());
            token.setExpiryTime(LocalDateTime.now().plusSeconds(credential.getExpiresInSeconds()));
            tokenRepository.save(token);
        }

        return new Drive.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                credential)
                .setApplicationName("EventPhotoSystem")
                .build();
    }

    public String createEventFolder(String eventName, Integer eventId) throws IOException {
        try {
            Drive drive = getDriveService();
            File fileMetadata = new File();
            fileMetadata.setName(String.format("Event_%d_%s", eventId, eventName));
            fileMetadata.setMimeType("application/vnd.google-apps.folder");
            fileMetadata.setParents(Collections.singletonList(mainFolderId));

            File file = drive.files().create(fileMetadata)
                    .setFields("id")
                    .execute();
            return file.getId();
        } catch (GeneralSecurityException e) {
            throw new IOException("Security error: " + e.getMessage());
        }
    }

    public String uploadPhoto(String folderId, MultipartFile file) throws IOException {
        try {
            Drive drive = getDriveService();
            File fileMetadata = new File();
            fileMetadata.setName(file.getOriginalFilename());
            fileMetadata.setParents(Collections.singletonList(folderId));

            InputStream inputStream = file.getInputStream();
            com.google.api.client.http.InputStreamContent mediaContent = new com.google.api.client.http.InputStreamContent(
                    file.getContentType(), inputStream);

            File driveFile = drive.files().create(fileMetadata, mediaContent)
                    .setFields("id")
                    .execute();

            return driveFile.getId();
        } catch (GeneralSecurityException e) {
            throw new IOException("Security error: " + e.getMessage());
        }
    }

    public void deleteFolder(String folderId) throws IOException {
        try {
            if (folderId != null) {
                getDriveService().files().delete(folderId).execute();
            }
        } catch (GeneralSecurityException e) {
            throw new IOException("Security error: " + e.getMessage());
        }
    }

    public void deleteFile(String fileId) throws IOException {
        deleteFolder(fileId);
    }

    public byte[] downloadFile(String fileId) throws IOException {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            getDriveService().files().get(fileId).executeMediaAndDownloadTo(outputStream);
            return outputStream.toByteArray();
        } catch (GeneralSecurityException e) {
            throw new IOException("Security error: " + e.getMessage());
        }
    }

    public String getTemporaryDownloadLink(String fileId) {
        return "/photo/download/" + fileId;
    }
}
