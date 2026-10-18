-- ============================================================
-- AI Interview Coach - MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS ai_interview;
USE ai_interview;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resumes
CREATE TABLE IF NOT EXISTS resumes (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id            BIGINT NOT NULL,
    file_path          VARCHAR(500),
    s3_key             VARCHAR(500),
    parsed_skills      TEXT,
    parsed_experience  TEXT,
    uploaded_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Interview Sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT,
    interview_type   ENUM('TECHNICAL', 'BEHAVIORAL', 'CODING', 'MIXED') NOT NULL,
    status           ENUM('ACTIVE', 'COMPLETED', 'ABORTED') DEFAULT 'ACTIVE',
    recording_path   VARCHAR(500),
    s3_video_key     VARCHAR(500),
    s3_audio_key     VARCHAR(500),
    resume_text      TEXT,
    started_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at         TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Q&A Exchange per session
CREATE TABLE IF NOT EXISTS interview_qa (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id          BIGINT NOT NULL,
    question            TEXT NOT NULL,
    answer_text         TEXT,
    answer_audio_path   VARCHAR(500),
    follow_up_of        BIGINT,  -- references parent qa id
    ai_score            DECIMAL(4,2),
    ai_feedback         TEXT,
    emotion_snapshot    JSON,    -- emotion data at time of answer
    timestamp           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id),
    FOREIGN KEY (follow_up_of) REFERENCES interview_qa(id)
);

-- Final session analysis / scorecard
CREATE TABLE IF NOT EXISTS session_analysis (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id          BIGINT NOT NULL UNIQUE,
    confidence_score    DECIMAL(4,2),
    clarity_score       DECIMAL(4,2),
    depth_score         DECIMAL(4,2),
    eye_contact_score   DECIMAL(4,2),
    filler_word_count   INT DEFAULT 0,
    emotion_data        JSON,
    code_quality_score  DECIMAL(4,2),
    overall_score       DECIMAL(4,2),
    ai_summary          TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
);
