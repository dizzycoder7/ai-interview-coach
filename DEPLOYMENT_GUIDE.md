# 🚀 100% Free Production Deployment Guide

This guide walks you through deploying the complete **AI Interview Coach** platform for **$0 / month** using free-tier cloud platforms with automatic HTTPS (enabling camera and microphone access).

---

## 📋 Overview of the Free Architecture

```
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│     React Frontend        │      │    Spring Boot Backend    │      │     FastAPI AI Engine     │
│   Hosted on: Vercel       │ ───► │     Hosted on: Render     │ ───► │     Hosted on: Render     │
│  (Automatic Free HTTPS)   │      │   (Free Web Service)      │      │    (Free Docker Service)  │
└───────────────────────────┘      └─────────────┬─────────────┘      └─────────────┬─────────────┘
                                                 │                                  │
                                                 ▼                                  ▼
                                   ┌───────────────────────────┐      ┌───────────────────────────┐
                                   │     MySQL Database        │      │     Google Gemini API     │
                                   │ Hosted on: TiDB / Aiven   │      │    (1,500 req/day FREE)   │
                                   │     (5 GB Free Tier)      │      └───────────────────────────┘
                                   └───────────────────────────┘
```

---

## Step 1: Push Your Code to GitHub

1. Go to [github.com/new](https://github.com/new) and create a new repository named `ai-interview-coach` (leave it empty without initializing a README).
2. Open PowerShell in your project directory (`D:\Ai_interview`) and run:

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/ai-interview-coach.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create a Free MySQL Cloud Database (TiDB Serverless)

1. Go to [TiDB Cloud](https://tidbcloud.com) and sign up for a free account (no credit card needed).
2. Click **Create Cluster** and select **TiDB Serverless (Free)**.
3. Once created, click **Connect**:
   - Choose **Connect with General Client**.
   - Note down:
     - **Host**: e.g., `gateway01.us-east-1.prod.aws.tidbcloud.com`
     - **Port**: `4000`
     - **User**: e.g., `xxxxxx.root`
     - **Password**: (the password you created)
     - **Database**: `test` or create `ai_interview`

---

## Step 3: Deploy the AI Engine (Python FastAPI) on Render

1. Go to [render.com](https://render.com) and log in with your GitHub account.
2. Click **New +** > **Web Service**.
3. Select your `ai-interview-coach` repository.
4. Fill in the service details:
   - **Name**: `ai-interview-engine`
   - **Region**: Choose Oregon (US West) or Frankfurt (closest to your DB)
   - **Root Directory**: `ai-engine`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add:
   - `GEMINI_API_KEY`: `<Your Gemini API Key from Google AI Studio>`
   - `PORT`: `8000`
6. Click **Create Web Service**.
7. Once deployed, copy your free HTTPS URL:
   `https://ai-interview-engine.onrender.com`

---

## Step 4: Deploy the Backend (Spring Boot) on Render

1. In Render, click **New +** > **Web Service**.
2. Select the same repository `ai-interview-coach`.
3. Fill in the details:
   - **Name**: `ai-interview-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker` (Render will automatically build the `Dockerfile` with Maven)
   - **Instance Type**: `Free`
4. Add these **Environment Variables**:
   - `DB_HOST`: `<Your TiDB Host from Step 2>`
   - `DB_PORT`: `4000`
   - `DB_NAME`: `test` (or `ai_interview`)
   - `DB_USER`: `<Your TiDB User>`
   - `DB_PASSWORD`: `<Your TiDB Password>`
   - `AI_ENGINE_URL`: `<The URL from Step 3, e.g. https://ai-interview-engine.onrender.com>`
   - `SECRET_KEY`: `mySecretJwtKeyForAiInterviewCoachProduction2026`
   - `PORT`: `8080`
5. Click **Create Web Service**.
6. Once deployed, copy your backend HTTPS URL:
   `https://ai-interview-backend.onrender.com`

---

## Step 5: Deploy the Frontend (React + Vite) on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** > **Project**.
3. Select your `ai-interview-coach` repository and click **Import**.
4. Configure the project:
   - **Root Directory**: Click edit and select `frontend`.
   - **Framework Preset**: `Vite` (automatically detected).
5. Expand **Environment Variables** and add:
   - `VITE_BACKEND_URL`: `<The Backend URL from Step 4, e.g. https://ai-interview-backend.onrender.com>`
   - `VITE_AI_ENGINE_URL`: `<The AI Engine URL from Step 3, e.g. https://ai-interview-engine.onrender.com>`
6. Click **Deploy**!

Within 60 seconds, your application will be live at:
`https://ai-interview-coach.vercel.app`

---

## ✅ Post-Deployment Verification

1. Open your Vercel link (`https://...`).
2. Notice the **🔒 Secure Padlock (HTTPS)** in your browser address bar.
3. Click **"Start Practice Interview"** or upload a resume.
4. Allow browser camera & microphone permissions when prompted.
5. Deliver your answers and complete the session to test your real-time scorecards and model answers!
