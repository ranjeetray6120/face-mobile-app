package com.eventphoto.service;

import com.eventphoto.dto.FaceMatchResponse;
import com.eventphoto.entity.Photo;
import com.eventphoto.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FaceRecognitionService {

    private final RestTemplate restTemplate;
    private final PhotoRepository photoRepository;

    @Value("${face-recognition.service-url}")
    private String faceServiceUrl;

    @Value("${face-recognition.index-face-endpoint}")
    private String indexFaceEndpoint;

    @Value("${face-recognition.match-face-endpoint}")
    private String matchFaceEndpoint;

    @Async
    public void indexFaceAsync(Integer eventId, Integer photoId, byte[] imageBytes) {
        try {
            indexFace(eventId, photoId, imageBytes);
        } catch (Exception e) {
            System.err.println("Failed to index face for photo " + photoId + ": " + e.getMessage());
        }
    }

    public void indexFace(Integer eventId, Integer photoId, byte[] imageBytes) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("event_id", eventId);
            body.add("photo_id", photoId);
            body.add("image", new org.springframework.core.io.ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return "photo_" + photoId + ".jpg";
                }
            });

            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity = new org.springframework.http.HttpEntity<>(
                    body, headers);

            org.springframework.http.ResponseEntity<String> response = restTemplate.postForEntity(
                    faceServiceUrl + "/index-face",
                    requestEntity,
                    String.class);

            System.out.println("Python service response: " + response.getStatusCode());

            if (response.getStatusCode().is2xxSuccessful()) {
                Photo photo = photoRepository.findById(photoId)
                        .orElseThrow(() -> new RuntimeException("Photo not found"));
                photo.setIndexed(true);
                photoRepository.save(photo);
                System.out.println("Photo " + photoId + " marked as indexed in DB.");
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            if (e.getStatusCode() == org.springframework.http.HttpStatus.BAD_REQUEST
                    && e.getResponseBodyAsString().contains("No faces found")) {
                System.out.println("No faces found in photo " + photoId + ". Marking as indexed to avoid retry.");
                Photo photo = photoRepository.findById(photoId)
                        .orElseThrow(() -> new RuntimeException("Photo not found"));
                photo.setIndexed(true);
                photoRepository.save(photo);
            } else {
                System.err
                        .println("HTTP Error indexing face for photo " + photoId + ": " + e.getResponseBodyAsString());
                throw new RuntimeException("HTTP Error indexing face: " + e.getMessage());
            }
        } catch (Exception e) {
            System.err.println("Unexpected error indexing face for photo " + photoId + ": " + e.getMessage());
            throw new RuntimeException("Failed to index face: " + e.getMessage());
        }
    }

    public List<Integer> matchFace(Integer eventId, byte[] guestFaceImage) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("event_id", eventId);
            body.add("image", new ByteArrayResource(guestFaceImage) {
                @Override
                public String getFilename() {
                    return "guest_face.jpg";
                }
            });

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<FaceMatchResponse> response = restTemplate.postForEntity(
                    faceServiceUrl + matchFaceEndpoint,
                    request,
                    FaceMatchResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().getMatchedPhotoIds();
            }

            return List.of();
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            if (e.getStatusCode() == org.springframework.http.HttpStatus.BAD_REQUEST) {
                // 400 Bad Request usually means "No faces detected"
                return List.of();
            }
            throw new RuntimeException("Failed to match face: " + e.getMessage());
        } catch (Exception e) {
            throw new RuntimeException("Failed to match face: " + e.getMessage());
        }
    }

    public void deleteEventFaces(Integer eventId) {
        try {
            restTemplate.delete(faceServiceUrl + "/delete-event-faces/" + eventId);
        } catch (Exception e) {
            System.err.println("Failed to delete event faces for event " + eventId + ": " + e.getMessage());
        }
    }
}
