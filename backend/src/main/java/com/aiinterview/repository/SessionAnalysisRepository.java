package com.aiinterview.repository;

import com.aiinterview.entity.SessionAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SessionAnalysisRepository extends JpaRepository<SessionAnalysis, Long> {
    Optional<SessionAnalysis> findBySessionId(Long sessionId);
}
