package com.eventphoto.controller;

import com.eventphoto.entity.GoogleToken;
import com.eventphoto.repository.GoogleTokenRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.DriveScopes;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;

@RestController
@RequestMapping("/oauth")
@RequiredArgsConstructor
public class GoogleAuthController {

    private final GoogleTokenRepository tokenRepository;

    @Value("${google.drive.oauth.client-id}")
    private String clientId;

    @Value("${google.drive.oauth.client-secret}")
    private String clientSecret;

    @Value("${google.drive.oauth.redirect-uri}")
    private String redirectUri;

    @GetMapping("/login")
    public void login(jakarta.servlet.http.HttpServletResponse response) throws IOException {
        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                clientId,
                clientSecret,
                Collections.singleton(DriveScopes.DRIVE_FILE))
                .setAccessType("offline")
                .setApprovalPrompt("force")
                .build();

        String url = flow.newAuthorizationUrl()
                .setRedirectUri(redirectUri)
                .build();

        response.sendRedirect(url);
    }

    @GetMapping("/callback")
    public ResponseEntity<String> callback(@RequestParam String code) throws IOException {
        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                clientId,
                clientSecret,
                Collections.singleton(DriveScopes.DRIVE_FILE))
                .setAccessType("offline")
                .build();

        GoogleTokenResponse response = flow.newTokenRequest(code)
                .setRedirectUri(redirectUri)
                .execute();

        GoogleToken token = tokenRepository.findFirstByOrderByIdDesc().orElse(new GoogleToken());
        token.setAccessToken(response.getAccessToken());

        // Refresh token is only sent on the FIRST login or if "force" approval is used
        if (response.getRefreshToken() != null) {
            token.setRefreshToken(response.getRefreshToken());
        }

        token.setExpiryTime(LocalDateTime.now().plusSeconds(response.getExpiresInSeconds()));
        tokenRepository.save(token);

        return ResponseEntity.ok("Success! Google Drive connected. You can close this window.");
    }
}
