package com.aiinterview.repository;

import com.aiinterview.entity.InterviewQA;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InterviewQARepository extends JpaRepository<InterviewQA, Long> {
    List<InterviewQA> findBySessionIdOrderByTimestampAsc(Long sessionId);
}
