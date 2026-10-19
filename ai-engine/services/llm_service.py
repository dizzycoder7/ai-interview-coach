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
        experience_level: str = "JUNIOR",
        conversational_turn: int = 0,
        interviewer_persona: str = "STRICT_CAMPUS",
        root_question: Optional[str] = None
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
                "dimension_scores": {
                    "structure": 10,
                    "specificity": 10,
                    "ownership": 10,
                    "technical_rigor": 10,
                    "delivery": 10
                },
                "probe_type": "PROBE_SILENCE",
                "active_listening_anchor": "Candidate provided virtually no verbal response.",
                "gaps_detected": ["Empty or one-word response", "No technical attempt made"],
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
                "dimension_scores": {
                    "structure": 25,
                    "specificity": 15,
                    "ownership": 25,
                    "technical_rigor": 20,
                    "delivery": 15
                },
                "probe_type": "PROBE_REPETITION",
                "active_listening_anchor": "Detected repetitive loops in introductory greeting phrases.",
                "gaps_detected": ["High phrase repetition with limited unique vocabulary", "Lack of concrete project specifics"],
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

        persona_directives = {
            "FAANG_BAR_RAISER": (
                "INTERVIEWER PERSONA: FAANG Bar Raiser Technical Lead.\n"
                "Tone: Rigorous, highly analytical, uncompromising on edge cases, scalability, concurrency, time/space complexity, and trade-offs.\n"
                "Probing Focus: Challenge superficial answers. If they state an approach, immediately test boundary conditions, memory pressure, or scale bottlenecks."
            ),
            "SUPPORTIVE_MENTOR": (
                "INTERVIEWER PERSONA: Senior Engineering Mentor & Placement Coach.\n"
                "Tone: Encouraging, constructive, empathetic. Guides the candidate through structured problem breakdown.\n"
                "Probing Focus: Provide progressive hints. If they missed a key component, ask a guiding question to nudge them toward the complete solution."
            ),
            "STRICT_CAMPUS": (
                "INTERVIEWER PERSONA: Senior Campus Placement Technical Panelist (TCS, Infosys, Wipro, Cognizant, Accenture).\n"
                "Tone: Direct, professional, firm. Zero tolerance for fluff or buzzwords without fundamental understanding.\n"
                "Probing Focus: Test Core Java, OOPs, Collections, DBMS & SQL queries, and demand individual code ownership of their final-year project."
            )
        }
        selected_directive = persona_directives.get(interviewer_persona, persona_directives["STRICT_CAMPUS"])

        turn_directives = {
            0: (
                "CONVERSATIONAL TURN: 0 (Root Question Answer Evaluation).\n"
                "Scan candidate response for 3 specific gap modes:\n"
                "1. MISSING_METRICS: Claimed performance or efficiency improvement without quantitative data (throughput, latency, %, users).\n"
                "2. DIFFUSED_OWNERSHIP: Used 'we' repeatedly without detailing what 'I' personally wrote or designed.\n"
                "3. SHALLOW_MECHANICS: Quoted high-level definitions without explaining internal memory, data structures, or code mechanics.\n"
                "Generate a targeted PROBE 1 (probe_type = 'PROBE_METRIC', 'PROBE_OWNERSHIP', or 'PROBE_MECHANICS').\n"
                "Include 'active_listening_anchor' echoing what the candidate specifically said before probing."
            ),
            1: (
                "CONVERSATIONAL TURN: 1 (First Probe Follow-Up Evaluation).\n"
                "The candidate responded to the initial probe. Now STRESS-TEST their answer:\n"
                "Ask about an edge case, failure mode, null/empty input, high concurrency, or alternative technology trade-off.\n"
                "Set probe_type = 'PROBE_EDGE_CASE'.\n"
                "Include 'active_listening_anchor' acknowledging their clarification before launching the stress test."
            ),
            2: (
                "CONVERSATIONAL TURN: 2 (Concluding Deep-Dive Thread).\n"
                "Candidate has completed 2 drill-down probes on this topic. Summarize their technical grasp and formulate an ADVANCING question transitioning to the next core placement competency.\n"
                "Set probe_type = 'ADVANCE_TOPIC'.\n"
                "Include 'active_listening_anchor' summarizing their performance on this thread."
            )
        }
        turn_directive = turn_directives.get(min(2, conversational_turn), turn_directives[0])

        system = f"""{selected_directive}

{turn_directive}

FINAL ROUND AI MULTI-DIMENSION SCORING RUBRIC (0 to 100 scale for each):
1. structure: Logical flow (STAR method: Situation -> Task -> Action -> Result).
2. specificity: Concrete metrics, named technologies, and quantifiable numbers.
3. ownership: Individual 'I' contribution vs diffused 'we' team hiding.
4. technical_rigor: Memory models, code accuracy, boundary conditions, and complexity.
5. delivery: Pace, word count adequacy (45-120 words), lack of repetition, no filler words.

Overall score: 1 to 10 scale (or average of dimension_scores / 10).

Return ONLY valid JSON matching this schema:
{{
  "score": 7,
  "dimension_scores": {{
    "structure": 75,
    "specificity": 70,
    "ownership": 80,
    "technical_rigor": 75,
    "delivery": 80
  }},
  "probe_type": "PROBE_METRIC",
  "active_listening_anchor": "You highlighted that your team built an automated assessment portal...",
  "gaps_detected": ["...", "..."],
  "feedback": "Constructive evaluation from the interviewer persona...",
  "follow_up_question": "Adaptive probing follow-up question...",
  "improved_answer": "💡 Everyday Analogy (ELI5):\n...\n\n🏆 Gold Standard Answer Script:\n...\n\n🔍 What Your Answer Was Missing:\n...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}}"""

        resume_snippet = f"\nCandidate Resume Highlights:\n{resume_text[:1500]}" if resume_text and len(resume_text.strip()) > 30 else ""

        prompt = f"""
Candidate Target Track: {interview_type}
Candidate Level: {level_upper}
Interviewer Persona: {interviewer_persona}
Conversational Turn in Current Topic: {conversational_turn}
Original Root Question: {root_question or question}
Current Question Asked: {question}
Candidate's Answer: {answer}
Previous History Turns Count: {len(history)}
{resume_snippet}

Analyze the candidate's answer according to Final Round AI dynamic probing logic and dimension-level scoring.
"""
        raw = await self._call_llm(prompt, system)
        if raw:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                try:
                    parsed = json.loads(match.group())
                    if "dimension_scores" in parsed and "follow_up_question" in parsed:
                        return parsed
                except Exception:
                    pass

        # Smart fallback if API is unreachable
        return self._fallback_evaluation(
            question=question,
            answer=answer,
            interview_type=interview_type,
            history=history,
            resume_text=resume_text,
            experience_level=level_upper,
            conversational_turn=conversational_turn,
            interviewer_persona=interviewer_persona,
            root_question=root_question
        )



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
        experience_level: str = "JUNIOR",
        conversational_turn: int = 0,
        interviewer_persona: str = "STRICT_CAMPUS",
        root_question: Optional[str] = None
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
                "dimension_scores": {
                    "structure": 25,
                    "specificity": 15,
                    "ownership": 25,
                    "technical_rigor": 20,
                    "delivery": 15
                },
                "probe_type": "PROBE_REPETITION",
                "active_listening_anchor": "Detected phrase repetition in introductory response.",
                "gaps_detected": ["Repetitive greeting loops", "No structured technical points"],
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
        has_nums = bool(re.search(r'\d+', answer))
        we_count = len(re.findall(r'\bwe\b', answer, re.IGNORECASE))
        i_count = len(re.findall(r'\b(i|my|me)\b', answer, re.IGNORECASE))

        # Dimension scores
        dim_structure = min(90, max(35, int(40 + (word_count * 0.4))))
        dim_specificity = min(90, max(30, 45 + (20 if has_nums else 0) + (15 if has_tech else 0)))
        dim_ownership = 80 if i_count >= 1 else (35 if we_count >= 2 else 55)
        dim_technical = min(90, max(30, 40 + (30 if has_tech else 0)))
        dim_delivery = min(95, max(35, int(45 + (word_count * 0.5))))

        avg_dim = int((dim_structure + dim_specificity + dim_ownership + dim_technical + dim_delivery) / 5)
        overall_score = max(1, min(10, int(avg_dim / 10)))

        gaps = []
        if not has_nums:
            gaps.append("Missing quantifiable metrics or data scale")
        if we_count >= 2 and i_count == 0:
            gaps.append("Diffused team ownership ('We' trap) without highlighting personal contributions")
        if not has_tech:
            gaps.append("Lacks specific technical concepts or framework terminology")

        # Dynamic multi-turn follow-up question determination
        junior_follow_ups = [
            "In Core Java, what is the crucial difference between an Interface and an Abstract Class, and when would you choose one over the other?",
            "In MySQL, could you explain the difference between an INNER JOIN and a LEFT JOIN, and how adding an index on a foreign key improves query speed?",
            "In Java collections, when would you choose an ArrayList over a LinkedList, and what are their lookup and insertion complexities?",
            "In your final-year project, how did you handle data validation and error handling for incoming user requests before storing data in the database?"
        ]
        q_idx = len(history) % len(junior_follow_ups)

        if conversational_turn == 0:
            if we_count >= 2 and i_count == 0:
                probe_type = "PROBE_OWNERSHIP"
                active_listening_anchor = "You described what the project team achieved..."
                follow_up_question = "In campus placement interviews, recruiters want to know YOUR exact personal role. What specific modules, database schemas, or REST endpoints did YOU personally code and test?"
            elif not has_nums and word_count >= 25:
                probe_type = "PROBE_METRIC"
                active_listening_anchor = "You walked through the high-level functional flow..."
                follow_up_question = "What were the quantifiable metrics of this implementation (for example, latency reduction, throughput, user volume, or test coverage)?"
            else:
                probe_type = "PROBE_MECHANICS"
                active_listening_anchor = "You mentioned the foundational technologies involved..."
                follow_up_question = "Could you explain the internal mechanics: How does this work under the hood in memory, and what happens when an error or exception occurs?"
        elif conversational_turn == 1:
            probe_type = "PROBE_EDGE_CASE"
            active_listening_anchor = "Understood on the core technical approach..."
            follow_up_question = "Now consider edge cases and scale: What happens if input data is null or malformed, or if concurrent requests surge tenfold? How does your design remain resilient?"
        else:
            probe_type = "ADVANCE_TOPIC"
            active_listening_anchor = "Solid technical walkthrough on this topic."
            follow_up_question = junior_follow_ups[q_idx]

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
            )

        feedback_text = (
            f"Evaluated by {interviewer_persona.replace('_', ' ').title()}. Score: {overall_score}/10 (Structure: {dim_structure}%, Specificity: {dim_specificity}%, Ownership: {dim_ownership}%, Technical: {dim_technical}%). "
            f"{'Demonstrated good conceptual clarity.' if overall_score >= 6 else 'Needs to incorporate more concrete project examples and individual ownership.'}"
        )

        return {
            "score": overall_score,
            "dimension_scores": {
                "structure": dim_structure,
                "specificity": dim_specificity,
                "ownership": dim_ownership,
                "technical_rigor": dim_technical,
                "delivery": dim_delivery
            },
            "probe_type": probe_type,
            "active_listening_anchor": active_listening_anchor,
            "gaps_detected": gaps,
            "feedback": feedback_text,
            "follow_up_question": follow_up_question,
            "improved_answer": improved_answer,
            "strengths": ["Clear conversational voice", "Attempted the technical prompt"],
            "improvements": ["Highlight individual 'I' code ownership", "Include concrete numbers, metrics, or edge cases"]
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

    async def generate_warmup_round(
        self,
        track: str = "SOFTWARE_ENGINEERING",
        job_description: Optional[str] = None,
        candidate_name: Optional[str] = "Candidate"
    ) -> list:
        """
        Generate a Google Interview Warmup 5-question round:
        - 1 BACKGROUND question
        - 2 SITUATIONAL questions (STAR method)
        - 2 TECHNICAL questions
        """
        system = """You are Google's Interview Warmup Question Generator.
Generate exactly 5 interview practice questions for the specified career track following Google's exact pedagogical distribution:
- Question 1: BACKGROUND (focus on personal background, education, and career motivation)
- Question 2: SITUATIONAL (behavioral scenario, resolving challenges, teamwork, or pressure - prompts STAR format)
- Question 3: SITUATIONAL (different behavioral scenario: conflict, changing priorities, or learning from mistakes)
- Question 4: TECHNICAL (core domain concept, methodology, or system architecture)
- Question 5: TECHNICAL (practical problem-solving, tools, trade-offs, or troubleshooting)

For each question, return:
- 'id': unique string id (e.g. 'warmup_bg_1', 'warmup_sit_1')
- 'category': 'BACKGROUND' | 'SITUATIONAL' | 'TECHNICAL'
- 'question': the concise, clear interview question prompt
- 'tips': a 1-sentence guidance tip helping the candidate structure their answer
- 'jobRelatedTerms': a list of 6-8 industry-specific keywords relevant to a great answer
- 'talkingPoints': a list of 3 structured points a candidate should touch upon

Return ONLY a valid JSON array of 5 objects matching the schema."""

        prompt = f"""
Track: {track}
Candidate Name: {candidate_name}
Target Role Context / Job Description: {job_description or "Standard industry interview standards"}

Return the 5-question warmup set formatted as a JSON array."""

        raw = await self._call_llm(prompt, system)
        if raw:
            match = re.search(r'\[.*\]', raw, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group())
                    if isinstance(data, list) and len(data) >= 5:
                        return data[:5]
                except Exception:
                    pass

        # Fallback will return empty list so the frontend curated bank is used seamlessly
        return []

    async def analyze_warmup_answer(
        self,
        question: str,
        answer_text: str,
        category: str = "TECHNICAL",
        track: str = "SOFTWARE_ENGINEERING",
        target_terms: Optional[list] = None,
        talking_points: Optional[list] = None
    ) -> dict:
        """
        Google Interview Warmup non-judgmental ML pattern recognition:
        - Job-related terms detected in answer + contextual suggested terms
        - Most-used words frequency
        - Talking points covered checklist
        - Encouraging coaching tip
        """
        system = """You are Google's Interview Warmup AI Coach.
Analyze the candidate's answer text using non-judgmental pattern recognition. Do NOT give a harsh or punitive score.
Extract:
1. 'detectedTerms': list of industry keywords and domain terms the candidate actually used in their answer.
2. 'suggestedTerms': list of 4-6 relevant industry terms they could have mentioned to enhance their answer.
3. 'talkingPoints': array of objects { 'point': str, 'covered': bool, 'feedback': str } checking whether they covered the 3 structural talking points.
4. 'coachingTip': a constructive, encouraging tip on how to elevate their delivery next time.

Return ONLY valid JSON matching this schema:
{
  "detectedTerms": ["...", "..."],
  "suggestedTerms": ["...", "..."],
  "talkingPoints": [
    {"point": "...", "covered": true, "feedback": "..."},
    {"point": "...", "covered": false, "feedback": "..."}
  ],
  "coachingTip": "..."
}"""

        prompt = f"""
Question: {question}
Question Category: {category}
Track: {track}
Target Talking Points: {json.dumps(talking_points or [])}
Known Domain Terms: {json.dumps(target_terms or [])}
Candidate's Answer: {answer_text}

Analyze the answer text and return the JSON insights."""

        raw = await self._call_llm(prompt, system)
        if raw:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group())
                except Exception:
                    pass

        return {}

