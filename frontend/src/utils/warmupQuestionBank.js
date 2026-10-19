/**
 * Google-Style Interview Warmup Question Bank & Sampling Engine
 *
 * Implements Google's 3-category taxonomy:
 * 1. BACKGROUND (1 per session)
 * 2. SITUATIONAL (2 per session - STAR method)
 * 3. TECHNICAL (2 per session - Domain tools & concepts)
 */

export const WARMUP_CATEGORIES = {
  BACKGROUND: {
    id: 'BACKGROUND',
    label: 'Background',
    badgeClass: 'badgeBackground',
    desc: 'Past experience, education, storytelling, and role fit',
    color: '#1a73e8', // Google Blue
    bgLight: 'rgba(26, 115, 232, 0.1)',
  },
  SITUATIONAL: {
    id: 'SITUATIONAL',
    label: 'Situational',
    badgeClass: 'badgeSituational',
    desc: 'Handling workplace challenges, collaboration, and adaptability (STAR method)',
    color: '#0f9d58', // Google Green
    bgLight: 'rgba(15, 157, 88, 0.1)',
  },
  TECHNICAL: {
    id: 'TECHNICAL',
    label: 'Technical',
    badgeClass: 'badgeTechnical',
    desc: 'Core knowledge, domain tools, practical workflows, and troubleshooting',
    color: '#f29900', // Google Amber / Warm
    bgLight: 'rgba(242, 153, 0, 0.12)',
  },
};

export const WARMUP_TRACKS = [
  {
    id: 'SOFTWARE_ENGINEERING',
    label: 'Software Engineering',
    desc: 'Core Java, OOPs, Web APIs, Databases & Architecture',
    icon: '💻',
    accentColor: '#1a73e8',
  },
  {
    id: 'DATA_ANALYTICS',
    label: 'Data Analytics',
    desc: 'SQL, Data Cleaning, Metrics, Dashboards & Python',
    icon: '📊',
    accentColor: '#0f9d58',
  },
  {
    id: 'CYBERSECURITY',
    label: 'Cybersecurity',
    desc: 'Security Operations, CIA Triad, Threat Defense & Network Sec',
    icon: '🛡️',
    accentColor: '#e53935',
  },
  {
    id: 'IT_SUPPORT',
    label: 'IT Support',
    desc: 'Troubleshooting, Ticketing, Networking & System Administration',
    icon: '🖥️',
    accentColor: '#8e24aa',
  },
  {
    id: 'PROJECT_MANAGEMENT',
    label: 'Project Management',
    desc: 'Agile/Scrum, Stakeholder Comms, Risk & Resource Planning',
    icon: '📋',
    accentColor: '#f29900',
  },
  {
    id: 'GENERAL',
    label: 'General Interview',
    desc: 'Foundational Behavioral, Communication & Career Preparation',
    icon: '✨',
    accentColor: '#00897b',
  },
];

