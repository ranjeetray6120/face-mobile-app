package com.eventphoto.service;

import com.eventphoto.dto.PhotoResponse;
import com.eventphoto.entity.Event;
import com.eventphoto.entity.Photo;
import com.eventphoto.entity.User;
import com.eventphoto.repository.EventRepository;
import com.eventphoto.repository.PhotoRepository;
import com.eventphoto.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PhotoService {

    private final PhotoRepository photoRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final GoogleDriveService googleDriveService;
    private final FaceRecognitionService faceRecognitionService;

    public PhotoResponse uploadPhoto(Integer eventId, Integer photographerId, MultipartFile file) throws IOException {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User photographer = userRepository.findById(photographerId)
                .orElseThrow(() -> new RuntimeException("Photographer not found"));

        if (event.getDriveFolderId() == null) {
            // Automatic creation if folder is missing
            try {
                String driveFolderId = googleDriveService.createEventFolder(event.getName(), event.getId());
                event.setDriveFolderId(driveFolderId);
                eventRepository.save(event);
            } catch (IOException e) {
                throw new RuntimeException("Failed to automatically create Google Drive folder: " + e.getMessage());
            }
        }

        // Upload to Google Drive
        String driveFileId = googleDriveService.uploadPhoto(event.getDriveFolderId(), file);

        // Save photo metadata to database
        Photo photo = new Photo();
        photo.setEvent(event);
        photo.setUploadedBy(photographer);
        photo.setDriveFileId(driveFileId);
        photo.setIndexed(false);

        Photo savedPhoto = photoRepository.save(photo);

        // Trigger face indexing asynchronously
        faceRecognitionService.indexFaceAsync(eventId, savedPhoto.getId(), file.getBytes());

        return mapToResponse(savedPhoto);
    }

    public List<PhotoResponse> getEventPhotos(Integer eventId) {
        List<Photo> photos = photoRepository.findByEventId(eventId);
        return photos.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<PhotoResponse> getMatchedPhotos(Integer eventId, List<Integer> photoIds) {
        if (photoIds == null || photoIds.isEmpty()) {
            return List.of();
        }
        List<Photo> photos = photoRepository.findByEventId(eventId);
        return photos.stream()
                .filter(p -> photoIds.contains(p.getId()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public long countPhotosByPhotographer(Integer photographerId) {
        return photoRepository.countByPhotographerId(photographerId);
    }

    private PhotoResponse mapToResponse(Photo photo) {
        return PhotoResponse.builder()
                .id(photo.getId())
                .eventId(photo.getEvent().getId())
                .downloadUrl(googleDriveService.getTemporaryDownloadLink(photo.getDriveFileId()))
                .uploadedBy(photo.getUploadedBy().getName())
                .indexed(photo.getIndexed())
                .createdAt(photo.getCreatedAt())
                .build();
    }
}
