package com.eventphoto.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceMatchResponse {
    @com.fasterxml.jackson.annotation.JsonProperty("matched_photo_ids")
    private List<Integer> matchedPhotoIds;
    private Double confidence;
}
