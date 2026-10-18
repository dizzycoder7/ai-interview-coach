import os
import json
import re
import asyncio
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

        if level_upper == "JUNIOR":
            system = """You are an encouraging, highly professional Technical Interviewer conducting an interview for a Junior / Fresher / Entry-Level Software Engineer (0-2 years experience).
Your mission is to ask an opening question focused on CORE FUNDAMENTALS and the candidate's actual resume projects.

LEVEL SPECIFICATIONS FOR JUNIOR / FRESHER:
- CORE TOPICS: Core Java, OOPs concepts (Encapsulation, Inheritance, Polymorphism, Abstraction), Collections Framework (ArrayList vs LinkedList, HashMap internals), Spring Boot fundamentals (Annotations, Dependency Injection, Controller/Service/Repository layers), and Relational Databases / MySQL (Joins, Keys, Indexing, Normalization).
- RESUME PROJECTS GROUNDING: If candidate resume text or project highlights are provided, inspect their projects and ask a question specifically about what THEY built (e.g. "I see you built a [Project Name] with Spring Boot and MySQL. How did you design your database schema, and how did you implement the REST endpoints?").
- STRICT PROHIBITION: DO NOT ask senior system design, microservice partitioning, CAP theorem, distributed consensus, or 100k RPS rate limiters. Keep questions focused on code logic, fundamentals, and their resume projects.
- Include a helpful hint/tip in 'tips' to guide the candidate on how to structure their response.

Return ONLY valid JSON matching this schema:
{
  "question": "...",
  "tips": "..."
}"""
        elif level_upper == "MID":
            system = """You are a Senior Engineering Interviewer evaluating a Mid-Level Software Engineer (2-5 years experience).
Focus on practical engineering design, REST API best practices, concurrency, ORM/Hibernate optimizations, indexing strategies, unit testing, and design patterns.
If a resume is provided, probe their architectural decisions and feature implementations from their past projects.
Return ONLY valid JSON matching this schema:
{
  "question": "...",
  "tips": "..."
}"""
        else:
            system = """You are a Principal Staff Engineer evaluating a Senior / Lead Engineer (5+ years experience).
Focus on distributed systems, high-availability architecture, failure modes, scalability trade-offs, and strategic engineering decisions.
If a resume is provided, probe system architecture and scale metrics from their past work.
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

        if level_upper == "JUNIOR":
            system = """You are a constructive, highly skilled Technical Interviewer evaluating a Junior / Fresher / Entry-Level Software Engineer (0-2 years experience).
Evaluate the candidate's answer fairly based on foundational understanding, clarity, and practical code/logic examples.

SCORING GUIDELINES (1 to 10):
- 1-4: Fundamental misconceptions, incorrect syntax/logic, or unable to explain basic principles.
- 5-6: Knows standard textbook definition, but lacks practical examples or struggles to explain how it works in code.
- 7-8: Good conceptual clarity, gave solid examples (Java classes, OOP concepts, Spring annotations, SQL queries), understands why and how it works.
- 9-10: Exceptional clarity, proactively explains edge cases (e.g. null checks, boundary conditions), best practices, and clean code principles.

ADAPTIVE FOLLOW-UP RULES FOR JUNIOR:
- Deeply analyze what the candidate actually said in their answer.
- Ask a follow-up that tests deeper comprehension of the fundamental concept or connects directly to their resume projects.
  * Examples: "How does HashMap handle collisions when two keys have the same hashcode?", "What is the difference between @Autowired and Constructor Injection in Spring Boot?", "Can you explain how an INNER JOIN differs from a LEFT JOIN with a query example?", "In your resume project, how did you handle data validation before saving into MySQL?"
- STRICT PROHIBITION: DO NOT ask about distributed consensus, network partitions, split-brain, CAP theorem, or high-scale system design. Keep it focused on core code, OOP, Spring Boot, MySQL, and their resume projects.

MASTER MODEL ANSWER RULES ('improved_answer'):
Deliver an exemplary 3-part masterclass explanation designed for clarity:
Part 1: 💡 Everyday Analogy (ELI5): A crystal-clear real-world metaphor that anyone can understand in 10 seconds.
Part 2: 🏆 10/10 Gold Standard Interview Script: The exact, structured answer an exemplary developer gives (crisp definition -> code structure/internal mechanics -> edge cases & best practices).
Part 3: 🔍 What Your Answer Was Missing: Direct, honest bullet points highlighting what the candidate omitted, assumed, or stated incorrectly.

