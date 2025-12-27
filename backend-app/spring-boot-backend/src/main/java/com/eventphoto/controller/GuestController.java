package com.eventphoto.controller;

import com.eventphoto.dto.PhotoResponse;
import com.eventphoto.service.PhotoService;
import com.eventphoto.service.FaceRecognitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/guest")
@RequiredArgsConstructor
public class GuestController {

    private final PhotoService photoService;
    private final FaceRecognitionService faceRecognitionService;

    @PostMapping("/events/{eventId}/match-face")
    public ResponseEntity<List<PhotoResponse>> matchFace(
            @PathVariable Integer eventId,
            @RequestParam("file") MultipartFile file) throws IOException {
        
        List<Integer> matchedPhotoIds = faceRecognitionService.matchFace(eventId, file.getBytes());
        List<PhotoResponse> matchedPhotos = photoService.getMatchedPhotos(eventId, matchedPhotoIds);
        
        return ResponseEntity.ok(matchedPhotos);
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<String> getEventInfo(@PathVariable Integer eventId) {
        return ResponseEntity.ok("Event " + eventId + " is ready for guest face scanning");
    }
}