export const WARMUP_QUESTIONS = {
  SOFTWARE_ENGINEERING: [
    // Background (1 needed)
    {
      id: 'se_bg_01',
      track: 'SOFTWARE_ENGINEERING',
      category: 'BACKGROUND',
      question: 'Can you tell me about yourself, your educational background in software development, and what inspired you to pursue software engineering?',
      tips: 'Give a 90-second overview: your degree, favorite technologies (e.g. Java, Python, Web), key projects built, and what drives your curiosity in tech.',
      jobRelatedTerms: ['software engineering', 'computer science', 'full-stack', 'backend', 'Java', 'data structures', 'APIs', 'algorithms', 'clean code'],
      talkingPoints: [
        'Academic degree and key computing foundations',
        'Specific technologies or project areas you enjoy',
        'Personal motivation for building software systems'
      ]
    },
    {
      id: 'se_bg_02',
      track: 'SOFTWARE_ENGINEERING',
      category: 'BACKGROUND',
      question: 'Walk me through a software application or college project you built that you are most proud of. What was your personal role and technical contribution?',
      tips: 'Structure into: 1) What the app does, 2) Tech stack used, 3) Modules you personally designed/coded, 4) The end result or user impact.',
      jobRelatedTerms: ['architecture', 'backend', 'REST API', 'database', 'MySQL', 'authentication', 'testing', 'deployment', 'Git'],
      talkingPoints: [
        'Project problem statement and user goal',
        'Architecture and tech stack choices',
        'Specific modules or code you personally implemented'
      ]
    },
    // Situational (2 needed)
    {
      id: 'se_sit_01',
      track: 'SOFTWARE_ENGINEERING',
      category: 'SITUATIONAL',
      question: 'Describe a situation where you encountered a difficult technical bug or performance bottleneck in your code. How did you diagnose and resolve it?',
      tips: 'Use the STAR format: Explain the bug symptoms, the diagnostic tools used (logging, debugger, profiler), the fix implemented, and what you learned.',
      jobRelatedTerms: ['debugging', 'profiling', 'stack trace', 'breakpoint', 'root cause', 'unit test', 'latency', 'memory leak', 'optimization'],
      talkingPoints: [
        'Symptoms and impact of the technical issue',
        'Systematic debugging and root-cause analysis steps',
        'The concrete solution and preventive measure implemented'
      ]
    },
    {
      id: 'se_sit_02',
      track: 'SOFTWARE_ENGINEERING',
      category: 'SITUATIONAL',
      question: 'Tell me about a time when you and a teammate had a disagreement over technical implementation or code architecture. How did you handle the situation?',
      tips: 'Focus on constructive communication: listening to trade-offs, consulting documentation or running a prototype benchmark, and reaching a consensus without ego.',
      jobRelatedTerms: ['code review', 'trade-offs', 'scalability', 'collaboration', 'architecture', 'prototyping', 'consensus', 'documentation'],
      talkingPoints: [
        'The nature of the technical disagreement',
        'How you listened, evaluated trade-offs, and tested solutions',
        'The collaborative outcome and how it benefited the project'
      ]
    },
    {
      id: 'se_sit_03',
      track: 'SOFTWARE_ENGINEERING',
      category: 'SITUATIONAL',
      question: 'Describe a project scenario where requirements or deadline constraints changed abruptly close to delivery. How did you adapt your engineering tasks?',
      tips: 'Explain how you reprioritized features, trimmed nice-to-haves to protect core deliverables, communicated risks, and delivered on time.',
      jobRelatedTerms: ['prioritization', 'agile', 'MVP', 'sprint', 'deliverables', 'time management', 'stakeholder communication', 'scope'],
      talkingPoints: [
        'The sudden change in requirements or schedule',
        'How you prioritized core functionality and managed technical debt',
        'The final delivery outcome and key takeaway'
      ]
    },
    // Technical (2 needed)
    {
      id: 'se_tech_01',
      track: 'SOFTWARE_ENGINEERING',
      category: 'TECHNICAL',
      question: 'In Object-Oriented Programming, what is the fundamental difference between an Abstract Class and an Interface, and when would you choose one over the other?',
      tips: 'Cover: multiple inheritance of type, instance state (fields), constructor presence, and "is-a" versus "can-do" architectural design.',
      jobRelatedTerms: ['polymorphism', 'inheritance', 'encapsulation', 'abstraction', 'default methods', 'contract', 'coupling', 'subclass'],
      talkingPoints: [
        'Syntactic and conceptual distinctions (state, constructors, methods)',
        'Multiple inheritance considerations in Java / modern languages',
        'Real-world criteria for selecting an interface vs abstract class'
      ]
    },
    {
      id: 'se_tech_02',
      track: 'SOFTWARE_ENGINEERING',
      category: 'TECHNICAL',
      question: 'In relational databases, explain the difference between an INNER JOIN and a LEFT JOIN. How do database indexes improve search performance, and what are their trade-offs?',
      tips: 'Explain matching vs unmatched row inclusion with a simple table example. For indexes, explain B-tree lookup speed vs overhead on INSERT/UPDATE.',
      jobRelatedTerms: ['INNER JOIN', 'LEFT JOIN', 'Primary Key', 'Foreign Key', 'B-tree index', 'query execution plan', 'table scan', 'write overhead'],
      talkingPoints: [
        'Join behavior and handling of null or missing records',
        'How indexes accelerate query lookups (e.g. B-trees)',
        'Trade-offs of indexing on storage and write throughput'
      ]
    },
    {
      id: 'se_tech_03',
      track: 'SOFTWARE_ENGINEERING',
      category: 'TECHNICAL',
      question: 'What makes a web API RESTful? Can you explain the HTTP methods GET, POST, PUT, and DELETE, and describe what idempotency means?',
      tips: 'Mention resource-based URLs, stateless communication, standard HTTP status codes (200, 201, 400, 404, 500), and why GET and PUT are idempotent while POST is not.',
      jobRelatedTerms: ['REST', 'HTTP methods', 'idempotency', 'stateless', 'JSON', 'status codes', 'payload', 'endpoints', 'CRUD'],
      talkingPoints: [
        'Core REST principles (statelessness, resource URIs)',
        'Distinctions between GET, POST, PUT, and DELETE',
        'Definition and practical importance of idempotency'
      ]
    }
  ],

  DATA_ANALYTICS: [
    // Background
    {
      id: 'da_bg_01',
      track: 'DATA_ANALYTICS',
      category: 'BACKGROUND',
      question: 'Can you tell me about yourself and what drew your interest toward data analytics and business intelligence?',
      tips: 'Highlight your journey: analytical curiosity, degree/certifications (e.g., Google Data Analytics Certificate), tools you learned (SQL, Tableau, Excel, Python), and passion for uncovering insights.',
      jobRelatedTerms: ['data analytics', 'SQL', 'business intelligence', 'spreadsheets', 'visualization', 'Tableau', 'Power BI', 'metrics', 'insights'],
      talkingPoints: [
        'Background and analytical training',
        'Tools and platforms you are comfortable with',
        'Why data-driven storytelling excites you'
      ]
    },
    {
      id: 'da_bg_02',
      track: 'DATA_ANALYTICS',
      category: 'BACKGROUND',
      question: 'Walk me through an end-to-end data analysis project you have completed. What business question were you trying to answer?',
      tips: 'Walk through the 6 stages: Ask, Prepare, Process, Analyze, Share, and Act. Mention data cleaning, chart choices, and final stakeholder recommendation.',
      jobRelatedTerms: ['data lifecycle', 'data cleaning', 'SQL queries', 'KPIs', 'dashboard', 'stakeholders', 'recommendations', 'visualization'],
      talkingPoints: [
        'The central business question or hypothesis',
        'How you acquired, cleaned, and explored the dataset',
        'Actionable conclusions and business recommendations'
      ]
    },
    // Situational
    {
      id: 'da_sit_01',
      track: 'DATA_ANALYTICS',
      category: 'SITUATIONAL',
      question: 'Tell me about a time when you received a raw dataset that was messy, incomplete, or had conflicting entries. How did you validate and clean it?',
      tips: 'Explain your cleaning protocol: checking for missing values, removing duplicates, trimming whitespace, standardizing formats, and cross-checking outliers.',
      jobRelatedTerms: ['data validation', 'missing values', 'duplicates', 'outliers', 'imputation', 'data integrity', 'consistency', 'ETL'],
      talkingPoints: [
        'The state of the raw data and discovered anomalies',
        'Specific cleaning and validation steps taken',
        'How you ensured data accuracy before conducting analysis'
      ]
    },
    {
      id: 'da_sit_02',
      track: 'DATA_ANALYTICS',
      category: 'SITUATIONAL',
      question: 'Describe a situation where you had to present complex statistical data or analytical findings to non-technical stakeholders. How did you communicate effectively?',
      tips: 'Focus on simplification: avoiding technical jargon, highlighting the "so what?" business impact, using clear visualizations, and answering executive questions.',
      jobRelatedTerms: ['data storytelling', 'visualization', 'stakeholders', 'executive summary', 'KPIs', 'charts', 'clarity', 'actionable insights'],
      talkingPoints: [
        'The analytical complexity and target audience background',
        'Techniques used to simplify metrics and visual graphs',
        'The audience response and decision taken based on your presentation'
      ]
    },
    // Technical
    {
      id: 'da_tech_01',
      track: 'DATA_ANALYTICS',
      category: 'TECHNICAL',
      question: 'How do you determine whether to impute missing data or remove rows entirely from an analysis? What techniques do you use to detect outliers?',
      tips: 'Discuss missing data mechanisms (MCAR, MAR, NMAR), imputation techniques (mean, median, mode, forward-fill), and outlier detection via box plots, IQR, and Z-scores.',
      jobRelatedTerms: ['imputation', 'outliers', 'IQR', 'Z-score', 'mean', 'median', 'box plot', 'bias', 'data distribution'],
      talkingPoints: [
        'Criteria for imputing vs dropping null or missing records',
        'Statistical techniques for detecting extreme outliers (IQR, Z-score)',
        'Preventing sample bias and preserving statistical validity'
      ]
    },
    {
      id: 'da_tech_02',
      track: 'DATA_ANALYTICS',
      category: 'TECHNICAL',
      question: 'In SQL, what is the difference between the WHERE clause and the HAVING clause? Can you also explain how Window Functions like ROW_NUMBER() or RANK() differ from GROUP BY?',
      tips: 'WHERE filters rows before aggregation; HAVING filters aggregated groups after GROUP BY. Window functions calculate aggregations across partitions while retaining individual row granularity.',
      jobRelatedTerms: ['WHERE', 'HAVING', 'GROUP BY', 'window functions', 'ROW_NUMBER', 'RANK', 'PARTITION BY', 'aggregation', 'SQL'],
      talkingPoints: [
        'Execution order of WHERE vs HAVING in SQL',
        'Difference between row collapse in GROUP BY vs window functions',
        'Practical example of when to apply ROW_NUMBER() or RANK()'
      ]
    }
  ],

  CYBERSECURITY: [
    // Background
    {
      id: 'cy_bg_01',
      track: 'CYBERSECURITY',
      category: 'BACKGROUND',
      question: 'Tell me about yourself, your interest in cybersecurity, and how you stay up-to-date with emerging security threats and vulnerabilities.',
      tips: 'Mention foundational knowledge (networking, Linux, protocols), practical labs/certs (CompTIA Security+, Google Cyber), and feeds like CVE databases, KrebsOnSecurity, or BleepingComputer.',
      jobRelatedTerms: ['cybersecurity', 'threat intelligence', 'vulnerabilities', 'CVE', 'networking', 'SIEM', 'incident response', 'defense in depth'],
      talkingPoints: [
        'Educational and technical security background',
        'Hands-on lab, tools, or certification experience',
        'Habits for tracking new vulnerabilities and threat actor trends'
      ]
    },
    // Situational
    {
      id: 'cy_sit_01',
      track: 'CYBERSECURITY',
      category: 'SITUATIONAL',
      question: 'Imagine a user reports a suspicious email that they already clicked a link within. Walk me through the immediate steps you would take to triage and contain the incident.',
      tips: 'Follow standard incident response: isolate the endpoint from the network, preserve memory/logs, inspect the URL/domain, check email gateway logs for other recipients, and initiate credential resets.',
      jobRelatedTerms: ['phishing', 'incident response', 'containment', 'endpoint isolation', 'indicators of compromise', 'IoC', 'credential reset', 'triage'],
      talkingPoints: [
        'Immediate containment (network isolation, credential freeze)',
        'Forensic triage and investigation of the phishing payload',
        'Remediation and enterprise-wide sweep for additional victims'
      ]
    },
    {
      id: 'cy_sit_02',
      track: 'CYBERSECURITY',
      category: 'SITUATIONAL',
      question: 'Describe a situation where you had to balance strict security policies against employee productivity or business deadlines. How did you resolve the tension?',
      tips: 'Show that security enables business: explain why friction was reduced with user-friendly MFA or single sign-on, and how clear communication prevents shadow IT.',
      jobRelatedTerms: ['security policy', 'MFA', 'risk assessment', 'shadow IT', 'compliance', 'least privilege', 'user education', 'access control'],
      talkingPoints: [
        'The conflict between security requirements and operational agility',
        'How you evaluated business risk and proposed a workable compromise',
        'The security outcome and user education provided'
      ]
    },
    // Technical
    {
      id: 'cy_tech_01',
      track: 'CYBERSECURITY',
      category: 'TECHNICAL',
      question: 'Can you explain the CIA Triad (Confidentiality, Integrity, Availability) and provide a concrete security control used to enforce each pillar?',
      tips: 'Confidentiality -> Encryption (AES), Access Control (RBAC); Integrity -> Hashing (SHA-256), Digital Signatures; Availability -> Redundancy, Load Balancing, DDoS mitigation.',
      jobRelatedTerms: ['CIA triad', 'confidentiality', 'integrity', 'availability', 'encryption', 'hashing', 'SHA-256', 'RBAC', 'DDoS', 'backups'],
      talkingPoints: [
        'Definitions of Confidentiality, Integrity, and Availability',
        'Practical security controls for each pillar (encryption, hashing, redundancy)',
        'How balancing all three prevents single points of failure'
      ]
    },
    {
      id: 'cy_tech_02',
      track: 'CYBERSECURITY',
      category: 'TECHNICAL',
      question: 'What is the difference between Symmetric and Asymmetric Encryption? In HTTPS/TLS, how are both cryptographic methods combined during the handshake?',
      tips: 'Symmetric uses one shared key (fast, AES); Asymmetric uses public/private keypairs (RSA/ECC). TLS uses asymmetric to authenticate and securely exchange a symmetric session key for bulk data transfer.',
      jobRelatedTerms: ['symmetric encryption', 'asymmetric encryption', 'public key', 'private key', 'TLS handshake', 'HTTPS', 'AES', 'RSA', 'certificates'],
      talkingPoints: [
        'Comparison of symmetric and asymmetric encryption mechanics and speed',
        'The role of certificates and asymmetric keys in server authentication',
        'How the hybrid TLS handshake establishes an efficient symmetric session key'
      ]
    }
  ],

  IT_SUPPORT: [
    // Background
    {
      id: 'it_bg_01',
      track: 'IT_SUPPORT',
      category: 'BACKGROUND',
      question: 'Can you tell me about yourself and what motivates you to work in IT support and systems troubleshooting?',
      tips: 'Emphasize your problem-solving mindset, empathy for frustrated users, curiosity about operating systems and hardware, and eagerness to keep IT infrastructure running smoothly.',
      jobRelatedTerms: ['IT support', 'troubleshooting', 'helpdesk', 'customer service', 'ticketing', 'Windows', 'Active Directory', 'hardware', 'networking'],
      talkingPoints: [
        'Technical interests and educational background',
        'Customer-service orientation and empathy with non-technical users',
        'Passion for systematic problem diagnosis'
      ]
    },
    // Situational
    {
      id: 'it_sit_01',
      track: 'IT_SUPPORT',
      category: 'SITUATIONAL',
      question: 'Tell me about a time when you had to help an upset or frustrated user whose computer failed right before an important presentation. How did you manage the situation?',
      tips: 'Highlight empathy and calm: acknowledge their stress, offer a quick workaround (e.g. loaner laptop or cloud presentation access), and then methodically diagnose the underlying fault.',
      jobRelatedTerms: ['customer service', 'de-escalation', 'empathy', 'workaround', 'triage', 'communication', 'SLA', 'resolution'],
      talkingPoints: [
        'How you de-escalated the user\'s stress and active listening',
        'The immediate temporary workaround provided to protect their deadline',
        'The permanent root-cause resolution and follow-up'
      ]
    },
    {
      id: 'it_sit_02',
      track: 'IT_SUPPORT',
      category: 'SITUATIONAL',
      question: 'Describe how you prioritize your work when you have multiple competing IT tickets arriving simultaneously with different urgency levels.',
      tips: 'Explain triage principles: impact vs urgency matrix (e.g. whole department down vs single monitor flickering), adhering to SLAs, and keeping users informed on ticket status.',
      jobRelatedTerms: ['ticketing system', 'SLA', 'triage', 'severity levels', 'impact', 'urgency', 'prioritization', 'documentation'],
      talkingPoints: [
        'Framework for classifying ticket severity and impact',
        'Adherence to Service Level Agreements (SLAs)',
        'Managing user expectations through proactive ticket updates'
      ]
    },
    // Technical
    {
      id: 'it_tech_01',
      track: 'IT_SUPPORT',
      category: 'TECHNICAL',
      question: 'A user states their computer cannot connect to the internet, but other colleagues in the same room are working fine. Walk me through your step-by-step troubleshooting workflow.',
      tips: 'Start with Layer 1 (cables/Wi-Fi switch) -> IP configuration (ipconfig/DHCP check) -> Ping loopback (127.0.0.1) -> Ping gateway -> Ping 8.8.8.8 (DNS test) -> Browser proxy settings.',
      jobRelatedTerms: ['ipconfig', 'DHCP', 'ping', 'gateway', 'DNS', 'TCP/IP', 'Ethernet', 'Wi-Fi', 'OSI model', 'network adapter'],
      talkingPoints: [
        'Physical layer and network connection verification (Ethernet/Wi-Fi)',
        'Command-line network diagnostics (ipconfig, ping gateway, ping DNS)',
        'DNS, proxy, and network adapter driver verification'
      ]
    },
    {
      id: 'it_tech_02',
      track: 'IT_SUPPORT',
      category: 'TECHNICAL',
      question: 'In an enterprise Windows environment, what is Active Directory and Group Policy (GPO)? How do they assist IT administrators in managing user machines?',
      tips: 'Explain centralized authentication, domain controllers, organizational units (OUs), enforcing password policies, software rollouts, and disabling USB ports via GPO.',
      jobRelatedTerms: ['Active Directory', 'Domain Controller', 'Group Policy', 'GPO', 'Organizational Unit', 'LDAP', 'permissions', 'centralized management'],
      talkingPoints: [
        'Core function of Active Directory (centralized authentication and directory service)',
        'How Group Policy Objects (GPOs) push baseline security and configuration rules',
        'Benefits to enterprise scalability and access control'
      ]
    }
  ],

  PROJECT_MANAGEMENT: [
    // Background
    {
      id: 'pm_bg_01',
      track: 'PROJECT_MANAGEMENT',
      category: 'BACKGROUND',
      question: 'Can you tell me about yourself and what led you to pursue a career in project management and team leadership?',
      tips: 'Highlight organizational skills, facilitation, empathy, communication, certifications/training (e.g. Google Project Management), and enjoyment in coordinating cross-functional efforts.',
      jobRelatedTerms: ['project management', 'agile', 'scrum', 'cross-functional', 'stakeholders', 'deliverables', 'milestones', 'communication', 'leadership'],
      talkingPoints: [
        'Experience and training in project management methodologies',
        'Core strengths in facilitation and cross-functional coordination',
        'What drives your commitment to project delivery excellence'
      ]
    },
    // Situational
    {
      id: 'pm_sit_01',
      track: 'PROJECT_MANAGEMENT',
      category: 'SITUATIONAL',
      question: 'Tell me about a time when a project began suffering from scope creep. How did you identify it, and what steps did you take to protect the delivery timeline?',
      tips: 'Explain change management: documenting new requests, analyzing impact on budget and schedule, engaging the sponsor, and parking non-essential requests in the phase 2 backlog.',
      jobRelatedTerms: ['scope creep', 'change management', 'backlog', 'stakeholders', 'timeline', 'trade-offs', 'project charter', 'budget'],
      talkingPoints: [
        'How unmanaged scope expansion was detected',
        'The change request evaluation process with project sponsors',
        'The outcome on schedule integrity and stakeholder alignment'
      ]
    },
    {
      id: 'pm_sit_02',
      track: 'PROJECT_MANAGEMENT',
      category: 'SITUATIONAL',
      question: 'Describe a situation where key project stakeholders had conflicting priorities and expectations. How did you facilitate alignment and reach an agreement?',
      tips: 'Discuss stakeholder mapping: understanding individual goals, scheduling alignment workshops, anchoring discussions to core business objectives, and documenting agreed acceptance criteria.',
      jobRelatedTerms: ['stakeholder alignment', 'negotiation', 'facilitation', 'acceptance criteria', 'prioritization', 'communication plan', 'consensus'],
      talkingPoints: [
        'The competing stakeholder priorities and potential risks',
        'Facilitation techniques and data used to bridge the gap',
        'The documented consensus and resulting project momentum'
      ]
    },
    // Technical
    {
      id: 'pm_tech_01',
      track: 'PROJECT_MANAGEMENT',
      category: 'TECHNICAL',
      question: 'How do you determine whether an Agile/Scrum framework or a Traditional/Waterfall approach is better suited for a new project initiative?',
      tips: 'Compare criteria: Agile suits projects with high uncertainty, evolving requirements, and rapid iteration needs; Waterfall suits projects with fixed scope, strict regulatory compliance, and predictable stages.',
      jobRelatedTerms: ['Agile', 'Scrum', 'Waterfall', 'sprints', 'flexibility', 'regulatory', 'requirements', 'iterations', 'risk profile'],
      talkingPoints: [
        'Characteristics of projects suited for Agile (iterative, evolving requirements)',
        'Characteristics of projects suited for Waterfall (predictable, fixed scope)',
        'Decision criteria and risk profile evaluation'
      ]
    },
    {
      id: 'pm_tech_02',
      track: 'PROJECT_MANAGEMENT',
      category: 'TECHNICAL',
      question: 'What is a Project Risk Register, and how do you calculate and prioritize risks using probability and impact scoring?',
      tips: 'Explain risk identification, qualitative risk matrix (Probability × Impact = Risk Score), mitigation strategies (Avoid, Mitigate, Transfer, Accept), and assignees.',
      jobRelatedTerms: ['risk register', 'probability and impact', 'mitigation strategy', 'risk score', 'contingency plan', 'risk owner', 'qualitative analysis'],
      talkingPoints: [
        'Components of a comprehensive Risk Register',
        'Scoring matrix for Probability vs Impact',
        'The 4 core risk response strategies (Avoid, Mitigate, Transfer, Accept)'
      ]
    }
  ],

  GENERAL: [
    // Background
    {
      id: 'gen_bg_01',
      track: 'GENERAL',
      category: 'BACKGROUND',
      question: 'Could you please introduce yourself, tell me about your background, and share what makes you a strong candidate for this position?',
      tips: 'The classic elevator pitch: Present your education, key skills, top accomplishments, and what uniquely qualifies you and excites you about this role.',
      jobRelatedTerms: ['professional experience', 'strengths', 'communication', 'problem-solving', 'adaptability', 'education', 'passion', 'collaboration'],
      talkingPoints: [
        'Clear summary of education and professional foundations',
        'Highlight of your greatest professional strength or achievement',
        'Clear rationale for why this opportunity is the natural next step'
      ]
    },
    {
      id: 'gen_bg_02',
      track: 'GENERAL',
      category: 'BACKGROUND',
      question: 'What would you consider your greatest professional strength, and what is one genuine area of improvement you are actively working on?',
      tips: 'For strength, give a real example demonstrating impact. For weakness, choose an authentic trait (e.g. delegating or public speaking) and share the concrete steps you take to improve.',
      jobRelatedTerms: ['self-awareness', 'continuous learning', 'strengths', 'growth mindset', 'resilience', 'feedback', 'mentorship'],
      talkingPoints: [
        'Specific core strength with supporting evidence',
        'Authentic area of improvement with self-awareness',
        'Proactive learning habits and measurable progress made'
      ]
    },
    // Situational
    {
      id: 'gen_sit_01',
      track: 'GENERAL',
      category: 'SITUATIONAL',
      question: 'Tell me about a time when you made a mistake or failed to meet an expectation at work or during a project. How did you take ownership and handle it?',
      tips: 'Crucial STAR question: Admit the mistake honestly, explain immediate damage control, how you communicated with the team, and what preventive lesson you adopted.',
      jobRelatedTerms: ['accountability', 'mistake', 'learning experience', 'ownership', 'communication', 'problem-solving', 'integrity'],
      talkingPoints: [
        'The honest context and acknowledgment of the mistake',
        'Immediate remedial action and transparent communication',
        'The lasting lesson learned and preventive measures put in place'
      ]
    },
    {
      id: 'gen_sit_02',
      track: 'GENERAL',
      category: 'SITUATIONAL',
      question: 'Describe a situation where you had to work closely with someone whose personality or communication style was very different from your own. How did you make the collaboration successful?',
      tips: 'Show emotional intelligence: adjusting your communication (written vs verbal, direct vs detail-oriented), focusing on shared goals, and finding common ground.',
      jobRelatedTerms: ['collaboration', 'emotional intelligence', 'adaptability', 'active listening', 'teamwork', 'conflict resolution', 'shared goals'],
      talkingPoints: [
        'The stylistic difference and initial friction',
        'How you adapted your communication style with active listening',
        'The successful collective outcome achieved together'
      ]
    },
    // Technical
    {
      id: 'gen_tech_01',
      track: 'GENERAL',
      category: 'TECHNICAL',
      question: 'How do you approach learning a completely unfamiliar tool, software program, or skill under a tight deadline?',
      tips: 'Describe your structured rapid-learning framework: reviewing quickstart docs, finding tutorials, building a minimal test project, seeking advice from experts, and iterating.',
      jobRelatedTerms: ['rapid learning', 'documentation', 'framework', 'resourcefulness', 'prototyping', 'mentorship', 'time management', 'curiosity'],
      talkingPoints: [
        'Systematic approach to information gathering and documentation review',
        'Hands-on experimentation through small prototypes',
        'Validating understanding through peer feedback or mentor checks'
      ]
    },
    {
      id: 'gen_tech_02',
      track: 'GENERAL',
      category: 'TECHNICAL',
      question: 'When you are tasked with solving a complex problem with little to no clear instructions, how do you break it down into manageable steps?',
      tips: 'Explain your analytical process: defining the desired end state, identifying unknowns, breaking into smaller sub-tasks, validating assumptions, and establishing milestones.',
      jobRelatedTerms: ['problem solving', 'decomposition', 'critical thinking', 'assumptions', 'milestones', 'analytical skills', 'execution'],
      talkingPoints: [
        'Deconstructing ambiguous goals into defined sub-problems',
        'Formulating hypotheses and validating baseline assumptions',
        'Establishing clear progress checkpoints and adjusting as needed'
      ]
    }
  ]
};

