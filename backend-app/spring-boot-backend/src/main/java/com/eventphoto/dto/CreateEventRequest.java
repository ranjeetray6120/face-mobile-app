package com.eventphoto.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventRequest {
    @NotBlank(message = "Event name is required")
    private String name;

    @NotNull(message = "Event date is required")
    private LocalDate date;

    @NotBlank(message = "Location is required")
    private String location;
}
