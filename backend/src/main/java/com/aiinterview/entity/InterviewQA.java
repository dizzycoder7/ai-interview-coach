package com.aiinterview.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_qa")
@Data
@NoArgsConstructor
public class InterviewQA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "question", columnDefinition = "TEXT", nullable = false)
    private String question;

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "answer_audio_path")
    private String answerAudioPath;

    @Column(name = "follow_up_of")
    private Long followUpOf;

    @Column(name = "ai_score", columnDefinition = "DECIMAL(4,2)")
    private Double aiScore;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(name = "emotion_snapshot", columnDefinition = "JSON")
    private String emotionSnapshot;

    @Column(name = "timestamp")
    private LocalDateTime timestamp = LocalDateTime.now();
}
