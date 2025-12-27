package com.eventphoto.controller;

import com.eventphoto.dto.PhotoResponse;
import com.eventphoto.dto.PhotographerStatsResponse;
import com.eventphoto.dto.EventResponse;
import com.eventphoto.repository.EventRepository;
import com.eventphoto.service.PhotoService;
import com.eventphoto.service.EventService;
import com.eventphoto.repository.UserRepository;
import com.eventphoto.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/photographer")
@RequiredArgsConstructor
public class PhotographerController {

    private final PhotoService photoService;
    private final EventService eventService;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    @GetMapping("/stats")
    public ResponseEntity<PhotographerStatsResponse> getPhotographerStats() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer photographerId = extractPhotographerIdFromAuth(authentication);

        long eventsAvailable = eventRepository.findByPhotographersId(photographerId).size();
        long photosUploaded = photoService.countPhotosByPhotographer(photographerId);

        return ResponseEntity.ok(PhotographerStatsResponse.builder()
                .eventsAvailable(eventsAvailable)
                .photosUploaded(photosUploaded)
                .build());
    }

    @GetMapping("/events")
    public ResponseEntity<List<EventResponse>> getEvents() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer photographerId = extractPhotographerIdFromAuth(authentication);
        return ResponseEntity.ok(eventService.getEventsByPhotographer(photographerId));
    }

    @PostMapping("/events/{eventId}/photos")
    public ResponseEntity<PhotoResponse> uploadPhoto(
            @PathVariable Integer eventId,
            @RequestParam("file") MultipartFile file) throws IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer photographerId = extractPhotographerIdFromAuth(authentication);

        PhotoResponse response = photoService.uploadPhoto(eventId, photographerId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/events/{eventId}/photos")
    public ResponseEntity<List<PhotoResponse>> getEventPhotos(@PathVariable Integer eventId) {
        List<PhotoResponse> photos = photoService.getEventPhotos(eventId);
        return ResponseEntity.ok(photos);
    }

    private Integer extractPhotographerIdFromAuth(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }
}
