package com.eventphoto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhotoResponse {
    private Integer id;
    private Integer eventId;
    private String downloadUrl;
    private String uploadedBy;
    private Boolean indexed;
    private LocalDateTime createdAt;
}
