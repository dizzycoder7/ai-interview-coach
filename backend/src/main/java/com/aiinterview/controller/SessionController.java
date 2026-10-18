package com.aiinterview.controller;

import com.aiinterview.dto.CreateSessionRequest;
import com.aiinterview.dto.SaveQARequest;
import com.aiinterview.entity.InterviewQA;
import com.aiinterview.entity.InterviewSession;
import com.aiinterview.entity.SessionAnalysis;
import com.aiinterview.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SessionController {

    private final SessionService sessionService;

    @PostMapping
    public ResponseEntity<InterviewSession> createSession(@Valid @RequestBody CreateSessionRequest req) {
        return ResponseEntity.ok(sessionService.createSession(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InterviewSession> getSession(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getSession(id));
    }

    @GetMapping
    public ResponseEntity<List<InterviewSession>> getUserSessions(@RequestParam Long userId) {
        return ResponseEntity.ok(sessionService.getUserSessions(userId));
    }

    @PostMapping("/{id}/qa")
    public ResponseEntity<InterviewQA> saveQA(@PathVariable Long id, @RequestBody SaveQARequest req) {
        return ResponseEntity.ok(sessionService.saveQA(id, req));
    }

    @GetMapping("/{id}/qa")
    public ResponseEntity<List<InterviewQA>> getSessionQA(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getSessionQA(id));
    }

    @PutMapping("/{id}/end")
    public ResponseEntity<Map<String, Object>> endSession(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> analysisData) {
        return ResponseEntity.ok(sessionService.endSession(id, analysisData));
    }

    @GetMapping("/{id}/analysis")
    public ResponseEntity<SessionAnalysis> getAnalysis(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getAnalysis(id));
    }
}
