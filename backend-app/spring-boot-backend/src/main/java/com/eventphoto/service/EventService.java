package com.eventphoto.service;

import com.eventphoto.dto.CreateEventRequest;
import com.eventphoto.dto.EventResponse;
import com.eventphoto.entity.Event;
import com.eventphoto.entity.User;
import com.eventphoto.repository.EventRepository;
import com.eventphoto.repository.UserRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final GoogleDriveService googleDriveService;

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Value("${server.port:8080}")
    private String serverPort;

    public EventResponse createEvent(CreateEventRequest request, Integer adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        Event event = new Event();
        event.setName(request.getName());
        event.setDate(request.getDate());
        event.setLocation(request.getLocation());
        event.setAdmin(admin);
        event.setStatus("ACTIVE");

        Event savedEvent = eventRepository.save(event);

        // Create Google Drive folder
        try {
            String driveFolderId = googleDriveService.createEventFolder(savedEvent.getName(), savedEvent.getId());
            savedEvent.setDriveFolderId(driveFolderId);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create Google Drive folder: " + e.getMessage());
        }

        // Generate QR code
        String qrCodePath = generateQRCode(savedEvent.getId());
        savedEvent.setQrCodePath(qrCodePath);
        savedEvent = eventRepository.save(savedEvent);

        return mapToResponse(savedEvent);
    }

    public EventResponse getEvent(Integer eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        return mapToResponse(event);
    }

    public List<EventResponse> getEventsByAdmin(Integer adminId) {
        return eventRepository.findByAdminId(adminId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public long countEventsByAdmin(Integer adminId) {
        return eventRepository.countByAdminId(adminId);
    }

    public long countTotalEvents() {
        return eventRepository.count();
    }

    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<EventResponse> getEventsByPhotographer(Integer photographerId) {
        return eventRepository.findByPhotographersId(photographerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void assignPhotographerToEvent(Integer eventId, Integer photographerId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        User photographer = userRepository.findById(photographerId)
                .orElseThrow(() -> new RuntimeException("Photographer not found"));

        if (!event.getPhotographers().contains(photographer)) {
            event.getPhotographers().add(photographer);
            eventRepository.save(event);
        }
    }

    public List<EventResponse> getAllActiveEvents() {
        List<Event> events = eventRepository.findByStatus("ACTIVE");
        return events.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private String generateQRCode(Integer eventId) {
        try {
            String qrContent = String.format("https://frontend.decointerior.in/?eventId=%d", eventId);
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrContent, BarcodeFormat.QR_CODE, 300, 300);

            Path qrCodeDir = Paths.get("qr-codes");
            Files.createDirectories(qrCodeDir);

            Path qrCodePath = qrCodeDir.resolve("event_" + eventId + ".png");
            MatrixToImageWriter.writeToPath(bitMatrix, "PNG", qrCodePath);

            return qrCodePath.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code: " + e.getMessage());
        }
    }

    public void deleteEvent(Integer eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // 1. Delete from Face Service (Encodings)
        // Ideally this should be injected, but for brevity/circular dependency
        // avoidance we might skip or use FaceRecognitionService
        // Assuming FaceRecognitionService is available or we trigger it via Controller

        // 2. Delete from Google Drive (Photos)
        if (event.getDriveFolderId() != null) {
            try {
                googleDriveService.deleteFile(event.getDriveFolderId());
            } catch (IOException e) {
                System.err.println("Failed to delete Google Drive folder: " + e.getMessage());
                // Continue deletion even if Drive fails
            }
        }

        // 3. Delete from Database
        eventRepository.delete(event);
    }

    private EventResponse mapToResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .date(event.getDate())
                .location(event.getLocation())
                .adminId(event.getAdmin().getId())
                .qrCodePath(event.getQrCodePath())
                .status(event.getStatus())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
