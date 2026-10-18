package com.aiinterview.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "session_analysis")
@Data
@NoArgsConstructor
public class SessionAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, unique = true)
    private Long sessionId;

    @Column(name = "confidence_score", columnDefinition = "DECIMAL(4,2)")
    private Double confidenceScore;

    @Column(name = "clarity_score", columnDefinition = "DECIMAL(4,2)")
    private Double clarityScore;

    @Column(name = "depth_score", columnDefinition = "DECIMAL(4,2)")
    private Double depthScore;

    @Column(name = "eye_contact_score", columnDefinition = "DECIMAL(4,2)")
    private Double eyeContactScore;

    @Column(name = "filler_word_count")
    private Integer fillerWordCount = 0;

    @Column(name = "emotion_data", columnDefinition = "JSON")
    private String emotionData;

    @Column(name = "code_quality_score", columnDefinition = "DECIMAL(4,2)")
    private Double codeQualityScore;

    @Column(name = "overall_score", columnDefinition = "DECIMAL(4,2)")
    private Double overallScore;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
