package com.eventphoto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotographerStatsResponse {
    private long eventsAvailable;
    private long photosUploaded;
}
