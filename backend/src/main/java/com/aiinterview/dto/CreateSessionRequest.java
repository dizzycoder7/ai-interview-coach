package com.aiinterview.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSessionRequest {
    @NotBlank
    private String interviewType;
    private Long userId;
    private String resumeText;
}