/**
 * Generate a Google-style balanced 5-question warmup round
 * Exactly:
 * - 1 BACKGROUND question
 * - 2 SITUATIONAL questions
 * - 2 TECHNICAL questions
 */
export function generateWarmupSession(trackId = 'SOFTWARE_ENGINEERING') {
  const normTrack = (trackId || 'SOFTWARE_ENGINEERING').toUpperCase();
  const pool = WARMUP_QUESTIONS[normTrack] || WARMUP_QUESTIONS.SOFTWARE_ENGINEERING;

  const bgList = pool.filter((q) => q.category === 'BACKGROUND');
  const sitList = pool.filter((q) => q.category === 'SITUATIONAL');
  const techList = pool.filter((q) => q.category === 'TECHNICAL');

  // Sample 1 Background
  const chosenBg = bgList[Math.floor(Math.random() * bgList.length)] || pool[0];

  // Sample 2 unique Situational
  const shuffledSit = [...sitList].sort(() => 0.5 - Math.random());
  const chosenSit = shuffledSit.slice(0, 2);

  // Sample 2 unique Technical
  const shuffledTech = [...techList].sort(() => 0.5 - Math.random());
  const chosenTech = shuffledTech.slice(0, 2);

  const sessionQuestions = [
    chosenBg,
    chosenSit[0] || pool[1],
    chosenSit[1] || pool[2],
    chosenTech[0] || pool[3],
    chosenTech[1] || pool[4],
  ].filter(Boolean);

  return sessionQuestions.map((q, idx) => ({
    ...q,
    orderIndex: idx + 1,
    totalCount: 5,
  }));
}

