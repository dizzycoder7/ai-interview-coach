import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const AI_ENGINE_URL = import.meta.env.VITE_AI_ENGINE_URL || 'http://localhost:8000';

export const backendApi = axios.create({
  baseURL: BACKEND_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const aiApi = axios.create({
  baseURL: AI_ENGINE_URL,
});

// Session APIs
export const sessionApi = {
  create: (data) => backendApi.post('/api/sessions', data),
  get: (id) => backendApi.get(`/api/sessions/${id}`),
  saveQA: (id, data) => backendApi.post(`/api/sessions/${id}/qa`, data),
  end: (id, data) => backendApi.put(`/api/sessions/${id}/end`, data),
  getAnalysis: (id) => backendApi.get(`/api/sessions/${id}/analysis`),
};

// AI Engine APIs
export const interviewApi = {
  start: (data) => aiApi.post('/interview/start', data),
  evaluate: (data) => aiApi.post('/interview/evaluate', {
    session_id: String(data.session_id || Date.now()),
    question: data.question,
    answer_text: data.answer_text,
    interview_type: data.interview_type || 'TECHNICAL',
    conversation_history: data.conversation_history || data.history || [],
    resume_text: data.resume_text || null,
    experience_level: data.experience_level || 'JUNIOR',
    conversational_turn: data.conversational_turn !== undefined ? data.conversational_turn : 0,
    interviewer_persona: data.interviewer_persona || 'STRICT_CAMPUS',
    root_question: data.root_question || data.question,
    ...data,
  }),
  score: (data) => aiApi.post('/interview/score', {
    session_id: String(data.session_id || Date.now()),
    qa_pairs: data.qa_pairs || data.history || [],
    emotion_data: data.emotion_data || null,
    eye_contact_score: data.eye_contact_score,
    filler_word_count: data.filler_words_count !== undefined ? data.filler_words_count : (data.filler_word_count || 0),
    experience_level: data.experience_level || 'JUNIOR',
  }),
  finalizeScore: function (data) {
    return this.score(data);
  },
  nextQuestion: (data) => aiApi.post('/interview/evaluate', {
    session_id: data.session_id,
    question: data.question || 'Next question',
    answer_text: data.last_answer || '',
    interview_type: data.interview_type || 'TECHNICAL',
    conversation_history: data.history || [],
    resume_text: data.resume_text,
    experience_level: data.experience_level || 'JUNIOR',
  }),
  transcribe: (formData) => aiApi.post('/speech/transcribe', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  analyzeEmotion: (formData) => aiApi.post('/emotion/analyze-frame', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  analyzeFillerWords: (text) => aiApi.post('/speech/analyze-filler-words', { text }),
  parseResume: (formData) => aiApi.post('/resume/parse', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  generateWarmupRound: (data) => aiApi.post('/interview/warmup/generate-round', data),
  analyzeWarmupAnswer: (data) => aiApi.post('/interview/warmup/analyze-answer', data),
};

