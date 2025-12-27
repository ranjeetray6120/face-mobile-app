package com.eventphoto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {
    private Integer id;
    private String name;
    private LocalDate date;
    private String location;
    private Integer adminId;
    private String qrCodePath;
    private String status;
    private LocalDateTime createdAt;
}
