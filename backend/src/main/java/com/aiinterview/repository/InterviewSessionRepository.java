package com.aiinterview.repository;

import com.aiinterview.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserIdOrderByStartedAtDesc(Long userId);
}
