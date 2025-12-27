package com.eventphoto.service;

import com.eventphoto.entity.Event;
import com.eventphoto.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CleanupScheduler {

    private final EventRepository eventRepository;
    private final GoogleDriveService googleDriveService;
    private final FaceRecognitionService faceRecognitionService;

    @Scheduled(fixedRate = 3600000) // Run every hour
    @Transactional
    public void cleanupExpiredEvents() {
        log.info("Starting cleanup of expired events...");

        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<Event> expiredEvents = eventRepository.findByCreatedAtBeforeAndStatus(cutoff, "ACTIVE");

        for (Event event : expiredEvents) {
            deleteEventData(event);
        }
    }

    private void deleteEventData(Event event) {
        log.info("Deleting data for event: {} (ID: {})", event.getName(), event.getId());

        try {
            // 1. Delete from Google Drive
            if (event.getDriveFolderId() != null) {
                googleDriveService.deleteFolder(event.getDriveFolderId());
            }

            // 2. Delete from Face Recognition Service
            faceRecognitionService.deleteEventFaces(event.getId());

            // 3. Mark in DB or Delete (Requirement: "Delete: Google Drive folder, Photos,
            // Face embeddings, Event records, QR access")
            // Cascading delete should handle Photos and FaceEmbeddings if configured
            eventRepository.delete(event);

            log.info("Successfully deleted data for event ID: {}", event.getId());
        } catch (Exception e) {
            log.error("Failed to delete data for event ID: {}: {}", event.getId(), e.getMessage());
        }
    }
}
