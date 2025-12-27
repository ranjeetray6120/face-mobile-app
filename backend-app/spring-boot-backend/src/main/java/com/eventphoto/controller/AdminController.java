package com.eventphoto.controller;

import com.eventphoto.dto.AdminStatsResponse;
import com.eventphoto.dto.CreateEventRequest;
import com.eventphoto.dto.CreateUserRequest;
import com.eventphoto.dto.EventResponse;
import com.eventphoto.entity.User;
import com.eventphoto.repository.PhotoRepository;
import com.eventphoto.repository.UserRepository;
import com.eventphoto.service.AuthService;
import com.eventphoto.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final EventService eventService;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final PhotoRepository photoRepository;
    private final com.eventphoto.repository.EventRepository eventRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getAdminStats() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer adminId = extractAdminIdFromAuth(authentication);

        long totalEvents = eventService.countEventsByAdmin(adminId);
        long totalPhotographers = userRepository.countByRoleNameAndCreatedById("PHOTOGRAPHER", adminId);
        long totalPhotos = photoRepository.findByEventIdIn(
                eventRepository.findByAdminId(adminId).stream().map(com.eventphoto.entity.Event::getId)
                        .collect(java.util.stream.Collectors.toList()))
                .size();

        return ResponseEntity.ok(AdminStatsResponse.builder()
                .totalEvents(totalEvents)
                .totalPhotographers(totalPhotographers)
                .totalPhotos(totalPhotos)
                .build());
    }

    @GetMapping("/photographers")
    public ResponseEntity<List<User>> getPhotographers() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer adminId = extractAdminIdFromAuth(authentication);
        return ResponseEntity.ok(userRepository.findByRoleNameAndCreatedById("PHOTOGRAPHER", adminId));
    }

    @PostMapping("/events")
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody CreateEventRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        // In a real scenario, we'd fetch the user from the database
        // For now, we'll assume the admin ID is available from the token
        Integer adminId = extractAdminIdFromAuth(authentication);

        EventResponse response = eventService.createEvent(request, adminId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable Integer eventId) {
        EventResponse response = eventService.getEvent(eventId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/events")
    public ResponseEntity<List<EventResponse>> getAdminEvents() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer adminId = extractAdminIdFromAuth(authentication);

        List<EventResponse> events = eventService.getEventsByAdmin(adminId);
        return ResponseEntity.ok(events);
    }

    @PostMapping("/events/{eventId}/photographers/{photographerId}")
    public ResponseEntity<Void> assignPhotographerToEvent(
            @PathVariable Integer eventId,
            @PathVariable Integer photographerId) {
        eventService.assignPhotographerToEvent(eventId, photographerId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/photographers")
    public ResponseEntity<User> createPhotographer(@Valid @RequestBody CreateUserRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer adminId = extractAdminIdFromAuth(authentication);
        User currentAdmin = userRepository.findById(adminId).orElseThrow();

        User photographer = authService.createUser(request, "PHOTOGRAPHER", currentAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(photographer);
    }

    private final com.eventphoto.service.QrCodeService qrCodeService;
    private final com.eventphoto.service.GoogleDriveService googleDriveService;
    private final com.eventphoto.service.FaceRecognitionService faceRecognitionService;

    @GetMapping(value = "/events/{eventId}/qr", produces = org.springframework.http.MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getEventQrCode(@PathVariable Integer eventId) {
        try {
            // URL pointing to the new React Web App (Dev Server)
            // Note: In production, this would be the actual domain or backend-served path
            String webAppUrl = "http://192.168.1.3:5173/?eventId=" + eventId;
            byte[] qrImage = qrCodeService.generateQrCode(webAppUrl, 300, 300);
            return ResponseEntity.ok(qrImage);
        } catch (java.io.IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/events/{eventId}/reindex")
    public ResponseEntity<String> reindexEventPhotos(@PathVariable Integer eventId) {
        try {
            System.out.println("Starting re-indexing for event: " + eventId);
            List<com.eventphoto.entity.Photo> photos = photoRepository.findByEventId(eventId);
            System.out.println("Found " + photos.size() + " photos for event " + eventId);

            int count = 0;
            for (com.eventphoto.entity.Photo photo : photos) {
                try {
                    System.out.println(
                            "Downloading photo causing ID: " + photo.getId() + " FileId: " + photo.getDriveFileId());
                    byte[] imageBytes = googleDriveService.downloadFile(photo.getDriveFileId());
                    System.out.println("Download success, bytes: " + (imageBytes != null ? imageBytes.length : "null"));

                    faceRecognitionService.indexFace(eventId, photo.getId(), imageBytes);
                    System.out.println("Index request sent for photo: " + photo.getId());
                    count++;
                } catch (Exception e) {
                    System.err.println("Failed to reindex photo " + photo.getId() + ": " + e.getMessage());
                }
            }
            return ResponseEntity.ok("Re-indexed " + count + " photos for event " + eventId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to reindex: " + e.getMessage());
        }
    }

    @GetMapping("/events/{eventId}/photos")
    public ResponseEntity<List<com.eventphoto.dto.PhotoResponse>> getEventPhotos(@PathVariable Integer eventId) {
        List<com.eventphoto.dto.PhotoResponse> photos = photoRepository.findByEventId(eventId)
                .stream()
                .map(photo -> com.eventphoto.dto.PhotoResponse.builder()
                        .id(photo.getId())
                        .eventId(photo.getEvent().getId())
                        .downloadUrl(googleDriveService.getTemporaryDownloadLink(photo.getDriveFileId()))
                        .uploadedBy(photo.getUploadedBy() != null ? photo.getUploadedBy().getName() : "Unknown")
                        .indexed(photo.getIndexed())
                        .createdAt(photo.getCreatedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList());
        System.out.println("Returning " + photos.size() + " photos for event " + eventId);
        return ResponseEntity.ok(photos);
    }

    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Integer eventId) {
        // 1. Delete Face Encodings (Python Service)
        faceRecognitionService.deleteEventFaces(eventId);

        // 2. Delete Event (DB + Google Drive)
        eventService.deleteEvent(eventId);

        return ResponseEntity.noContent().build();
    }

    private Integer extractAdminIdFromAuth(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}
