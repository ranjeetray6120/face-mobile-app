package com.eventphoto.controller;

import com.eventphoto.service.GoogleDriveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/photo")
@RequiredArgsConstructor
public class PhotoController {

    private final GoogleDriveService googleDriveService;

    @GetMapping("/download/{fileId}")
    public ResponseEntity<byte[]> downloadPhoto(@PathVariable String fileId) throws IOException {
        byte[] data = googleDriveService.downloadFile(fileId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"photo_" + fileId + ".jpg\"")
                .contentType(MediaType.IMAGE_JPEG)
                .body(data);
    }
}
