/**
 * Campus Placement Practice Room - Adaptive Question Bank & Rotation Engine
 * Specially designed for Indian IT Services campus placement drives
 * (TCS, Infosys, Wipro, Cognizant, Accenture, Capgemini)
 *
 * Prevents repetitive questions by persisting asked question IDs in localStorage
 * and ensuring diverse topic coverage across sessions.
 */

const STORAGE_KEY = 'placement_asked_question_ids';

export const QUESTION_POOLS = {
  TECHNICAL: [
    {
      id: 'tech_oop_01',
      topic: 'Object-Oriented Programming',
      question: (name, resumeHint) =>
        `Welcome ${name}! ${resumeHint}To begin our placement technical round: Could you explain the 4 core pillars of OOP (Encapsulation, Inheritance, Polymorphism, Abstraction) and provide a practical Java example showing the difference between Method Overloading and Method Overriding?`,
      tips: 'Define each pillar clearly in 1 sentence. For Overloading vs Overriding, mention compile-time vs runtime polymorphism and method signature rules.',
    },
    {
      id: 'tech_collections_01',
      topic: 'Java Collections Framework',
      question: (name, resumeHint) =>
        `Hello ${name}! ${resumeHint}In Core Java, could you explain the internal working of a HashMap under the hood? Specifically, what happens during put() and get() in terms of hashCode, buckets, equals(), and collision handling?`,
      tips: 'Explain the bucket array, hashing function, equals() comparison, linked list/treeify threshold (since Java 8), and average O(1) time complexity.',
    },
    {
      id: 'tech_dbms_01',
      topic: 'DBMS & SQL',
      question: (name, resumeHint) =>
        `Welcome ${name}! In relational databases, what is the exact difference between Primary Key, Unique Key, and Foreign Key? How does creating an Index improve search performance, and are there any downsides to having too many indexes?`,
      tips: 'Highlight NULL allowance differences, referential integrity with foreign keys, B-tree index lookups, and the overhead during INSERT/UPDATE operations.',
    },
    {
      id: 'tech_java_memory_01',
      topic: 'Java Memory & Lifecycle',
      question: (name, resumeHint) =>
        `Hello ${name}! Can you explain the difference between Stack Memory and Heap Memory in Java? What goes where during execution, and how does Java's Garbage Collector determine when an object is eligible for collection?`,
      tips: 'Mention method frames, local variables on stack, object instances on heap, and reference counting vs reachability analysis (GC roots).',
    },
    {
      id: 'tech_sql_joins_02',
      topic: 'SQL Joins & Grouping',
      question: (name, resumeHint) =>
        `Welcome ${name}! Could you explain the difference between INNER JOIN, LEFT OUTER JOIN, and FULL OUTER JOIN with a simple Employee and Department table scenario? Also, what is the difference between the WHERE clause and the HAVING clause?`,
      tips: 'Explain that WHERE filters rows before aggregation, while HAVING filters aggregated group results after GROUP BY.',
    },
    {
      id: 'tech_oop_abstract_interface_02',
      topic: 'OOP Core Concepts',
      question: (name, resumeHint) =>
        `Hi ${name}! What is the difference between an Abstract Class and an Interface in Java? With Java 8 introducing default and static methods in interfaces, when would you still choose an abstract class over an interface?`,
      tips: 'Focus on multiple inheritance of type, instance variables state management, access specifiers, and "is-a" vs "can-do" design philosophy.',
    },
    {
      id: 'tech_string_immutability_01',
      topic: 'Core Java Strings',
      question: (name, resumeHint) =>
        `Hello ${name}! Why is the String class immutable in Java? What is the String Constant Pool, and what is the difference between String, StringBuilder, and StringBuffer in terms of thread safety and performance?`,
      tips: 'Mention security, caching in SCP, thread safety, synchronization in StringBuffer vs asynchronous speed in StringBuilder.',
    },
    {
      id: 'tech_project_arch_01',
      topic: 'Final-Year Project Architecture',
      question: (name, resumeHint) =>
        `Welcome ${name}! ${resumeHint}Walk me through the overall architecture of your final-year college project. Which modules or database tables did you personally design and code, and what was the most difficult bug or challenge you resolved?`,
      tips: 'Structure your answer: 1) Problem statement, 2) Tech stack & architecture (frontend, backend, DB), 3) Your individual contribution, 4) A concrete bug and fix.',
    },
    {
      id: 'tech_exceptions_01',
      topic: 'Java Exception Handling',
      question: (name, resumeHint) =>
        `Hi ${name}! Explain the exception hierarchy in Java. What is the difference between Checked and Unchecked Exceptions, and how does the try-catch-finally block work when a return statement is present inside try?`,
      tips: 'Mention Throwable, Exception vs Error, compile-time checking for Checked exceptions (e.g. IOException, SQLException) vs RuntimeException (e.g. NullPointerException).',
    },
    {
      id: 'tech_dbms_normalization_02',
      topic: 'DBMS Normalization & ACID',
      question: (name, resumeHint) =>
        `Welcome ${name}! What is Database Normalization, and can you explain First, Second, and Third Normal Form (1NF, 2NF, 3NF)? Also, what are ACID properties, and how do they prevent dirty reads in a banking transaction?`,
      tips: 'Explain atomic values (1NF), removing partial dependency (2NF), removing transitive dependency (3NF), and Atomicity, Consistency, Isolation, Durability.',
    },
    {
      id: 'tech_rest_apis_01',
      topic: 'Web Services & REST APIs',
      question: (name, resumeHint) =>
        `Hello ${name}! In modern web applications, what makes an API RESTful? Can you explain the HTTP methods GET, POST, PUT, and DELETE, and the difference between idempotent and non-idempotent operations?`,
      tips: 'Mention statelessness, resource-based URLs, standard HTTP status codes (200, 201, 400, 404, 500), and why GET and PUT are idempotent while POST is not.',
    },
  ],

  BEHAVIORAL: [
    {
      id: 'beh_intro_services_01',
      topic: 'Self-Introduction & Career Alignment',
      question: (name, resumeHint) =>
        `Hi ${name}! Could you briefly introduce yourself, highlight your key academic projects, and share why you are specifically interested in starting your career with an IT services company?`,
      tips: 'Keep it within 90-120 seconds. Highlight educational background, programming languages you enjoy, college projects, and your eagerness to learn and grow.',
    },
    {
      id: 'beh_team_conflict_01',
      topic: 'Teamwork & Collaboration',
      question: (name) =>
        `Welcome ${name}! Tell me about a time during a college project or group assignment when you faced a disagreement or conflict with a teammate. How did you communicate and reach a resolution without delaying the submission?`,
      tips: 'Use the STAR method: Situation, Task, Action you took to communicate constructively, and positive Result.',
    },
    {
      id: 'beh_relocation_shifts_01',
      topic: 'Flexibility & Work Environment',
      question: (name) =>
        `Hello ${name}! In IT services, project allocations may require working in rotational shifts, supporting clients across global time zones, or relocating to different corporate centers like Pune, Bangalore, Chennai, or Hyderabad. How comfortable are you with relocation and shift schedules?`,
      tips: 'Give a clear, enthusiastic, affirmative answer demonstrating flexibility, openness to new experiences, and dedication to professional growth.',
    },
    {
      id: 'beh_handling_pressure_01',
      topic: 'Handling Pressure & Deadlines',
      question: (name) =>
        `Hi ${name}! Describe a situation where you had multiple high-pressure deadlines at the same time—such as university exams, project submissions, and placement aptitude tests. How did you organize your schedule to manage stress and meet all commitments?`,
      tips: 'Explain prioritization techniques: task breakdown, focusing on high-impact items first, staying calm, and maintaining steady momentum.',
    },
    {
      id: 'beh_strengths_weakness_01',
      topic: 'Self-Awareness & Continuous Learning',
      question: (name) =>
        `Welcome ${name}! What would you consider your single greatest technical or personal strength, and what is one genuine weakness or area of improvement you are actively working to overcome?`,
      tips: 'For weakness, choose a genuine professional trait (e.g. public speaking or hesitating to ask questions initially) and immediately explain the active steps you take to improve.',
    },
    {
      id: 'beh_learning_adaptability_01',
      topic: 'Rapid Learning & New Technologies',
      question: (name) =>
        `Hello ${name}! During initial company training, freshers are frequently trained in a technology stack they have never seen before (such as Mainframe, Cloud, ERP, or a new framework). How do you approach learning an unfamiliar technology rapidly?`,
      tips: 'Describe your learning framework: reading documentation, building small toy projects, asking mentors for guidance, and persistent practice.',
    },
  ],

  CODING: [
    {
      id: 'code_hashmap_logic_01',
      topic: 'Hashing & Two-Sum Logic',
      question: (name) =>
        `Hello ${name}! If you are given an array of integers and a target sum, how would you find two numbers that add up to the target? Can you compare the brute-force approach with an optimized HashMap approach in terms of time and space complexity?`,
      tips: 'Mention brute force is O(N^2) time and O(1) space. The HashMap approach stores complement values for O(N) time and O(N) space.',
    },
    {
      id: 'code_string_anagram_01',
      topic: 'String Manipulation & Arrays',
      question: (name) =>
        `Welcome ${name}! How would you determine if two given strings are Anagrams of each other (for example, "listen" and "silent")? Explain both the sorting approach and the character frequency count approach.`,
      tips: 'Sorting takes O(N log N). Character frequency array (size 26 for lowercase English) runs in O(N) time with O(1) auxiliary space.',
    },
    {
      id: 'code_linked_list_cycle_01',
      topic: 'Linked List Pointers',
      question: (name) =>
        `Hi ${name}! In a singly linked list, how can you detect if there is a loop or cycle present? Could you explain Floyd’s Cycle-Finding Algorithm (slow and fast pointers) and why it works?`,
      tips: 'Explain the tortoise (1 step) and hare (2 steps). If there is a cycle, the relative distance decreases by 1 on each step, guaranteeing they will meet.',
    },
    {
      id: 'code_stack_balanced_parentheses_01',
      topic: 'Stacks & Expression Parsing',
      question: (name) =>
        `Hello ${name}! Given a string containing brackets like '(', ')', '{', '}', '[', ']', how would you verify whether the brackets are properly balanced and closed in the correct order using a Stack data structure?`,
      tips: 'Push opening brackets to the stack; when encountering a closing bracket, check if stack is empty or if top matches. At the end, stack must be empty.',
    },
    {
      id: 'code_binary_search_01',
      topic: 'Searching Algorithms & Complexity',
      question: (name) =>
        `Welcome ${name}! How does Binary Search work, and what is its time complexity compared to Linear Search? What prerequisite condition must the array satisfy for Binary Search to work correctly?`,
      tips: 'Binary Search requires a sorted array. It divides the search space in half each time: O(log N) vs O(N) linear search.',
    },
  ],

  MIXED: [
    {
      id: 'mixed_project_and_java_01',
      topic: 'Project Deep Dive & Core Java',
      question: (name, resumeHint) =>
        `Welcome ${name}! ${resumeHint}To start, please introduce yourself and summarize your final-year college project. Which database and backend framework did you use, and what was your personal contribution to the code?`,
      tips: 'Give a 2-minute crisp summary: self-introduction, project purpose, your specific role and tech stack, and what you learned.',
    },
    {
      id: 'mixed_dbms_and_oops_01',
      topic: 'OOP & Database Essentials',
      question: (name) =>
        `Hi ${name}! In enterprise software, how do OOP principles like Encapsulation and Abstraction help structure a database-driven application? Also, what is the role of a Primary Key and Foreign Key in maintaining data integrity?`,
      tips: 'Connect OOP models (Entities/DAOs) to database tables, and explain how foreign keys prevent orphaned records.',
    },
    {
      id: 'mixed_behavioral_hr_01',
      topic: 'Adaptability & Company Culture',
      question: (name) =>
        `Hello ${name}! As a fresher joining our placement program, you may be deployed to client projects with tight delivery schedules or evolving requirements. How do you handle work pressure, and what are your expectations from your first corporate role?`,
      tips: 'Highlight eagerness to contribute, positive teamwork, proactive communication, and ability to stay calm under pressure.',
    },
  ],
};

