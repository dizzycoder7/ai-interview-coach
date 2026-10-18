# AI Interview Coach

A full-stack AI-powered mock interview platform with real-time voice, webcam, and AI evaluation.

## 🗂️ Project Structure
```
Ai_interview/
├── frontend/          # React + Vite (port 5173)
├── backend/           # Java Spring Boot (port 8080)
├── ai-engine/         # Python FastAPI (port 8000)
├── database/          # MySQL schema
├── docker-compose.yml
└── .env.example
```

## ⚡ Quick Start (Local Dev without Docker)

### 1. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start MySQL
```bash
# Using Docker just for MySQL
docker run -d --name ai_interview_db \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=ai_interview \
  -p 3306:3306 \
  -v $(pwd)/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql \
  mysql:8.0
```

### 3. Start Python AI Engine
```bash
cd ai-engine
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env       # Add your API keys
uvicorn main:app --reload --port 8000
```

### 4. Start Spring Boot Backend
```bash
cd backend
# Set env vars or update application.yml
mvn spring-boot:run
```

### 5. Start React Frontend
```bash
cd frontend
cp .env.example .env
npm run dev
```

Open http://localhost:5173

---

## 🐳 Docker (All Services)
```bash
cp .env.example .env   # Fill in your API keys
docker-compose up --build
```

Open http://localhost:5173

---

## 🔑 Required API Keys (in .env)
| Key | Get from |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com |
| `OPENAI_API_KEY` | https://platform.openai.com |
| `AWS_ACCESS_KEY_ID` | AWS Console (optional - for S3) |
| `AWS_SECRET_ACCESS_KEY` | AWS Console (optional - for S3) |

> AWS keys are optional for local dev. Videos are saved locally if S3 is not configured.

---

## 🤖 AI Services Used
- **Google Gemini API** — Primary LLM for question generation & answer evaluation
- **OpenAI GPT-4o** — Fallback LLM
- **OpenAI Whisper** — Speech-to-text (local model)
- **DeepFace** — Webcam emotion analysis
- **MediaPipe** — Browser-side face mesh / eye contact
- **Hugging Face** — Filler word & tone analysis

## 🛠️ Tech Stack
- **Frontend**: React + Vite, CSS Modules
- **Backend**: Java 21 + Spring Boot 3.3
- **AI Engine**: Python 3.11 + FastAPI
- **Database**: MySQL 8.0
- **Containers**: Docker + Docker Compose