/**
 * Retrieve all questions in a track for the "Browse All Questions" mode
 */
export function getAllWarmupQuestions(trackId = 'SOFTWARE_ENGINEERING') {
  const normTrack = (trackId || 'SOFTWARE_ENGINEERING').toUpperCase();
  return WARMUP_QUESTIONS[normTrack] || WARMUP_QUESTIONS.SOFTWARE_ENGINEERING;
}

/**
 * Common English Stopwords for Word Frequency Calculation
 */
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot',
  'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
  'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
  'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s',
  'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll',
  'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
  'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while',
  'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
  'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'
]);

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so yeah', 'right'];

/**
 * Local Instant ML Insights Analyzer
 * Reproduces Google Interview Warmup pattern recognition:
 * 1. Job-Related Terms detected + missing suggestions
 * 2. Most-Used Words and repetition frequencies + filler counts
 * 3. Talking Points coverage checklist
 */
export function analyzeAnswerLocally(answerText = '', questionObj = {}) {
  const cleanAnswer = (answerText || '').trim();
  const lowerAnswer = cleanAnswer.toLowerCase();
  const rawWords = lowerAnswer.split(/\s+/).filter(Boolean);

  // 1. Job-Related Terms Detection
  const targetTerms = questionObj.jobRelatedTerms || [];
  const detectedTerms = [];
  const suggestedTerms = [];

  targetTerms.forEach((term) => {
    const termLower = term.toLowerCase();
    // Match word boundary or substring
    const regex = new RegExp(`\\b${termLower}\\b`, 'i');
    if (regex.test(lowerAnswer) || lowerAnswer.includes(termLower)) {
      detectedTerms.push(term);
    } else {
      suggestedTerms.push(term);
    }
  });

  // 2. Most-Used Words & Filler Analysis
  const wordCounts = {};
  rawWords.forEach((word) => {
    const cleanWord = word.replace(/[^a-z0-9]/g, '');
    if (cleanWord.length > 2 && !STOP_WORDS.has(cleanWord)) {
      wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
    }
  });

  const sortedWordCounts = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count >= 2)
    .slice(0, 6)
    .map(([word, count]) => ({ word, count }));

  // Detect Fillers
  const detectedFillers = {};
  let totalFillers = 0;
  FILLER_WORDS.forEach((filler) => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerAnswer.match(regex);
    if (matches && matches.length > 0) {
      detectedFillers[filler] = matches.length;
      totalFillers += matches.length;
    }
  });

  // 3. Talking Points Coverage
  const targetPoints = questionObj.talkingPoints || [
    'Directly answer the prompt with clear examples',
    'Explain the specific actions or methodology used',
    'Highlight the measurable outcome or learning'
  ];

  const talkingPointsEval = targetPoints.map((point) => {
    // Check if relevant keywords from the point or related terms appear in the answer
    const pointKeywords = point.toLowerCase().split(/\s+/).filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    const matchedCount = pointKeywords.filter((k) => lowerAnswer.includes(k)).length;
    const isCovered = cleanAnswer.length > 35 && (matchedCount >= 1 || detectedTerms.length >= 2);
    return {
      point,
      covered: isCovered,
    };
  });

  return {
    wordCount: rawWords.length,
    detectedTerms,
    suggestedTerms: suggestedTerms.slice(0, 6),
    mostUsedWords: sortedWordCounts,
    fillers: detectedFillers,
    totalFillers,
    talkingPoints: talkingPointsEval,
  };
}