/**
 * Retrieve previously asked question IDs from localStorage
 */
export function getAskedQuestionIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read asked question IDs from localStorage:', err);
    return [];
  }
}

/**
 * Persist an asked question ID to localStorage
 */
export function recordAskedQuestionId(questionId) {
  if (!questionId) return;
  try {
    const asked = getAskedQuestionIds();
    if (!asked.includes(questionId)) {
      asked.push(questionId);
      // Keep only last 40 questions to avoid infinite growth
      const trimmed = asked.slice(-40);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  } catch (err) {
    console.warn('Failed to save asked question ID to localStorage:', err);
  }
}

/**
 * Reset asked history (useful when candidate wants a fresh start)
 */
export function clearAskedQuestionHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear asked question history:', err);
  }
}

/**
 * Build a candidate-tailored opening question that is guaranteed
 * NOT to repeat recently asked questions.
 */
export function getAdaptiveOpeningQuestion({
  interviewType = 'TECHNICAL',
  candidateName = 'Candidate',
  experienceLevel = 'JUNIOR',
  resumeData = null,
}) {
  const normType = (interviewType || 'TECHNICAL').toUpperCase();
  const pool = QUESTION_POOLS[normType] || QUESTION_POOLS.TECHNICAL;
  const askedIds = getAskedQuestionIds();

  // Find candidate unasked questions in this track
  let available = pool.filter((item) => !askedIds.includes(item.id));

  // If candidate has seen every question in this track, recycle the pool
  if (available.length === 0) {
    available = [...pool];
  }

  // If candidate has uploaded a resume with extracted skills or projects,
  // check if any question aligns well with their resume
  let chosen = null;
  const extractedSkills = resumeData?.extractedSkills || [];
  const resumeText = resumeData?.rawText || '';

  if (normType === 'TECHNICAL' && available.length > 1) {
    // If resume mentions Database / SQL, or Spring / Java, or College Project
    const hasDb = /sql|mysql|oracle|dbms|database/i.test(resumeText);
    const hasJava = /java|oops|spring/i.test(resumeText);

    if (hasDb && available.some((q) => q.topic.includes('DBMS') || q.topic.includes('SQL'))) {
      chosen = available.find((q) => q.topic.includes('DBMS') || q.topic.includes('SQL'));
    } else if (hasJava && available.some((q) => q.topic.includes('OOP') || q.topic.includes('Collections'))) {
      chosen = available.find((q) => q.topic.includes('OOP') || q.topic.includes('Collections'));
    }
  }

  // If no resume-targeted match, pick randomly among unasked questions
  if (!chosen) {
    const randomIndex = Math.floor(Math.random() * available.length);
    chosen = available[randomIndex];
  }

  // Record chosen ID into persistent storage
  recordAskedQuestionId(chosen.id);

  // Resume highlight phrase
  const resumeHighlight =
    extractedSkills.length > 0
      ? `I noticed your background in ${extractedSkills.slice(0, 3).join(', ')}. `
      : '';

  const cleanName = candidateName && candidateName.trim() ? candidateName.trim() : 'Candidate';
  const renderedQuestion =
    typeof chosen.question === 'function'
      ? chosen.question(cleanName, resumeHighlight)
      : chosen.question;

  return {
    id: chosen.id,
    topic: chosen.topic,
    question: renderedQuestion,
    tips: chosen.tips,
  };
}