Return ONLY valid JSON matching this schema:
{
  "score": 7,
  "feedback": "Constructive evaluation citing specific strengths and gaps...",
  "follow_up_question": "Follow-up question testing deeper understanding of the fundamental topic or resume project...",
  "improved_answer": "💡 Everyday Analogy (ELI5):\n...\n\n🏆 The 10/10 Gold Standard Interview Script:\n...\n\n🔍 What Your Answer Was Missing:\n...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}"""
        else:
            system = f"""You are a rigorous Engineering Interviewer evaluating a {level_upper} Software Engineer.
Score strictly from 1 to 10 based on production engineering hiring bars.
Probe their design decisions, trade-offs, scalability, and edge cases.
Return ONLY valid JSON matching this schema:
{{
  "score": 7,
  "feedback": "Honest evaluation...",
  "follow_up_question": "Challenging follow-up...",
  "improved_answer": "💡 Everyday Analogy (ELI5):\n...\n\n🏆 The 10/10 Gold Standard Interview Script:\n...\n\n🔍 What Your Answer Was Missing:\n...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}}"""

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
            print(f"Enforcing strict NO HIRE: total_words={total_words}, qa_pairs_count={len(qa_pairs)}")
            return {
                "overall_score": 15,
                "hiring_verdict": "NO HIRE",
                "hiring_decision_rationale": (
                    f"NO HIRE (Definitive Committee Consensus). The candidate spoke virtually nothing substantive "
                    f"(recording only {total_words} words total across the entire session) or terminated prematurely. "
                    "In a live technical or behavioral interview, staying silent, skipping questions, or providing empty responses "
                    "results in an immediate failing verdict. There is zero demonstrated evidence of engineering or architectural competency."
                ),
                "technical_depth_score": 10,
                "system_design_score": 10,
                "communication_score": 15,
                "presence_score": min(60, int((eye_contact_score or 50) * 0.7)),
                "confidence_score": 15,
                "clarity_score": 15,
                "depth_score": 10,
                "ai_summary": f"Session concluded with non-substantive answers ({total_words} words recorded). Failed hiring bar.",
                "red_flags": [
                    f"Provided virtually no technical explanation ({total_words} words spoken in total)",
                    "Failed to address the core problem constraints or architecture",
                    "Session ended without demonstrating engineering problem-solving ability"
                ],
                "top_strengths": ["Started the mock interview session"],
                "key_improvements": [
                    "Must actively speak and deliver complete technical solutions",
                    "Do not end or skip questions without stating your thought process aloud",
                    "Study standard data structures, algorithmic complexity, and system design"
                ],
                "action_plan": [
                    "Practice speaking aloud for at least 2 minutes per technical question",
                    "Use the STAR method (Situation, Task, Action, Result) for behavioral questions",
                    "Review core computer science fundamentals and trade-offs"
                ],
                "recommended_topics": ["CS Fundamentals", "Interview Communication", "System Design Basics"]
            }

        system = """You are the Lead of a Silicon Valley Hiring Committee (Google/Meta/Stripe caliber).
        Synthesize the candidate's entire interview into a brutally honest, high-signal debrief.

        Determine the definitive HIRING VERDICT:
        - "STRONG HIRE" (Average QA score >= 8.5, rigorous depth, clear presence)
        - "HIRE" (Average QA score 7.0 - 8.4, solid fundamentals, minor gaps)
        - "LEAN HIRE" (Average QA score 5.5 - 6.9, passable but lacks architectural depth)
        - "NO HIRE" (Average QA score < 5.5, superficial answers, or critical misunderstandings)

        CRITICAL HIRING BAR RULES:
        1. If the candidate answers are brief, generic, or lack technical rigor, the verdict MUST BE "NO HIRE" or "LEAN HIRE".
        2. NEVER return 'HIRE' or 'STRONG HIRE' for an incomplete or low-effort interview.

        Return ONLY valid JSON matching this schema:
        {
          "overall_score": 78,
          "hiring_verdict": "HIRE",
          "hiring_decision_rationale": "Candid 2-3 paragraph hiring committee debrief explaining the verdict...",
          "technical_depth_score": 76,
          "system_design_score": 72,
          "communication_score": 82,
          "presence_score": 80,
          "confidence_score": 78,
          "clarity_score": 82,
          "depth_score": 75,
          "ai_summary": "Executive summary...",
          "red_flags": [
            "Hand-waved cache invalidation strategy",
            "Relied on filler words under technical pressure"
          ],
          "top_strengths": ["Structured problem breakdown", "Strong grasp of relational schemas"],
          "key_improvements": ["Must proactively state time and space complexity", "Deepen understanding of distributed consensus"],
          "action_plan": [
            "Study CAP theorem and practical quorum configurations",
            "Practice mock answers under 2-minute time constraints to prevent rambling",
            "Review concurrent data structures (ConcurrentHashMap, atomic primitives)"
          ],
          "recommended_topics": ["System Design", "Distributed Transactions", "Concurrency Primitives"]
        }"""

        qa_summary = "\n".join([f"Q: {qa.get('question','')[:120]} | A: {qa.get('answer_text','')[:160]}" for qa in qa_pairs[:8]])
        prompt = f"""
        Interview Transcripts:
        {qa_summary}
        Candidate Stats: Total Words Spoken: {total_words}, Eye contact: {eye_contact_score or 80}%, Total Fillers: {filler_word_count}

        Generate the complete hiring committee debrief JSON.
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

        if level_upper == "JUNIOR":
            questions = {
                "TECHNICAL": {
                    "question": f"Welcome {candidate_name}! Let's start with foundational Object-Oriented Programming (OOP) and Core Java: Could you explain the 4 pillars of OOP (Encapsulation, Inheritance, Polymorphism, Abstraction) and give a practical code example of Method Overloading vs Method Overriding?",
                    "tips": "Provide clear real-world examples (like a Vehicle or Payment hierarchy). Mention compile-time vs runtime polymorphism."
                },
                "BEHAVIORAL": {
                    "question": f"Hi {candidate_name}! Walk me through a key software project mentioned in your resume or college portfolio. What was the goal of the project, what technologies did you choose, and what was the most challenging technical bug you encountered and resolved?",
                    "tips": "Use the STAR method (Situation, Task, Action, Result). Highlight your personal contribution and debugging thought process."
                },
                "CODING": {
                    "question": f"Hello {candidate_name}! In Java and Data Structures, could you explain how a HashMap works internally under the hood? Specifically, how do hashcode, buckets, equals(), and collision resolution work during put() and get()?",
                    "tips": "Walk through step-by-step what happens when adding a key-value pair, collision handling (chaining), and average vs worst-case time complexity."
                },
                "MIXED": {
                    "question": f"Welcome {candidate_name}! In backend web development using Spring Boot and MySQL, could you explain the 3-tier architecture (@RestController, @Service, @Repository), and how Dependency Injection (@Autowired) works?",
                    "tips": "Describe the flow of a client HTTP request through the controller down to the database, and explain why separation of concerns matters."
                }
            }
            return questions.get(interview_type.upper(), questions["TECHNICAL"])

        # Mid and Senior fallbacks
        questions = {
            "TECHNICAL": {
                "question": f"Welcome {candidate_name}! Let's dive straight into a practical engineering scenario: Imagine your team's API endpoint is experiencing intermittent 504 Gateway Timeouts under a sudden 5x traffic spike. Walk me through your diagnostic process from the load balancer down to the database connection pool, and how you prevent cascading failures.",
                "tips": "Structure your answer from edge to data tier: check metrics/logs, isolate thread contention vs DB connection pool exhaustion, and suggest circuit breakers."
            },
            "BEHAVIORAL": {
                "question": f"Hi {candidate_name}. Tell me about a time when you and a senior engineer or tech lead had a fundamental disagreement about a critical architectural choice or code design. How did you navigate the conflict, what data did you present, and what was the eventual outcome?",
                "tips": "Use the STAR framework (Situation, Task, Action, Result). Focus on disagree-and-commit, data-driven reasoning, and business impact."
            },
            "CODING": {
                "question": f"Hello {candidate_name}! Today's engineering challenge: Design an in-memory Rate Limiter that can handle 100,000 requests per second across concurrent worker threads. What algorithmic approach would you select (Token Bucket, Leaky Bucket, or Sliding Window Log), and how do you ensure thread-safety without creating global lock contention?",
                "tips": "Compare Token Bucket vs Sliding Window Counter. Discuss concurrency controls like AtomicInteger or striped locks."
            },
            "MIXED": {
                "question": f"Welcome {candidate_name}! Walk me through the most technically complex microservice or distributed feature you have engineered. What were the hardest edge cases you encountered regarding latency, data consistency, or failure recovery, and what trade-offs would you make differently today?",
                "tips": "Emphasize your personal contribution, quantify the scale (RPS, database size), and discuss trade-offs honestly."
            }
        }
        return questions.get(interview_type.upper(), questions["TECHNICAL"])

    def _fallback_evaluation(
        self,
        question: str,
        answer: str,
        interview_type: str,
        history: list,
        resume_text: Optional[str] = None,
        experience_level: str = "JUNIOR"
    ) -> dict:
        word_count = len(answer.split())
        score = min(9, max(4, int(4 + (word_count / 18))))
        level_upper = (experience_level or "JUNIOR").upper()
        if level_upper in ["FRESHER", "BEGINNER"]:
            level_upper = "JUNIOR"

        if level_upper == "JUNIOR":
            junior_follow_ups = [
                "That's a good foundation. In Core Java, what is the crucial difference between an Interface and an Abstract Class, and when would you choose one over the other?",
                "In MySQL, could you explain the difference between an INNER JOIN and a LEFT JOIN, and how adding an index on a foreign key improves performance?",
                "In Spring Boot, how does Dependency Injection benefit unit testing and code decoupling compared to creating object instances manually with the 'new' keyword?",
                "In your resume projects, how did you handle data validation and error handling for incoming client requests before persisting data to the database?"
            ]
            q_idx = len(history) % len(junior_follow_ups)

            improved_answer = (
                f"💡 Everyday Analogy (Explain Like I'm 5):\n"
                f"Think of this concept like an everyday organized system (e.g. a restaurant menu or a library index). "
                f"Instead of handling every order or book randomly, standard rules and organized categories make it fast, predictable, and error-free.\n\n"
                f"🏆 The 10/10 Gold Standard Interview Script:\n"
                f"1. Crisp Definition: Clearly define the core principle in 1-2 concise sentences.\n"
                f"2. How It Works in Code: Explain the exact mechanism (e.g., classes/interfaces, memory layout, or database query structure) with a concise example.\n"
                f"3. Best Practices & Edge Cases: Explain common pitfalls (such as NullPointerExceptions, index misses, or memory leaks) and how to prevent them.\n\n"
                f"🔍 What Your Answer Was Missing:\n"
                f"• Provide a concrete code or design example to demonstrate practical understanding.\n"
                f"• Highlight potential edge cases (like null checks or empty collections).\n"
                f"• Mention why this pattern is preferred over alternatives."
            )

            return {
                "score": score,
                "feedback": f"Good effort explaining the concept ({word_count} words). To elevate your answer, include concrete Java/Spring code examples and state edge cases proactively.",
                "follow_up_question": junior_follow_ups[q_idx],
                "improved_answer": improved_answer,
                "strengths": ["Clear communication", "Demonstrated foundational awareness"],
                "improvements": ["Give concrete code syntax examples", "Address boundary cases and null handling"]
            }

        # Senior/Mid fallbacks
        follow_ups = [
            "You laid out the primary mechanism, but what happens during a network partition between your service instances and the storage layer? How do you prevent split-brain anomalies?",
            "What is the exact time and space complexity of this approach, and how does your memory overhead behave when traffic scales by a factor of 10x?",
            "If this component crashes unexpectedly in production mid-execution, how do you recover state and guarantee at-least-once message processing without duplicating records?",
            "What specific observability metrics, alerts, and SLOs would you set up in Datadog or Prometheus to detect degradation before users notice?"
        ]
        q_idx = len(history) % len(follow_ups)

        improved_answer = (
            f"💡 Everyday Analogy (Explain Like I'm 5):\n"
            f"Think of this problem like an airport security checkpoint. If every passenger is inspected with an exhaustive full search in a single line, "
            f"the entire terminal grinds to a halt. Instead, the airport uses multiple specialized lanes: TSA PreCheck for fast verification (caching/fast-path), "
            f"conveyor belts with automatic sorting (queuing), and a dedicated secondary screening area so problematic bags don't block the main flow.\n\n"
            f"🏆 The 10/10 Gold Standard Interview Script:\n"
            f"1. Crisp Definition: 'The core challenge here is isolating throughput bottlenecks while maintaining strict consistency guarantees.'\n"
            f"2. Architecture & Complexity: 'I would implement this using an asynchronous event-driven pattern with an in-memory sliding window counter. This gives us O(1) time complexity per check and predictable O(K) memory overhead.'\n"
            f"3. Trade-offs & Production Edge: 'The trade-off is eventual consistency over immediate synchronization. To mitigate node failures, I'd back this with Redis Sentinel and configure client-side circuit breakers to fail open or gracefully degrade if the cluster experiences partition.'\n\n"
            f"🔍 What Your Answer Was Missing:\n"
            f"• Lacked explicit mention of time and space complexity ($O(1)$ vs $O(N)$).\n"
            f"• Did not state the failure mode or fallback strategy if the primary dependency experiences downtime.\n"
            f"• Could be elevated by discussing proactive metrics and alert thresholds."
        )

        return {
            "score": score,
            "feedback": f"Your response addressed the general direction ({word_count} words), but relied on high-level assertions without explicitly walking through memory implications or failure modes. In top-tier interviews, specificity beats generalizations.",
            "follow_up_question": follow_ups[q_idx],
            "improved_answer": improved_answer,
            "strengths": ["Identified core problem components", "Clear, conversational communication style"],
            "improvements": ["State time and space complexity proactively", "Detail failure modes and boundary edge cases"]
        }


    def _fallback_scorecard(self, qa_pairs: list, eye_contact_score: Optional[float], filler_word_count: int) -> dict:
        total_words = sum([len(qa.get('answer_text', '').split()) for qa in qa_pairs])
        count = len(qa_pairs)

        if count == 0 or total_words < 12:
            return {
                "overall_score": 15,
                "hiring_verdict": "NO HIRE",
                "hiring_decision_rationale": (
                    f"NO HIRE (Definitive Committee Consensus). The candidate spoke virtually nothing substantive "
                    f"({total_words} words recorded) or terminated the interview prematurely. In a live engineering interview, "
                    "skipping questions or staying silent results in an immediate failing evaluation. There is zero evidence of technical competency."
                ),
                "technical_depth_score": 10,
                "system_design_score": 10,
                "communication_score": 15,
                "presence_score": min(60, int((eye_contact_score or 50) * 0.7)),
                "confidence_score": 15,
                "clarity_score": 15,
                "depth_score": 10,
                "ai_summary": f"Session concluded with non-substantive answers ({total_words} words). Failed hiring bar.",
                "red_flags": [
                    f"Candidate spoke fewer than 12 words across the session ({total_words} words)",
                    "Failed to provide any architectural or complexity explanation"
                ],
                "top_strengths": ["Attended mock session"],
                "key_improvements": [
                    "Must deliver full technical explanations aloud",
                    "Do not skip questions or terminate early without answering"
                ],
                "action_plan": [
                    "Practice answering technical interview questions aloud with a timer",
                    "Review data structures and system design fundamentals"
                ],
                "recommended_topics": ["CS Fundamentals", "Interview Communication"]
            }

        total_score = sum([qa.get("ai_score", 1) for qa in qa_pairs])
        avg_score = round(total_score / count, 1)

        if avg_score >= 8.5:
            verdict = "STRONG HIRE"
        elif avg_score >= 7.0:
            verdict = "HIRE"
        elif avg_score >= 5.5:
            verdict = "LEAN HIRE"
        else:
            verdict = "NO HIRE"

        tech_depth = min(95, max(15, int(avg_score * 10 + 2)))
        system_design = min(95, max(15, int(avg_score * 10 - 3)))
        comm_score = max(20, 92 - (filler_word_count * 2))
        presence = min(95, max(50, int((eye_contact_score or 80) * 0.95)))

        rationale = (
            f"The candidate completed {count} technical evaluation rounds ({total_words} total words). "
            f"Hiring Committee Recommendation: {verdict}. "
            f"{'Demonstrated good problem-solving foundation with areas for architectural depth improvement.' if avg_score >= 7.0 else 'Lacked the requisite technical depth and precision required for senior engineering ownership.'}"
        )

        return {
            "overall_score": int(avg_score * 10),
            "hiring_verdict": verdict,
            "hiring_decision_rationale": rationale,
            "technical_depth_score": tech_depth,
            "system_design_score": system_design,
            "communication_score": comm_score,
            "presence_score": presence,
            "confidence_score": min(95, max(60, int((eye_contact_score or 80) * 0.9))),
            "clarity_score": comm_score,
            "depth_score": tech_depth,
            "ai_summary": f"Completed {count} questions across the mock session with an average rating of {avg_score}/10.",
            "red_flags": [
                f"Recorded {filler_word_count} filler words during delivery, impacting technical authority",
                "Did not proactively address edge-case failures or concurrency race conditions"
            ],
            "top_strengths": [
                "Methodical communication with clear sequential reasoning",
                "Good grasp of system-level paradigms and core concepts"
            ],
            "key_improvements": [
                "Quantify scale and time/space complexity without being prompted",
                "Elaborate on production fault tolerance, circuit breakers, and backpressure"
            ],
            "action_plan": [
                "Practice answering technical prompts using the 3-step format (Thesis -> Mechanics -> Trade-offs)",
                "Review distributed systems concepts: CAP theorem, distributed locks, and idempotency keys",
                "Do timed practice sessions to keep answers under 2 minutes and eliminate filler words"
            ],
            "recommended_topics": ["System Scalability", "Concurrency & Locking", "Fault Tolerance Patterns"]
        }
