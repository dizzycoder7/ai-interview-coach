package com.aiinterview.dto;

import lombok.Data;

@Data
public class SaveQARequest {
    private String question;
    private String answerText;
    private String answerAudioPath;
    private Long followUpOf;
    private Double aiScore;
    private String aiFeedback;
    private String emotionSnapshot;
}