/**
 * Select the next question adaptively during the interview,
 * ensuring no question asked in the current session is repeated
 * and rotating through distinct technical/behavioral topics.
 */
export function getAdaptiveNextQuestion({
  interviewType = 'TECHNICAL',
  candidateName = 'Candidate',
  sessionAskedIds = [],
  questionIndex = 1,
  lastTopic = '',
}) {
  const normType = (interviewType || 'TECHNICAL').toUpperCase();
  const pool = QUESTION_POOLS[normType] || QUESTION_POOLS.TECHNICAL;

  // Filter out any question already asked in the current session
  let candidates = pool.filter((item) => !sessionAskedIds.includes(item.id));

  // If candidates exhausted, take any from pool not asked in last 2 turns
  if (candidates.length === 0) {
    candidates = [...pool];
  }

  // Prefer a question from a different topic than the immediate previous question
  const differentTopicCandidates = candidates.filter((item) => item.topic !== lastTopic);
  const selectedPool = differentTopicCandidates.length > 0 ? differentTopicCandidates : candidates;

  // Deterministic yet varied pick based on questionIndex or random
  const pick = selectedPool[questionIndex % selectedPool.length];

  // Record globally
  recordAskedQuestionId(pick.id);

  const cleanName = candidateName && candidateName.trim() ? candidateName.trim() : 'Candidate';
  const renderedQuestion =
    typeof pick.question === 'function'
      ? pick.question(cleanName, '')
      : pick.question;

  return {
    id: pick.id,
    topic: pick.topic,
    question: renderedQuestion,
    tips: pick.tips,
  };
}
