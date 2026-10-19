import os
import json
import re
import asyncio
import random
from typing import Optional
import google.generativeai as genai
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Ignore placeholder values
if GEMINI_API_KEY and GEMINI_API_KEY.startswith("your_"):
    GEMINI_API_KEY = None
if OPENAI_API_KEY and OPENAI_API_KEY.startswith("your_"):
    OPENAI_API_KEY = None

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class LLMService:
    def __init__(self):
        # gemini-3.5-flash-lite is ultra-fast with active free-tier quota
        self.gemini_model = genai.GenerativeModel("gemini-3.5-flash-lite") if GEMINI_API_KEY else None
        self.openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        self.primary = "gemini" if GEMINI_API_KEY else "openai"

    async def _call_gemini(self, prompt: str) -> str:
        """Call Gemini asynchronously with timeout and model fallbacks."""
        models_to_try = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"]
        last_err = None

        for m_name in models_to_try:
            try:
                model = genai.GenerativeModel(m_name)
                response = await asyncio.wait_for(
                    model.generate_content_async(prompt),
                    timeout=8.0
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                last_err = e
                continue

        raise last_err or RuntimeError("Gemini failed on all models")

    async def _call_openai(self, prompt: str, system: str = "") -> str:
        """Call OpenAI asynchronously with timeout."""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        # Try gpt-4o-mini first for speed and lower cost
        for model in ["gpt-4o-mini", "gpt-4o"]:
            try:
                resp = await asyncio.wait_for(
                    self.openai_client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=0.7,
                        max_tokens=500
                    ),
                    timeout=8.0
                )
                return resp.choices[0].message.content
            except Exception:
                continue

        raise RuntimeError("OpenAI failed on all models")

    async def _call_llm(self, prompt: str, system: str = "") -> str:
        """Call primary LLM, fallback to secondary on error, then smart fallback."""
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        primary_err = None

        if self.primary == "gemini" and self.gemini_model:
            try:
                return await self._call_gemini(full_prompt)
            except Exception as e:
                primary_err = e
        elif self.openai_client:
            try:
                return await self._call_openai(prompt, system)
            except Exception as e:
                primary_err = e

        # Fallback to secondary if available
        if self.primary == "gemini" and self.openai_client:
            try:
                return await self._call_openai(prompt, system)
            except Exception:
                pass
        elif self.primary == "openai" and self.gemini_model:
            try:
                return await self._call_gemini(full_prompt)
            except Exception:
                pass

        print(f"External LLM warning: {primary_err}. Falling back to internal engine.")
        return ""

    async def generate_opening_question(
        self,
        interview_type: str,
        resume_text: Optional[str],
        candidate_name: str,
        experience_level: str = "JUNIOR"
    ) -> dict:
        level_upper = (experience_level or "JUNIOR").upper()
        if level_upper in ["FRESHER", "BEGINNER"]:
            level_upper = "JUNIOR"

        if interview_type.upper() in ["BEHAVIORAL", "HR"]:
            system = """You are an HR panel member from an Indian IT services company's campus placement drive (evaluating freshers for companies like TCS, Infosys, Wipro, Cognizant, Accenture, Capgemini).
The candidate is a final-year B.Tech student or a fresher.
Cover self-introduction, strengths and weaknesses, teamwork, handling pressure, willingness to relocate and work in shifts, willingness to learn, and project contribution.
Use simple, clear English. Ask one question at a time. Follow up on the candidate's own words. Be polite but firm.

Include a helpful hint/tip in 'tips' to guide the candidate on how to structure their response.

Return ONLY valid JSON matching this schema:
{
  "question": "...",
  "tips": "..."
}"""
        else:
            system = """You are a panel member from an Indian IT services company's campus placement drive. The candidate is a final-year B.Tech student or a fresher.
Ask about Core Java, OOPs, Collections, DBMS and SQL, basic data structures, aptitude-style logic, and the candidate's final-year project.
Use simple, clear English. Ask one question at a time. Follow up on the candidate's own words. Do not ask system design or distributed systems questions. Be polite but firm.

If candidate resume text or project highlights are provided, inspect their project and ask an opening question specifically about what THEY built in their project (e.g. "I see you built a [Project Name]. What was your specific role, and what database did you use?").

Include a helpful hint/tip in 'tips' to guide the candidate on how to structure their response.

Return ONLY valid JSON matching this schema:
{
  "question": "...",
  "tips": "..."
}"""

        resume_context = (
            f"Candidate Resume Details:\n{resume_text[:2500]}"
            if resume_text and len(resume_text.strip()) > 30
            else "No resume uploaded. Candidate target stack: Core Java, Spring Boot, MySQL, OOPs, Web Development."
        )

        prompt = f"""
Candidate: {candidate_name}
Target Level: {level_upper} (Junior/Fresher: 0-2 yrs, Mid: 2-5 yrs, Senior: 5+ yrs)
Interview Track: {interview_type}
{resume_context}

Formulate an opening question tailored specifically to this candidate, their target level ({level_upper}), and their listed resume tools and projects.
"""
        raw = await self._call_llm(prompt, system)
        if raw:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except Exception:
                    pass

        # Smart fallback if API is unreachable
        return self._fallback_opening_question(interview_type, candidate_name, level_upper, resume_text)


    async def evaluate_and_followup(
        self,
        question: str,
        answer: str,
        interview_type: str,
        history: list,
        resume_text: Optional[str] = None,
        experience_level: str = "JUNIOR"
    ) -> dict:
        clean_ans = answer.strip()
        words = clean_ans.split()
        word_count = len(words)
        level_upper = (experience_level or "JUNIOR").upper()
        if level_upper in ["FRESHER", "BEGINNER"]:
            level_upper = "JUNIOR"

        # STRICT HARSH CHECK: If candidate spoke almost nothing, gave 1-5 words, or skipped
        if word_count < 8 or clean_ans in ["", "(No verbal answer provided / Candidate skipped question)", "nothing", "i don't know", "idk", "skip"]:
            return {
                "score": 1,
                "feedback": f"Failing response: Only {word_count} words recorded. Saying almost nothing, staying silent, or giving a 1-word non-answer results in an immediate failing score (1/10). In a real technical interview, silence or dodging questions is an instant rejection.",
                "follow_up_question": "Let's reset: Can you explain the fundamental concept behind this problem, or walk me through how you would begin breaking down the solution?",
                "improved_answer": (
                    f"💡 Everyday Analogy (ELI5):\n"
                    f"Think of this problem like an organized library or filing cabinet. Instead of looking through every single item blindly, you use categorized indexes or structured keys so any item can be found immediately.\n\n"
                    f"🏆 The 10/10 Gold Standard Interview Script:\n"
                    f"1. Direct Thesis: 'The core objective here is solving the problem using clear, structured logic and appropriate data structures.'\n"
                    f"2. Core Concepts: 'I would implement this step-by-step, ensuring clean object-oriented encapsulation and validating boundary inputs.'\n"
                    f"3. Practical Edge: 'I would also account for edge cases such as null values, empty collections, and potential runtime exceptions.'\n\n"
                    f"🔍 What Your Answer Was Missing:\n"
                    f"• You provided virtually no technical explanation ({word_count} words).\n"
                    f"• Fundamental concepts and logic were completely omitted.\n"
                    f"• Always attempt to walk through your thought process aloud, even if unsure."
                ),
                "strengths": ["Question presented to candidate"],
                "improvements": [
                    "Must actively speak and deliver complete technical solutions",
                    "Do not remain silent or give one-word non-answers"
                ]
            }

        # STRICT REPETITION CHECK: If candidate repeated phrases or vocabulary diversity is low
        lower_words = [re.sub(r'[^a-z0-9]', '', w.lower()) for w in words if len(w) > 1]
        unique_ratio = len(set(lower_words)) / max(1, len(lower_words))
        trigrams = {}
        for i in range(len(lower_words) - 2):
            tri = f"{lower_words[i]} {lower_words[i+1]} {lower_words[i+2]}"
            trigrams[tri] = trigrams.get(tri, 0) + 1
        max_tri_freq = max(trigrams.values()) if trigrams else 0

        if (unique_ratio < 0.45 and word_count >= 25) or max_tri_freq >= 3:
            return {
                "score": 2,
                "feedback": f"Failing score (2/10): High repetition detected. The response repeats introductory phrases ({max_tri_freq} repetitions of identical phrases) with only {int(unique_ratio*100)}% unique words. It lacks structured technical depth and concrete project examples. In an IT campus placement drive (TCS, Infosys, Wipro, Accenture), avoid repeating greetings. Deliver a crisp introduction, state your final-year project title and tech stack, and explain your personal contribution.",
                "follow_up_question": "Let's reset and test your Core Java fundamentals: In Java, can you explain the difference between Method Overloading and Method Overriding with a short code example?",
                "improved_answer": (
                    f"💡 Everyday Analogy (ELI5):\n"
                    f"Think of an interview introduction like a resume summary. You have 30 seconds to tell the panel who you are, what you built, and what technologies you know.\n\n"
                    f"🏆 The 10/10 Gold Standard Interview Script:\n"
                    f"1. Crisp Introduction: 'Thank you for having me. My name is [Name], final-year B.Tech Computer Science student at [University].'\n"
                    f"2. Final-Year Project: 'My project is [Project Name], developed using Core Java, Spring Boot, and MySQL. My role focused on designing the REST APIs and database schema.'\n"
                    f"3. Why IT Services: 'I want to start my career with an IT services company because of the structured foundational training and opportunity to work on enterprise client projects.'\n\n"
                    f"🔍 What Your Answer Was Missing:\n"
                    f"• High phrase repetition with no structured technical details.\n"
                    f"• Did not mention project architecture or technologies used.\n"
                    f"• Did not address the question about joining an IT services firm."
                ),
                "strengths": ["Spoke aloud and attempted the response"],
                "improvements": [
                    "Eliminate repetitive phrases and introductory loops",
                    "Clearly state project title, tech stack (Java/SQL), and your role",
                    "Structure your answer into 3 distinct parts"
                ]
            }

        if interview_type.upper() in ["BEHAVIORAL", "HR"]:
            system = """You are an HR panel member from an Indian IT services company's campus placement drive evaluating a final-year B.Tech student or fresher.
Score as a recruiter would for a fresher. Judge correctness, clarity, examples and honesty about what the candidate knows. Do not expect senior-level depth. Return JSON only.
Cover self-introduction, strengths and weaknesses, teamwork, handling pressure, willingness to relocate and work in shifts, willingness to learn, and project contribution.
Use simple, clear English. Ask one question at a time. Follow up on the candidate's own words. Be polite but firm.

STRICT REPETITION AND SUBSTANCE CHECK:
- If the candidate's answer is repetitive, echoes greetings, lacks structured points, or does not provide concrete examples, score MUST NOT exceed 2-3 out of 10.
- Never award a high score (7-10) for raw length or word count if the text is repetitive or lacks substance.

SCORING GUIDELINES (1 to 10):
- 1-4: Incoherent, evasive, silent, repetitive loops, or unable to communicate basic thoughts.
- 5-6: Generic answers without concrete examples, but polite and willing to learn.
- 7-8: Clear, confident answers with genuine college/project examples and positive attitude.
- 9-10: Exceptional clarity, excellent examples (teamwork, handling pressure, adaptability), and strong communication.

MASTER MODEL ANSWER RULES ('improved_answer'):
Deliver an exemplary 3-part explanation:
Part 1: 💡 Everyday Analogy (ELI5): A simple real-world analogy.
Part 2: 🏆 Gold Standard Answer Script: How a top fresher structures their response (Situation -> Action -> Learning/Result).
Part 3: 🔍 What Your Answer Was Missing: Direct, encouraging bullet points on what was missing.

Return ONLY valid JSON matching this schema:
{
  "score": 7,
  "feedback": "Constructive feedback from the HR recruiter...",
  "follow_up_question": "Next HR or project question following up on what they said...",
  "improved_answer": "💡 Everyday Analogy (ELI5):\n...\n\n🏆 Gold Standard Answer Script:\n...\n\n🔍 What Your Answer Was Missing:\n...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}"""
        else:
            system = """You are a panel member from an Indian IT services company's campus placement drive.
The candidate is a final-year B.Tech student or a fresher.
Score as a recruiter would for a fresher. Judge correctness, clarity, examples and honesty about what the candidate knows. Do not expect senior-level depth. Return JSON only.
Ask about Core Java, OOPs, Collections, DBMS and SQL, basic data structures, aptitude-style logic, and the candidate's final-year project.
Use simple, clear English. Ask one question at a time. Follow up on the candidate's own words. Do not ask system design or distributed systems questions. Be polite but firm.

STRICT REPETITION AND SUBSTANCE CHECK:
- If the candidate's answer is repetitive, repeats introductory greetings, lacks structured points, or does not provide concrete examples, score MUST NOT exceed 2-3 out of 10.
- Never award a high score (7-10) for raw length or word count if the text is repetitive or lacks substance.

SCORING GUIDELINES (1 to 10):
- 1-4: Fundamental misconceptions, repetitive loops, incorrect syntax/logic, or unable to explain basic principles.
- 5-6: Knows standard textbook definition, but lacks practical examples or struggles to explain how it works in code.
- 7-8: Good conceptual clarity, gave solid examples (Java classes, OOP concepts, basic SQL queries), understands why and how it works.
- 9-10: Exceptional clarity, proactively explains edge cases (e.g. null checks, boundary conditions), clean code, and solid understanding of their project.

ADAPTIVE FOLLOW-UP RULES:
- Deeply analyze what the candidate actually said in their answer.
- Ask a follow-up that tests deeper comprehension of the fundamental concept or connects directly to their final-year project.
  * Examples: "How does HashMap handle collisions in Java?", "What is the difference between @Autowired and Constructor Injection?", "Can you explain how an INNER JOIN differs from a LEFT JOIN with a query example?", "In your final-year project, how did you handle data validation and database storage?"
- STRICT PROHIBITION: DO NOT ask system design, microservices, or complex distributed systems questions. Keep questions focused on code logic, fundamentals, and their project.

MASTER MODEL ANSWER RULES ('improved_answer'):
Deliver an exemplary 3-part explanation:
Part 1: 💡 Everyday Analogy (ELI5): A crystal-clear real-world metaphor that anyone can understand in 10 seconds.
Part 2: 🏆 Gold Standard Answer Script: The exact, structured answer an exemplary candidate gives (crisp definition -> code structure/internal mechanics -> edge cases & best practices).
Part 3: 🔍 What Your Answer Was Missing: Direct, honest bullet points highlighting what the candidate omitted, assumed, or stated incorrectly.

Return ONLY valid JSON matching this schema:
{
  "score": 7,
  "feedback": "Constructive evaluation citing specific strengths and gaps...",
  "follow_up_question": "Follow-up question testing deeper understanding of the fundamental topic or project...",
  "improved_answer": "💡 Everyday Analogy (ELI5):\n...\n\n🏆 Gold Standard Answer Script:\n...\n\n🔍 What Your Answer Was Missing:\n...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}"""

        resume_snippet = f"\nCandidate Resume Highlights:\n{resume_text[:1500]}" if resume_text and len(resume_text.strip()) > 30 else ""

        prompt = f"""
Interview Track: {interview_type}
Candidate Level: {level_upper}
Question Asked: {question}
Candidate's Answer: {answer}
Previous Conversation Rounds: {len(history)}
{resume_snippet}

Evaluate the answer accurately for a {level_upper} level candidate and generate an appropriate follow-up and the 3-part master model answer.
"""
        raw = await self._call_llm(prompt, system)
        if raw:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except Exception:
                    pass

        # Smart fallback if API is unreachable
        return self._fallback_evaluation(question, answer, interview_type, history, resume_text, level_upper)


    async def generate_scorecard(self, qa_pairs: list, emotion_data: Optional[dict], eye_contact_score: Optional[float], filler_word_count: int) -> dict:
        # STRICT VERDICT INTEGRITY: Check total words spoken
        total_words = sum([len(qa.get('answer_text', '').split()) for qa in qa_pairs])
        has_substantive = any(
            len(qa.get('answer_text', '').split()) >= 8 
            and qa.get('answer_text', '').strip() not in ["(No verbal answer provided / Candidate skipped question)", ""]
            for qa in qa_pairs
        )

        # If candidate spoke almost nothing, gave empty answers, or terminated early:
        if not qa_pairs or not has_substantive or total_words < 12:
            print(f"Enforcing Not yet: total_words={total_words}, qa_pairs_count={len(qa_pairs)}")
            return {
                "overall_score": 15,
                "hiring_verdict": "Not yet",
                "hiring_decision_rationale": (
                    f"Not yet (Campus Placement Assessment). The candidate spoke virtually nothing substantive "
                    f"(recording only {total_words} words total across the entire session) or terminated prematurely. "
                    "In an IT campus placement interview, staying silent, skipping questions, or providing empty responses "
                    "indicates a lack of preparation. The candidate must actively speak aloud and attempt questions."
                ),
                "technical_depth_score": 10,
                "system_design_score": 10,
                "communication_score": 15,
                "presence_score": min(60, int((eye_contact_score or 50) * 0.7)),
                "confidence_score": 15,
                "clarity_score": 15,
                "depth_score": 10,
                "ai_summary": f"Session concluded with non-substantive answers ({total_words} words recorded). Needs thorough preparation.",
                "red_flags": [
                    f"Provided virtually no technical explanation ({total_words} words spoken in total)",
                    "Did not attempt the core interview questions",
                    "Session ended without demonstrating problem-solving ability"
                ],
                "top_strengths": ["Attended the campus placement mock interview"],
                "key_improvements": [
                    "Must actively speak and deliver complete solutions aloud",
                    "Do not end or skip questions without stating your thought process",
                    "Revise Core Java, OOPs concepts, and SQL basics"
                ],
                "action_plan": [
                    "Practice speaking aloud for at least 1-2 minutes per question",
                    "Prepare clear answers for self-introduction and final-year project",
                    "Review basic data structures and database queries"
                ],
                "recommended_topics": ["Core Java Fundamentals", "SQL Queries", "Interview Communication"]
            }

        system = """You are the Lead Interview Evaluator for an Indian IT services campus placement drive (evaluating freshers for companies like TCS, Infosys, Wipro, Cognizant, Accenture, Capgemini).
        Synthesize the candidate's entire interview into a constructive, realistic placement readiness assessment.

        Score as a recruiter would for a fresher. Judge correctness, clarity, examples and honesty about what the candidate knows. Do not expect senior-level depth. Return JSON only.

        Determine the definitive PLACEMENT READINESS VERDICT:
        - "Ready" (Overall score >= 70): Solid fundamentals in Core Java, OOPs, DBMS/SQL, clear communication, and good project understanding.
        - "Almost" (Overall score 50 to 69): Knows basic definitions but lacks code examples, project depth, or confident delivery.
        - "Not yet" (Overall score < 50): Significant conceptual gaps, silent or incomplete answers, needs revision before campus drives.

        Return ONLY valid JSON matching this schema:
        {
          "overall_score": 75,
          "hiring_verdict": "Ready",
          "hiring_decision_rationale": "Constructive 2-3 paragraph placement assessment explaining why the candidate is Ready, Almost, or Not yet...",
          "technical_depth_score": 75,
          "system_design_score": 70,
          "communication_score": 80,
          "presence_score": 80,
          "confidence_score": 75,
          "clarity_score": 80,
          "depth_score": 75,
          "ai_summary": "Placement readiness summary...",
          "red_flags": [
            "Struggled with method overriding vs overloading in Java",
            "Hesitated when explaining final-year project architecture"
          ],
          "top_strengths": ["Clear explanation of OOP encapsulation", "Good willingness to learn new technologies"],
          "key_improvements": ["Practice writing SQL joins and queries", "Be more specific when describing personal contributions to team project"],
          "action_plan": [
            "Revise Core Java Collections (ArrayList vs LinkedList, HashMap)",
            "Prepare a crisp 2-minute pitch for your final-year project",
            "Practice answering HR questions on relocation and shift flexibility"
          ],
          "recommended_topics": ["Core Java & OOPs", "SQL Queries & Normalization", "HR & Project Communication"]
        }"""

        qa_summary = "\n".join([f"Q: {qa.get('question','')[:120]} | A: {qa.get('answer_text','')[:160]}" for qa in qa_pairs[:8]])
        prompt = f"""
        Interview Transcripts:
        {qa_summary}
        Candidate Stats: Total Words Spoken: {total_words}, Eye contact: {eye_contact_score or 80}%, Total Fillers: {filler_word_count}

        Generate the complete campus placement debrief JSON.
        """
        raw = await self._call_llm(prompt, system)
        if raw:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except Exception:
                    pass

        return self._fallback_scorecard(qa_pairs, eye_contact_score, filler_word_count)

    def _fallback_opening_question(
        self,
        interview_type: str,
        candidate_name: str,
        experience_level: str = "JUNIOR",
        resume_text: Optional[str] = None
    ) -> dict:
        level_upper = (experience_level or "JUNIOR").upper()
        if level_upper in ["FRESHER", "BEGINNER"]:
            level_upper = "JUNIOR"

        pools = {
            "TECHNICAL": [
                {
                    "question": f"Welcome {candidate_name}! To start our placement technical round: Could you explain the 4 core pillars of Object-Oriented Programming (Encapsulation, Inheritance, Polymorphism, Abstraction) and give a practical Java code example of Method Overloading vs Method Overriding?",
                    "tips": "Provide clear real-world examples (like a Vehicle or Payment hierarchy). Mention compile-time vs runtime polymorphism."
                },
                {
                    "question": f"Hello {candidate_name}! In Core Java, could you explain the internal working of a HashMap under the hood? Specifically, how do hashCode, buckets, equals(), and collision resolution work during put() and get()?",
                    "tips": "Walk through step-by-step what happens when adding a key-value pair, collision handling, and average time complexity."
                },
                {
                    "question": f"Welcome {candidate_name}! In DBMS and SQL, what is the exact difference between Primary Key, Unique Key, and Foreign Key? How does database indexing work, and what are clustered vs non-clustered indexes?",
                    "tips": "Highlight NULL allowance differences, referential integrity with foreign keys, and B-tree index lookups."
                },
                {
                    "question": f"Hello {candidate_name}! Can you explain the difference between Stack Memory and Heap Memory in Java? How does Java's Garbage Collector determine when an object is eligible for garbage collection?",
                    "tips": "Mention method frames, local variables on stack, object instances on heap, and GC roots."
                },
                {
                    "question": f"Welcome {candidate_name}! Walk me through the architecture and database schema of your final-year engineering project. What modules did you personally write, and what was the hardest bug you fixed?",
                    "tips": "Structure your answer: 1) Problem statement, 2) Tech stack & architecture, 3) Your individual contribution, 4) A concrete bug and fix."
                }
            ],
            "BEHAVIORAL": [
                {
                    "question": f"Hi {candidate_name}! Could you briefly introduce yourself, tell me about your final-year project, and share why you are interested in starting your career with an IT services company?",
                    "tips": "Keep your introduction concise (under 2 minutes). Highlight your technical skills, college project role, and enthusiasm to learn."
                },
                {
                    "question": f"Welcome {candidate_name}! Tell me about a time during a college project or group assignment when you faced a disagreement with a teammate. How did you communicate and resolve it?",
                    "tips": "Use the STAR method: Situation, Task, Action you took, and positive Result."
                },
                {
                    "question": f"Hello {candidate_name}! In IT services, project allocations may require working in rotational shifts or relocating to cities like Pune, Bangalore, or Chennai. How flexible are you with relocation and shift schedules?",
                    "tips": "Give a clear, enthusiastic, affirmative answer demonstrating flexibility and willingness to learn."
                }
            ],
            "CODING": [
                {
                    "question": f"Hello {candidate_name}! If you are given an array of integers and a target sum, how would you find two numbers that add up to the target? Compare the brute-force approach with an optimized HashMap approach.",
                    "tips": "Mention brute force is O(N^2) time and O(1) space. The HashMap approach stores complement values for O(N) time and O(N) space."
                },
                {
                    "question": f"Welcome {candidate_name}! How would you determine if two given strings are Anagrams of each other (for example, 'listen' and 'silent')? What is the time and space complexity?",
                    "tips": "Sorting takes O(N log N). Character frequency array runs in O(N) time with O(1) auxiliary space."
                },
                {
                    "question": f"Hi {candidate_name}! In a singly linked list, how can you detect if there is a cycle or loop present? Explain Floyd's Cycle-Finding Algorithm (slow and fast pointers).",
                    "tips": "Explain the tortoise and hare pointers and why they are guaranteed to meet if a cycle exists."
                }
            ],
            "MIXED": [
                {
                    "question": f"Welcome {candidate_name}! Walk me through your final-year engineering project. What problem did it solve, what technologies did you choose, what was your personal contribution, and what was the hardest bug you fixed?",
                    "tips": "Structure your answer around the project objectives, your specific module, and how you tested the application."
                },
                {
                    "question": f"Hi {candidate_name}! In enterprise software, how do OOP principles like Encapsulation and Abstraction help structure a database-driven application? What is the role of Primary and Foreign Keys in data integrity?",
                    "tips": "Connect OOP models to database tables, and explain how foreign keys prevent orphaned records."
                }
            ]
        }
        track_pool = pools.get(interview_type.upper(), pools["TECHNICAL"])
        return random.choice(track_pool)

    def _fallback_evaluation(
        self,
        question: str,
        answer: str,
        interview_type: str,
        history: list,
        resume_text: Optional[str] = None,
        experience_level: str = "JUNIOR"
    ) -> dict:
        words = answer.strip().split()
        word_count = len(words)
        level_upper = (experience_level or "JUNIOR").upper()
        if level_upper in ["FRESHER", "BEGINNER"]:
            level_upper = "JUNIOR"

        # Check repetition
        lower_words = [re.sub(r'[^a-z0-9]', '', w.lower()) for w in words if len(w) > 1]
        unique_ratio = len(set(lower_words)) / max(1, len(lower_words))
        trigrams = {}
        for i in range(len(lower_words) - 2):
            tri = f"{lower_words[i]} {lower_words[i+1]} {lower_words[i+2]}"
            trigrams[tri] = trigrams.get(tri, 0) + 1
        max_tri_freq = max(trigrams.values()) if trigrams else 0

        # High repetition check
        if (unique_ratio < 0.45 and word_count >= 25) or max_tri_freq >= 3:
            return {
                "score": 2,
                "feedback": f"Failing score (2/10): High repetition detected ({word_count} words recorded, but only {int(unique_ratio*100)}% unique words with repeated phrase loops). Introductory greetings were repeated without technical depth or concrete project examples. For IT campus placements (TCS, Infosys, Wipro, Accenture), eliminate repeated phrases, state your final-year project title, tech stack (Java/SQL), and describe what you personally built.",
                "follow_up_question": "Let's test your Core Java fundamentals: Can you explain the difference between Method Overloading and Method Overriding with a short code example?",
                "improved_answer": (
                    f"💡 Everyday Analogy (ELI5):\n"
                    f"Repeating the greeting leaves no time to explain what product you built. Think of your response as an elevator pitch with 3 crisp points.\n\n"
                    f"🏆 The 10/10 Gold Standard Interview Script:\n"
                    f"1. Crisp Introduction: 'Thank you for having me. My name is [Name], final-year B.Tech Computer Science student at [University].'\n"
                    f"2. Final-Year Project: 'My project is [Project Name], developed using Core Java, Spring Boot, and MySQL. My role focused on designing the REST APIs and database schema.'\n"
                    f"3. Why IT Services: 'I want to start my career with an IT services company because of the structured foundational training and opportunity to work on large-scale enterprise systems.'\n\n"
                    f"🔍 What Your Answer Was Missing:\n"
                    f"• High phrase repetition with no structured technical details.\n"
                    f"• Did not mention project architecture or technologies used.\n"
                    f"• Did not address the question about joining an IT services firm."
                ),
                "strengths": ["Spoke aloud and attempted the response"],
                "improvements": ["Eliminate repetitive phrases", "State project title, tech stack, and your role", "Structure your answer into 3 distinct parts"]
            }

        # Short greeting-only or fluff
        has_tech = bool(re.search(r'(java|sql|oops|class|object|database|project|spring|react|python|api|html|css|table|join|query|controller|backend|frontend|server|method|inheritance|polymorphism|encapsulation|abstraction|hashmap|array|loop)', answer, re.IGNORECASE))
        if word_count < 30 and not has_tech:
            return {
                "score": 3,
                "feedback": f"Score: 3/10. Polite start, but incomplete answer ({word_count} words). You gave an introductory greeting without discussing your engineering project or core subjects. In IT campus drives, recruiters evaluate whether you can discuss your engineering project and core subjects.",
                "follow_up_question": "Can you walk me through your final-year engineering project? What technologies did you use and what was your personal contribution?",
                "improved_answer": (
                    f"💡 Everyday Analogy (ELI5):\n"
                    f"A greeting opens the door, but the actual interview begins when you discuss your project and technical skills.\n\n"
                    f"🏆 Gold Standard Answer Script:\n"
                    f"Briefly introduce yourself (college, degree), immediately transition to your final-year project architecture, and state why you chose your tech stack.\n\n"
                    f"🔍 What Your Answer Was Missing:\n"
                    f"• Final-year project walkthrough, tech stack details, and motivation for IT services."
                ),
                "strengths": ["Polite conversational delivery"],
                "improvements": ["Include project details and technical stack", "Answer all parts of the question"]
            }

        # Basic definition without examples vs solid technical answer
        if not has_tech or word_count < 55:
            score = 5
        else:
            score = min(8, max(6, int(5 + (word_count / 40))))

        junior_follow_ups = [
            "That's a good foundation. In Core Java, what is the crucial difference between an Interface and an Abstract Class, and when would you choose one over the other?",
            "In MySQL, could you explain the difference between an INNER JOIN and a LEFT JOIN, and how adding an index on a foreign key improves query speed?",
            "In Java collections, when would you choose an ArrayList over a LinkedList, and what are their lookup and insertion complexities?",
            "In your final-year project, how did you handle data validation and error handling for incoming user requests before storing data in the database?"
        ]
        q_idx = len(history) % len(junior_follow_ups)

        is_project_q = bool(re.search(r'project|built|role|academic|application|contribution', question, re.I))
        if is_project_q:
            improved_answer = (
                f"💡 Everyday Analogy (Explain Like I'm 5):\n"
                f"Telling an interviewer 'I built the backend for an assessment app' is like showing just the book cover. "
                f"Recruiters need to see the chapters—the database schema, REST APIs, and automated evaluation logic you personally wrote.\n\n"
                f"🏆 10/10 Gold Standard Ready-Made Interview Script:\n"
                f"\"I developed an Automated Lab Assessment & Coding Practice Web Platform for our university department. Previously, professors had to manually grade every student's lab code, leading to delayed feedback. I handled the backend development using Java, Spring Boot, and MySQL. Specifically, I designed the relational database schema for Students, Tests, and Submissions, built the REST APIs for assignment submissions, and wrote the execution runner that evaluates code against automated test cases with a 2-second timeout to prevent infinite loops. The project was successfully piloted with a batch of 60 students, eliminating manual grading.\"\n\n"
                f"🔍 What Your Answer Was Missing:\n"
                f"• Specify the exact technologies used (e.g. Java, Spring Boot, MySQL, REST APIs).\n"
                f"• Break down 2-3 concrete modules you personally designed and coded.\n"
                f"• Mention a technical challenge or bug you solved (e.g. execution timeouts or database indexing)."
            )
        else:
            improved_answer = (
                f"💡 Everyday Analogy (Explain Like I'm 5):\n"
                f"Think of this concept like an everyday organized system (e.g. a restaurant menu or a university library index). "
                f"Instead of handling every order or searching every shelf blindly, standard rules and organized categories make the lookup fast, predictable, and error-free.\n\n"
                f"🏆 10/10 Gold Standard Ready-Made Interview Script:\n"
                f"State the core definition in 1-2 concise sentences -> show concrete Java code or SQL query syntax -> highlight edge cases (null checks, boundary conditions) -> explain real-world application.\n\n"
                f"🔍 What Your Answer Was Missing:\n"
                f"• Provide a concrete code or design example to demonstrate practical understanding.\n"
                f"• Highlight potential edge cases (like null checks or empty inputs).\n"
                f"• Connect the concept to how you used it in your project or coursework."
            )

        return {
            "score": score,
            "feedback": f"Good effort explaining the concept ({word_count} words). To elevate your answer, include concrete Java/SQL code examples and state edge cases proactively.",
            "follow_up_question": junior_follow_ups[q_idx],
            "improved_answer": improved_answer,
            "strengths": ["Clear communication", "Demonstrated foundational awareness"],
            "improvements": ["Give concrete code syntax examples", "Address boundary cases and null handling"]
        }


    def _fallback_scorecard(self, qa_pairs: list, eye_contact_score: Optional[float], filler_word_count: int) -> dict:
        total_words = sum([len(qa.get('answer_text', '').split()) for qa in qa_pairs])
        count = len(qa_pairs)

        if count == 0 or total_words < 12:
            return {
                "overall_score": 15,
                "hiring_verdict": "Not yet",
                "hiring_decision_rationale": (
                    f"Not yet (Campus Placement Assessment). The candidate spoke virtually nothing substantive "
                    f"({total_words} words recorded) or terminated the interview prematurely. In an IT campus placement interview, "
                    "skipping questions or staying silent indicates a need for structured preparation before placement drives."
                ),
                "technical_depth_score": 10,
                "system_design_score": 10,
                "communication_score": 15,
                "presence_score": min(60, int((eye_contact_score or 50) * 0.7)),
                "confidence_score": 15,
                "clarity_score": 15,
                "depth_score": 10,
                "ai_summary": f"Session concluded with non-substantive answers ({total_words} words). Needs practice.",
                "red_flags": [
                    f"Candidate spoke fewer than 12 words across the session ({total_words} words)",
                    "Failed to provide technical or project explanations"
                ],
                "top_strengths": ["Attended the campus placement mock session"],
                "key_improvements": [
                    "Must deliver full technical explanations aloud",
                    "Do not skip questions or terminate early without answering"
                ],
                "action_plan": [
                    "Practice answering technical interview questions aloud with a timer",
                    "Review Core Java and database fundamentals",
                    "Prepare self-introduction and final-year project walkthrough"
                ],
                "recommended_topics": ["Core Java Fundamentals", "SQL Queries", "Interview Communication"]
            }

        total_score = sum([qa.get("ai_score", 1) for qa in qa_pairs])
        avg_score = round(total_score / count, 1)

        if avg_score >= 7.0:
            verdict = "Ready"
        elif avg_score >= 5.0:
            verdict = "Almost"
        else:
            verdict = "Not yet"

        tech_depth = min(95, max(15, int(avg_score * 10 + 2)))
        prob_solving = min(95, max(15, int(avg_score * 10 - 2)))
        comm_score = max(20, 92 - (filler_word_count * 2))
        presence = min(95, max(50, int((eye_contact_score or 80) * 0.95)))

        rationale = (
            f"The candidate completed {count} interview questions ({total_words} total words). "
            f"Placement Readiness Assessment: {verdict}. "
            f"{'Demonstrated solid grasp of fundamentals with good potential for campus placement drives.' if avg_score >= 7.0 else 'Understands basic definitions but needs more practice explaining code and project details.' if avg_score >= 5.0 else 'Needs thorough revision of core concepts and communication before attending campus placement drives.'}"
        )

        return {
            "overall_score": int(avg_score * 10),
            "hiring_verdict": verdict,
            "hiring_decision_rationale": rationale,
            "technical_depth_score": tech_depth,
            "system_design_score": prob_solving,
            "communication_score": comm_score,
            "presence_score": presence,
            "confidence_score": min(95, max(60, int((eye_contact_score or 80) * 0.9))),
            "clarity_score": comm_score,
            "depth_score": tech_depth,
            "ai_summary": f"Completed {count} questions across the mock session with an average rating of {avg_score}/10.",
            "red_flags": [
                f"Recorded {filler_word_count} filler words during delivery",
                "Needs to explain code logic and project contribution with greater specificity"
            ],
            "top_strengths": [
                "Good attitude and conversational communication style",
                "Clear understanding of basic concepts and definitions"
            ],
            "key_improvements": [
                "Practice writing syntax and explaining code step-by-step",
                "Structure answers clearly with definitions and examples"
            ],
            "action_plan": [
                "Practice answering interview prompts using the 3-step format (Definition -> Code Example -> Best Practices)",
                "Review Core Java, Collections, and SQL queries (Joins, Aggregations)",
                "Do timed practice sessions to keep answers under 2 minutes and eliminate filler words"
            ],
            "recommended_topics": ["Core Java & OOPs", "SQL Queries & DBMS", "HR & Project Communication"]
        }
