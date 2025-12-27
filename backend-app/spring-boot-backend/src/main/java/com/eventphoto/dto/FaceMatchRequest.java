package com.eventphoto.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceMatchRequest {
    private Integer eventId;
    private byte[] image;
}
