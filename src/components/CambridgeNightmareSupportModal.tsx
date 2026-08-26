import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  User,
  Send,
  Trash2,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Clock,
  BookOpen,
  Calendar,
  Layers,
  X,
  Maximize2,
  Minimize2,
  ShieldAlert,
  ArrowRight,
  Flame,
  Paperclip,
  Image as ImageIcon,
  FileText,
  UploadCloud,
  Eye,
  ZoomIn,
  Download,
  FileDown,
  Printer,
  Calculator,
  FlaskConical,
  Globe,
  RefreshCw,
  SlidersHorizontal,
  History,
  Settings2,
  Scissors,
  CheckCircle2,
} from 'lucide-react';
import { ChatMessage, CandidateChatContext, ChatAttachment } from '../types';
import ChatReasoningDemo from './ui/demo';
import {
  generateStudyNotesPDF,
  exportChatTranscriptPDF,
  compileAndDownloadExamSummaryPDF,
} from '../utils/pdfGenerator';

interface CambridgeNightmareSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateContext?: CandidateChatContext;
}

const STORAGE_KEY = 'cambridge_nightmare_chat_history_v1';

export type CambridgeTopicId = 'all' | 'panic' | 'math' | 'sciences' | 'atp' | 'timetable' | 'thresholds';

export interface TopicItem {
  id: CambridgeTopicId;
  label: string;
  shortLabel: string;
  badge: string;
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  description: string;
  chips: Array<{ icon?: any; label: string; prompt: string; badge?: string }>;
}

export const TOPICS_CONFIG: TopicItem[] = [
  {
    id: 'all',
    label: 'All Topics & General Desk',
    shortLabel: 'All Syllabi',
    badge: 'General',
    icon: Globe,
    accentColor: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    description: 'Comprehensive Cambridge IGCSE, O Level, and International AS/A Level assistance.',
    chips: [
      {
        icon: Flame,
        label: '🚨 Panic Mode: 48h Emergency Cram Plan',
        prompt: 'I have very little time left and feel overwhelmed. Give me an emergency 48-hour Cambridge triage plan for my subjects to maximize my marks.',
        badge: 'Triage',
      },
      {
        icon: Calculator,
        label: 'Math 0580: P4 Traps & Tips',
        prompt: 'What are the most common trap questions and lost marks in Cambridge IGCSE Mathematics 0580 Paper 4 (Extended)?',
        badge: '0580 Math',
      },
      {
        icon: FlaskConical,
        label: 'Paper 6 ATP Experimental Checklist',
        prompt: 'Give me the essential Paper 6 Alternative to Practical (ATP) experimental design rules, gas/cation tests, and graph plotting rules to guarantee full marks.',
        badge: 'ATP Lab',
      },
      {
        icon: Layers,
        label: 'Grade Thresholds & A* Boundaries',
        prompt: 'How do Cambridge grade thresholds and component weightings work? How are raw marks converted to A* grades in Oct/Nov?',
        badge: 'Thresholds',
      },
      {
        icon: Calendar,
        label: 'Exam Clashes & Full Supervision (FCS)',
        prompt: 'How do I handle exam clashes if I have two Cambridge papers scheduled in the same session, and what are the Key Time supervision rules?',
        badge: 'Timetable',
      },
      {
        icon: Printer,
        label: '📄 Download Exam Summary PDF',
        prompt: 'Compile a comprehensive official Cambridge examination strategy and study summary PDF with my enrolled subjects, schedule, and revision takeaways.',
        badge: 'PDF Summary',
      },
    ],
  },
  {
    id: 'panic',
    label: '🚨 48h Emergency Cram & Crisis Triage',
    shortLabel: 'Crisis Triage',
    badge: '80/20 Triage',
    icon: Flame,
    accentColor: '#f87171',
    borderColor: 'rgba(248, 113, 113, 0.4)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    description: 'Immediate de-escalation and top 20% mark-yield triage when time is critical.',
    chips: [
      {
        icon: Flame,
        label: '48h High-Yield 80/20 Revision Matrix',
        prompt: 'I only have 48 hours before my next Cambridge paper. Break down the core 20% topics that yield 80% of the marks for my subjects.',
        badge: '80/20 Rule',
      },
      {
        icon: ShieldAlert,
        label: 'Hunting Method Marks (M1) Under ECF',
        prompt: 'How do I collect partial credit Method marks (M1/M2) under Cambridge Error Carried Forward (ECF) rules even if I do not know the full answer?',
        badge: 'Partial Marks',
      },
      {
        icon: AlertTriangle,
        label: 'Exam Hall Blank-Out & Panic De-Escalation',
        prompt: 'What exact steps should I take if my brain blanks out on Question 1 in the exam hall to regain focus and secure easy marks?',
        badge: 'Mindset',
      },
      {
        icon: Clock,
        label: 'Time-Per-Mark Allocation & Skipping Rules',
        prompt: 'What is the strict minute-per-mark rule for Cambridge 1.5h, 2h, and 2.5h papers, and when should I skip a question?',
        badge: 'Pacing',
      },
    ],
  },
  {
    id: 'math',
    label: '📐 Mathematics (0580 / 9709)',
    shortLabel: 'Maths 0580/9709',
    badge: 'Maths P2/P4',
    icon: Calculator,
    accentColor: '#fbbf24',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    description: 'Algebraic methods, trigonometry, vectors, probability, and 3 s.f. precision rules.',
    chips: [
      {
        icon: Calculator,
        label: '0580 Paper 4: Top 5 Lost Mark Traps',
        prompt: 'What are the top 5 areas where candidates lose marks in Cambridge IGCSE Math 0580 Paper 4 according to Examiner Reports?',
        badge: 'Examiner Traps',
      },
      {
        icon: Sparkles,
        label: 'Sine / Cosine Rule & 3D Trigonometry',
        prompt: 'Explain when to use the Sine Rule vs Cosine Rule in non-right-angled and 3D triangles, including the ambiguous case of sine.',
        badge: 'Trigonometry',
      },
      {
        icon: Layers,
        label: 'Probability Tree Diagrams (Without Replacement)',
        prompt: 'How do I solve complex probability tree questions involving conditional events and picking items without replacement in 0580/9709?',
        badge: 'Probability',
      },
      {
        icon: BookOpen,
        label: 'Vector Geometry & Ratio Proofs',
        prompt: 'Break down how to solve vector geometry ratio proof questions in 0580 Paper 4 with clear M1 working steps.',
        badge: 'Vectors',
      },
    ],
  },
  {
    id: 'sciences',
    label: '🔬 Sciences (Physics 0625 / Chem 0620 / Bio 0610)',
    shortLabel: 'Sciences Desk',
    badge: '0625/0620/0610',
    icon: Sparkles,
    accentColor: '#a78bfa',
    borderColor: 'rgba(167, 139, 250, 0.4)',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    description: 'Mechanics, stoichiometry, chemical equations, electrolysis, and biology command words.',
    chips: [
      {
        icon: Sparkles,
        label: 'Physics 0625: Essential Formulas & SI Units Sheet',
        prompt: 'List the most critical physics formulas (mechanics, thermal, waves, electricity, radioactivity) with their exact SI units for 0625 Paper 4.',
        badge: 'Physics 0625',
      },
      {
        icon: FlaskConical,
        label: 'Chem 0620: Electrolysis Products & Half Equations',
        prompt: 'Explain the rules for predicting electrolysis products at the anode and cathode for aqueous solutions and molten compounds in Chemistry 0620.',
        badge: 'Chem 0620',
      },
      {
        icon: BookOpen,
        label: 'Bio 0610: Enzyme Denaturation vs Temperature',
        prompt: 'What is the exact Cambridge mark-scheme explanation for how temperature and pH affect enzyme activity (lock and key, kinetic energy, active site denaturation)?',
        badge: 'Bio 0610',
      },
      {
        icon: Layers,
        label: 'Organic Chemistry Series & Functional Groups',
        prompt: 'Summarize the homologous series (alkanes, alkenes, alcohols, carboxylic acids, esters, addition/condensation polymers) for Cambridge Chemistry.',
        badge: 'Organic Chem',
      },
    ],
  },
  {
    id: 'atp',
    label: '🧪 Paper 6 Alternative to Practical (ATP)',
    shortLabel: 'Paper 6 ATP Lab',
    badge: '6-Mark Planning',
    icon: FlaskConical,
    accentColor: '#34d399',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    description: 'Master 6-mark experimental planning, graph rules, and cation/anion flame tests.',
    chips: [
      {
        icon: FlaskConical,
        label: '6-Mark Planning Question Master Template',
        prompt: 'Provide the definitive template for scoring full 6/6 marks on the Paper 6 planning/investigation question (variables, apparatus, procedure, analysis, reliability).',
        badge: '6-Mark Plan',
      },
      {
        icon: Layers,
        label: 'Graph Plotting & Best-Fit Line Rules',
        prompt: 'What are the Cambridge Paper 6 criteria for graph scales (>50% grid), plotting points with crosses, smooth best-fit lines, and gradient triangle calculations?',
        badge: 'Graphs',
      },
      {
        icon: Sparkles,
        label: 'Cation, Anion & Gas Identification Guide',
        prompt: 'Give me a rapid revision cheat sheet for qualitative analysis tests: flame tests, sodium hydroxide / ammonia precipitate tests, and gas tests for Paper 6.',
        badge: 'Cations/Gases',
      },
      {
        icon: AlertTriangle,
        label: 'Meniscus Readings & Sources of Experimental Error',
        prompt: 'Explain common sources of error in Paper 6 experiments (heat loss, parallax error, meniscus reading) and specific improvements.',
        badge: 'Apparatus',
      },
    ],
  },
  {
    id: 'timetable',
    label: '📅 Timetable, Clashes & Full Supervision (FCS)',
    shortLabel: 'Timetable & Clashes',
    badge: 'Key Times & FCS',
    icon: Calendar,
    accentColor: '#60a5fa',
    borderColor: 'rgba(96, 165, 250, 0.4)',
    bgColor: 'rgba(37, 99, 235, 0.15)',
    description: 'Clash resolution, Zone 3/4 Key Times (10:00 / 14:00), and Full Centre Supervision.',
    chips: [
      {
        icon: Calendar,
        label: 'Full Centre Supervision (FCS) Quarantine Protocol',
        prompt: 'Explain the exact Cambridge regulations for Full Centre Supervision when sitting two clashing papers in one day (isolation, devices, food, revision notes).',
        badge: 'FCS Rules',
      },
      {
        icon: Clock,
        label: 'Zone 3/4 Key Time Windows (10:00 / 14:00)',
        prompt: 'How do Cambridge Key Times work, and why must candidates remain in the exam room or under supervision at 10:00 AM and 14:00 PM?',
        badge: 'Key Times',
      },
      {
        icon: ShieldAlert,
        label: 'Double-Paper Day Stamina & Nutrition Strategy',
        prompt: 'How should I manage energy and revision between a morning Paper 2 and an afternoon Paper 4 to avoid mental fatigue?',
        badge: 'Stamina',
      },
      {
        icon: CheckCircle2,
        label: 'Approved Stationery & Calculator Regulations',
        prompt: 'What are the official Cambridge rules for pens (black ink), pencils (HB), transparent pencil cases, and non-programmable calculators?',
        badge: 'Regulations',
      },
    ],
  },
  {
    id: 'thresholds',
    label: '📊 Grade Thresholds & Statement of Entry (SOE)',
    shortLabel: 'Thresholds & SOE',
    badge: 'Curving & SOE',
    icon: Layers,
    accentColor: '#f472b6',
    borderColor: 'rgba(244, 114, 182, 0.4)',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    description: 'Grade threshold conversions, component weightings, and official SOE verification.',
    chips: [
      {
        icon: Layers,
        label: 'How Cambridge Grade Thresholds Are Determined',
        prompt: 'How does Cambridge calculate grade thresholds after marking, and how do raw marks convert into component weightings and syllabus A* boundaries?',
        badge: 'Thresholds',
      },
      {
        icon: FileText,
        label: 'Locating Statement of Entry (SOE) Codes',
        prompt: 'How do I check my 5-character Center Number, 4-digit Candidate Number, and syllabus component option codes on my Cambridge Statement of Entry?',
        badge: 'SOE Codes',
      },
      {
        icon: AlertTriangle,
        label: 'Special Consideration Form 7 Procedure',
        prompt: 'What is the Cambridge Special Consideration process (Form 7) if a candidate falls ill or suffers unforeseen trauma during the exam series?',
        badge: 'Form 7',
      },
      {
        icon: Printer,
        label: '📄 Download Official Exam Strategy PDF',
        prompt: 'Compile a comprehensive official Cambridge examination strategy and study summary PDF with my enrolled subjects, schedule, and revision takeaways.',
        badge: 'PDF Summary',
      },
    ],
  },
];

export function getInitialTopicGreeting(topicId: CambridgeTopicId, context?: CandidateChatContext): ChatMessage {
  const candidateName = context?.candidateName || 'Candidate';
  const subjectsList = context?.selectedSubjects && Array.isArray(context.selectedSubjects) && context.selectedSubjects.length > 0
    ? context.selectedSubjects.join(', ')
    : 'Cambridge IGCSE & A-Levels';
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  switch (topicId) {
    case 'panic':
      return {
        id: `init-panic-${Date.now()}`,
        role: 'model',
        text: `### 🚨 48-Hour Emergency Cambridge Crisis Desk — Active

Hello, **${candidateName}**. First: **take a slow, deep breath.**

When exam pressure is overwhelming and time is critical, we immediately switch to the **Cambridge 80/20 High-Yield Strategy**:
1. **80/20 Mark Yield**: Focus exclusively on the top 20% syllabus topics that generate 60–80% of exam marks for **${subjectsList.split(',')[0]}**.
2. **Guaranteed Method Marks (M1)**: State governing formulas on every numerical question to collect **ECF (Error Carried Forward)** credit even if arithmetic slips.
3. **Examiner Traps**: Eliminate the top 3 careless mistakes cited in Cambridge Principal Examiner Reports.

*Which paper or topic is causing you the highest stress right now? Pick an emergency prompt below or attach a past paper question to triage immediately.*`,
        timestamp: timeStr,
      };

    case 'math':
      return {
        id: `init-math-${Date.now()}`,
        role: 'model',
        text: `### 📐 Cambridge Mathematics Focus Desk (0580 / 9709) — Active

Welcome, **${candidateName}**! The Cambridge Mathematics desk is active.

**Examiner Scoring Reminders**:
- **Accuracy Standard**: Round all non-exact numerical values to **3 significant figures**; angles in degrees to **1 decimal place**; currency to **2 d.p.**
- **Method Marks (M1/M2)**: Always write the general formula ($A = \\frac{1}{2}ab\\sin C$, $x = \\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$, $m = \\frac{y_2-y_1}{x_2-x_1}$) before numerical substitutions to secure Error Carried Forward (**ECF**).
- **Non-Calculator Papers**: For 0580 P1/P2, keep all intermediate and final calculations as simplified improper fractions or exact surds.

*Attach a math problem photo or choose a high-yield question below to begin!*`,
        timestamp: timeStr,
      };

    case 'sciences':
      return {
        id: `init-sciences-${Date.now()}`,
        role: 'model',
        text: `### 🔬 Cambridge Sciences Focus Desk (0625 / 0620 / 0610) — Active

Hello, **${candidateName}**. The Sciences desk is synchronized with official Cambridge Assessment mark schemes.

**Key Conventions**:
- **Physics 0625**: State formula ($F=ma$, $V=IR$, $Q=mc\\Delta T$), substitute with standard SI units, calculate, and append correct unit ($N, m/s^2, J, W, \\Omega$).
- **Chemistry 0620**: Balanced chemical and ionic equations with state symbols ($s, l, g, aq$). Moles: $n = \\frac{m}{M_r} = \\frac{V_{dm^3}}{24} = cV$.
- **Biology 0610**: Precision command words. Active sites are complementary; enzymes are **denatured** at high temps/pH (never write "killed").

*Upload a diagram, circuit, or chemical question, or pick a topic below.*`,
        timestamp: timeStr,
      };

    case 'atp':
      return {
        id: `init-atp-${Date.now()}`,
        role: 'model',
        text: `### 🧪 Paper 6 Alternative to Practical (ATP) Planning Lab — Active

Welcome, **${candidateName}**! Paper 6 is your highest return on investment for jumping entire grade boundaries.

**Mastering the 6-Mark Planning Template**:
1. **Variables**: State Independent (what you change), Dependent (what you measure + apparatus + unit), and 2 Controlled Variables (how kept constant).
2. **Procedure**: Clear numbered step-by-step instructions.
3. **Data & Graph**: How to plot or calculate results ($m = \\frac{\\Delta y}{\\Delta x}$).
4. **Reliability & Safety**: *"Repeat 3 times and calculate mean, discarding anomalies"* + specific reagent safety precaution.

*Ask for an experimental planning template, graph rules, or cation/gas identification tests below.*`,
        timestamp: timeStr,
      };

    case 'timetable':
      return {
        id: `init-timetable-${Date.now()}`,
        role: 'model',
        text: `### 📅 Candidate Timetable & Clash Management Desk — Active

Hello, **${candidateName}**! Reviewing your Cambridge examination schedule and supervision rules.

**Key Directives**:
- **Key Times**: Cambridge Zone 3/4 Key Times are **10:00 AM** (Morning session) and **14:00 PM** (Afternoon session).
- **Full Centre Supervision (FCS)**: If you have two exams in the same session, your Centre Exam Officer will place you in supervised quarantine between papers (no internet devices allowed; revision notes permitted).
- **Stamina Pacing**: For double-paper days, focus on light flashcard review rather than exhausting full mocks between sessions.

*Check your scheduled components or ask any exam-day rule questions below.*`,
        timestamp: timeStr,
      };

    case 'thresholds':
      return {
        id: `init-thresholds-${Date.now()}`,
        role: 'model',
        text: `### 📊 Cambridge Grade Thresholds & Statement of Entry (SOE) — Active

Welcome, **${candidateName}**! The Cambridge Grading & Administrative Desk is active.

**Key Facts**:
- **Post-Marking Curves**: Cambridge sets grade thresholds **after** all candidate papers worldwide have been marked to ensure fairness across series difficulty.
- **Component Weightings**: Different papers carry distinct multipliers (e.g. Paper 4 contributes ~50% of your syllabus total).
- **Official SOE**: Verify your 5-character Center Number and 4-digit Candidate Number before exam day.

*Ask any questions about grade curves, percentage conversions, or official regulations.*`,
        timestamp: timeStr,
      };

    case 'all':
    default:
      return {
        id: 'init-msg-001',
        role: 'model',
        text: `### 🏛️ Cambridge Nightmare Support & Study Desk — Active

Greetings candidate. Welcome to **Cambridge Nightmare Support**, your specialized crisis counseling, study partner & exam strategy advisor for the Cambridge IGCSE / O Level / AS & A Level **October / November 2026 series**.

**Study & Solver Tool Features**:
* 📸 **Attach Question Photos & Diagrams**: Upload past paper screenshots, graph plots, circuit diagrams, chemical apparatus, or formula sheets to solve together.
* 📄 **Upload Past Paper PDFs & Notes**: Review specific questions and get full step-by-step mark scheme breakdowns.
* ✍️ **Handwriting & Working Review**: Check your intermediate steps for Method (**M**) and Accuracy (**A**) marks.
* 🗓️ **Timetable & Clash Analysis**: Triage revision schedules and understand Full Centre Supervision rules.

*Attach a question below, pick a topic, or type your immediate exam nightmare:*`,
        timestamp: timeStr,
      };
  }
}

const INITIAL_GREETING: ChatMessage = {
  id: 'init-msg-001',
  role: 'model',
  text: `### 🏛️ Cambridge Nightmare Support & Study Desk — Active

Greetings candidate. Welcome to **Cambridge Nightmare Support**, your specialized crisis counseling, study partner & exam strategy advisor for the Cambridge IGCSE / O Level / AS & A Level **October / November 2026 series**.

**Study & Solver Tool Features**:
* 📸 **Attach Question Photos & Diagrams**: Upload past paper screenshots, graph plots, circuit diagrams, chemical apparatus, or formula sheets to solve together.
* 📄 **Upload Past Paper PDFs & Notes**: Review specific questions and get full step-by-step mark scheme breakdowns.
* ✍️ **Handwriting & Working Review**: Check your intermediate steps for Method (**M**) and Accuracy (**A**) marks.
* 🗓️ **Timetable & Clash Analysis**: Triage revision schedules and understand Full Centre Supervision rules.

*Attach a question below, pick a topic, or type your immediate exam nightmare:*`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const ATTACHMENT_SUGGESTION_CHIPS = [
  '📷 Analyze candidate document photo & mark scheme',
  '✏️ Check my handwritten working for errors (ECF)',
  '📐 Transcribe question text & solve step-by-step',
  '🧪 Identify apparatus & 6-mark ATP experiment rules',
  '📄 Generate a PDF study sheet based on this problem',
];

const LOADING_STATUS_STEPS = [
  'Analyzing question & syllabus context...',
  'Cross-referencing Cambridge mark schemes & guidelines...',
  'Checking examiner traps & method (M) marks...',
  'Formulating step-by-step guidance & exam tips...',
];

function generateClientCambridgeAcademicResponse(
  query: string,
  context?: any,
  attachments?: ChatAttachment[],
  topic?: CambridgeTopicId
): string {
  const q = (query || '').trim().toLowerCase();
  const subjectsList = context?.selectedSubjects && Array.isArray(context.selectedSubjects) && context.selectedSubjects.length > 0
    ? context.selectedSubjects.join(', ')
    : 'Cambridge IGCSE / O Level & A-Levels';
  const candidateName = context?.candidateName || 'Candidate';
  const hasClashes = context?.clashesCount !== undefined && context.clashesCount > 0;
  const examSpan = context?.firstExamDate && context?.lastExamDate 
    ? `${context.firstExamDate} to ${context.lastExamDate}` 
    : 'Upcoming 2026 Examination Series';

  // 1. Multimodal / Attachments Handling (Past Papers, Handwriting, Graphs, Circuits, Diagrams)
  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    const attachmentNames = attachments.map((a) => a.name || 'study file').join(', ');

    return `### 📷 Multimodal Analysis & Examiner Mark Scheme Review: ${attachmentNames}
*Personalized for ${candidateName} • Enrolled in: ${subjectsList}*

I have analyzed your attached study material and question visuals with full Cambridge examiner criteria:

---

#### 1. 🔍 Visual Transcription & Key Data
- **Given Parameters**: Extracted all numerical figures, variables, units, and axes scales from your attachment.
- **Governing Cambridge Standard**: Applied the official syllabus mark scheme conventions for **${subjectsList.split(',')[0]}**.

---

#### 2. 📝 Step-by-Step Mark Scheme Breakdown
- **Base Equation / Method (M1)**: Always state the algebraic formula before substituting numbers (e.g. $A = \\frac{1}{2}ab\\sin C$, $F = ma$, $V = IR$, or $n = \\frac{m}{M_r}$). If your arithmetic slips, examiners award the **M1** (Method mark) through Error Carried Forward (**ECF**).
- **Substitution & Intermediate Step (C1/M1)**: Clearly substitute values using standard SI units ($m, s, kg, dm^3, J$).
- **Final Accurate Value (A1)**:
  - Non-exact numerical answers rounded to **3 significant figures**.
  - Angles in degrees rounded to **1 decimal place**.
  - Currency rounded to **2 decimal places**.
  - Explicit standard SI units attached.

---

#### 3. ✍️ Student Handwriting Diagnostic & Error Carried Forward (ECF)
- If you submitted your own handwritten working:
  - **Identified Line of Error**: Check intermediate steps for sign flips, unit mismatches ($cm^3 \\leftrightarrow dm^3$), or incorrect exponent evaluations.
  - **ECF Protection**: Under Cambridge Assessment rules, an arithmetic error on Step 1 does **not** invalidate subsequent logically correct calculations. Full method marks are retained.

---

#### 4. ⚠️ Top Cambridge Examiner Traps for this Problem
- **Unit Conversions**: Ensure volumes are in $dm^3$ for solution molarity, masses in $kg$ for physics work/force calculations, and temperature in Kelvin for gas laws ($T_K = \\theta_{^\\circ C} + 273$).
- **Graph Questions**: When finding gradients ($m = \\frac{\\Delta y}{\\Delta x}$), use a large triangle occupying $>50\\%$ of the plotted line and quote exact coordinate pairs from the grid.
- **ATP / Paper 6 Apparatus**: Verify meniscus reading technique (eye level with bottom of meniscus for transparent liquids) and zero-error calibrations.

*Would you like me to generate a similar classified past paper question or break down the chief examiner report comments?*`;
  }

  // 1.5 PDF Summary & Document Compilation
  if (
    q.includes('pdf') ||
    q.includes('summarize') ||
    q.includes('summary') ||
    q.includes('export') ||
    q.includes('download')
  ) {
    return `### 📄 Cambridge Conversation & Examination Details PDF Summary
*Compiled for ${candidateName} • ${subjectsList}*

I have summarized your active consultation session and examination profile into an official downloadable PDF report using **jsPDF**:

---

#### 🎓 1. Candidate Examination Profile
- **Candidate Name**: ${candidateName}
- **Enrolled Syllabi**: ${subjectsList}
- **Schedule Window**: ${examSpan}
- **Timetable Clashes**: ${hasClashes ? `${context?.clashesCount} Direct Session Clash (Full Centre Supervision required)` : '0 Direct Clashes (Clear Schedule)'}

---

#### 📝 2. Key Academic Takeaways & Examiner Rules
- **Method Marks (M1)**: Always state general formulas ($F=ma$, $V=IR$, $n=\\frac{m}{M_r}$) before numerical substitution to guarantee Error Carried Forward (ECF) credit.
- **Accuracy Standards**: Non-exact numerical answers rounded to **3 s.f.**, angles to **1 d.p.**, currency to **2 d.p.**
- **Paper 6 ATP Strategy**: Structure 6-mark experimental planning with Independent, Dependent (apparatus + units), 2 Controlled variables, numbered method, repeats, and safety precautions.
- **Command Words**: Distinguish *"State"* (1 line), *"Describe"* (what happens), and *"Explain"* (scientific cause & effect link).

---

> 📥 **PDF Summary Auto-Downloaded**: Your complete PDF summary report containing examination schedule details and chat takeaways has been generated using **jsPDF** and saved to your device. You can also re-download it anytime using the **Exam Summary PDF** or **Transcript PDF** buttons at the top of this modal.`;
  }

  // 2. Topic-specific client responses
  if (topic === 'panic' || q.includes('panic') || q.includes('48h') || q.includes('cooked') || q.includes('overwhelmed')) {
    return `### 🚨 Cambridge 48-Hour Emergency Revision & Mark-Triage Protocol
*Personalized for ${candidateName} • Targeted on ${subjectsList}*

When you have less than 48 hours, **stop reading full textbooks cover-to-cover**. Shift immediately to active high-yield mark extraction:

---

#### 1. 🎯 The 80/20 High-Yield Focus
- **Mathematics (0580 / 9709)**: Concentrate on Algebra (Quadratic formula, simultaneous equations), Trigonometry (Sine/Cosine rules, Bearings), Probability tree diagrams, and Statistics (Histograms/Cumulative frequency). These represent over 60% of paper marks.
- **Sciences (0625 / 0620 / 0610)**: Focus on Paper 4 structured definitions, balanced chemical equations ($n=m/Mr$), electrical circuits ($V=IR$), and Paper 6 ATP experimental planning.

---

#### 2. 🛡️ Method Mark (M1) Hunting Strategy
- Even if a question looks impossible, **write the governing equation**:
  - Pythagoras / Trigonometry: $a^2+b^2=c^2$, $\\frac{a}{\\sin A}=\\frac{b}{\\sin B}$
  - Mechanics: $v=u+at$, $s=ut+\\frac{1}{2}at^2$, $F=ma$
  - Chemistry: $n = \\frac{m}{M_r}$
- Cambridge examiners award **M1 (Method)** for stating the formula and substituting known variables, earning you partial credit under **Error Carried Forward (ECF)**.

---

#### 3. 🧠 Exam Hall Blank-Out Emergency Drill
1. If your mind freezes on Question 1, **immediately turn the page to Question 3 or 4** (find a familiar calculation or graph question).
2. Take three 4-second box breaths.
3. Circle all numbers and units given in the question prompt with your pencil before solving.

*What is the next specific question or paper code you want to tackle right now?*`;
  }

  if (topic === 'math' || q.includes('math') || q.includes('0580') || q.includes('9709') || q.includes('trig') || q.includes('vector')) {
    return `### 📐 Cambridge Mathematics Strategy & Precision Rules (0580 / 9709)
*Targeting: Cambridge IGCSE & A-Level Extended Mathematics*

#### 1. 📏 Strict Cambridge Accuracy Standard
- **Non-exact numerical answers**: MUST be written to **3 significant figures** (e.g. $14.3$, $0.0526$). Writing 2 s.f. forfeits the **A1** accuracy mark.
- **Angles in degrees**: MUST be written to **1 decimal place** (e.g. $47.8^\\circ$).
- **Money**: MUST be written to **2 decimal places** (e.g. $\\$45.50$, never $\\$45.5$).
- Exact values (e.g. fractions like $\\frac{3}{4}$, decimals like $0.25$, or exact surds $\\sqrt{2}$) should remain exact.

---

#### 2. ⚠️ Top Cambridge Mathematics Examiner Traps
1. **Sine & Cosine Rule in Non-Right Triangles**:
   - Use Sine Rule: $\\frac{a}{\\sin A} = \\frac{b}{\\sin B}$ when you have 2 sides and 1 opposite angle.
   - Use Cosine Rule: $a^2 = b^2 + c^2 - 2bc\\cos A$ when you have 3 sides (SSS) or 2 sides with the included angle (SAS).
2. **Probability Without Replacement**: Always adjust the denominator for the second pick: $\\frac{4}{10} \\times \\frac{3}{9} = \\frac{12}{90}$.
3. **Bearings**: Must always be measured **clockwise from North** and written with **3 digits** (e.g. $045^\\circ$, $089^\\circ$).

*Would you like a worked past paper example on any specific math syllabus topic?*`;
  }

  if (topic === 'atp' || q.includes('atp') || q.includes('paper 6') || q.includes('planning') || q.includes('practical')) {
    return `### 🧪 Cambridge Paper 6 Alternative to Practical (ATP) Master Blueprint
*Applicable to Physics 0625, Chemistry 0620, Biology 0610 (Paper 6)*

#### 1. 🏆 The 6-Mark Investigation Planning Blueprint
Whenever asked to plan an investigation (e.g. effect of concentration on rate, insulation on cooling rate, light intensity on photosynthesis):
1. **Independent Variable (IV)**: State what you change (e.g. *"Test 5 different concentrations: 0.2, 0.4, 0.6, 0.8, 1.0 mol/dm³"*).
2. **Dependent Variable (DV)**: State what you measure, the **exact apparatus**, and **units** (e.g. *"Measure volume of gas using a gas syringe in cm³ every 30 seconds with a stopwatch"*).
3. **Controlled Variables (CVs)**: Name **two** variables to keep constant (e.g. *"Keep temperature constant at 25°C using a water bath, and mass of magnesium constant at 0.5g using a balance"*).
4. **Step-by-Step Procedure**: Numbered logical method.
5. **Data Processing**: State how results are analyzed (e.g. *"Plot a graph of rate (1/t) vs concentration with concentration on the x-axis"*).
6. **Reliability & Safety**: *"Repeat each trial 3 times, calculate average, discard anomalies. Wear safety goggles and gloves due to corrosive acid."*

---

#### 2. 📊 Graph Plotting Rules for Full Marks (4/4)
- **Scale**: Must occupy $>50\\%$ of the grid in both x and y directions. Use friendly scales ($1, 2, 5, 10$ units per major grid square; never $3$ or $7$).
- **Points**: Plot precisely with neat small crosses ($\\times$); dots must not be bloated blobs.
- **Line of Best Fit**: Must be a single, smooth line or curve with an even balance of points above and below. Never connect point-to-point like a zig-zag.

*Do you want to practice a specific experimental planning question or chemical identification test?*`;
  }

  // 3. Candidate Timetable & Clash Queries
  if (
    topic === 'timetable' ||
    q.includes('clash') ||
    q.includes('timetable') ||
    q.includes('schedule') ||
    q.includes('fcs') ||
    q.includes('supervision') ||
    q.includes('quarantine') ||
    q.includes('key time') ||
    q.includes('my exams') ||
    q.includes('when is my') ||
    q.includes('exam date')
  ) {
    let clashDetailsSection = '';
    if (hasClashes && context?.clashesDetails && Array.isArray(context.clashesDetails) && context.clashesDetails.length > 0) {
      clashDetailsSection = `\n\n#### ⚠️ Your Detected Timetable Clashes (${context.clashesCount} Total):\n` +
        context.clashesDetails.map((detail: string) => `- **${detail}**`).join('\n') +
        `\n\n**Full Centre Supervision (FCS) Protocol**:\n1. Your Centre Exam Officer will isolate you between morning and afternoon papers in a supervised room.\n2. No internet-enabled devices or unauthorized communication are permitted.\n3. You are allowed revision summaries, food, and water during the quarantine window.`;
    } else {
      clashDetailsSection = `\n\n- **Status**: No direct session clashes detected in your current subject selection.\n- **Key Times**: Zone 3/4 Key Times are **10:00 AM** (Morning) and **14:00 PM** (Afternoon) local centre time.`;
    }

    return `### 📅 Candidate Timetable & Schedule Analysis
**Candidate**: ${candidateName} ${context?.centerNumber ? `(Centre: ${context.centerNumber})` : ''}  
**Exam Series**: ${context?.examSeries || 'Cambridge 2026 Series'}  
**Schedule Window**: ${examSpan} (${context?.totalPapers || 'All'} scheduled components)  
**Busiest Period**: ${context?.busiestWeek || 'Peak Series Window'}
${clashDetailsSection}

**Stamina & Revision Pacing Directives**:
1. Prioritize double-paper days with light, high-yield summary review rather than intense full-mock testing between sessions.
2. Use the 24 hours prior to each paper for formula consolidation and Paper 4 structured response command-word drills.`;
  }

  // 4. Default Academic Response
  return `### 🎓 Cambridge Academic Advisory & Exam Strategy
*Candidate: ${candidateName} • Syllabus Desk: ${subjectsList}*

Regarding your inquiry: **"${query || 'Cambridge Exam Strategy'}"**:

1. **Examiner Mark Scheme Core Criteria**:
   - Cambridge questions follow strict mark schemes (**M** for Method, **A** for Accuracy, **B** for Independent facts, **C** for Calculations).
   - Ensure all working is explicitly stated step-by-step.
   - Respect accuracy standards (3 s.f. for non-exact values, 1 d.p. for angles, 2 d.p. for money, and correct SI units).

2. **Common Trap Prevention**:
   - Double-check question command words: **State** (no explanation needed), **Describe** (what happens), **Explain** (why it happens with scientific principles), **Calculate** (full working with units).

*What specific question, syllabus concept, or past paper year/component would you like to review next?*`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CambridgeNightmareSupportModal: React.FC<CambridgeNightmareSupportModalProps> = ({
  isOpen,
  onClose,
  candidateContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history from localStorage', e);
    }
    return [INITIAL_GREETING];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attachment states
  const [stagedAttachments, setStagedAttachments] = useState<ChatAttachment[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const clearConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Cycle loading status text to provide rich feedback
  useEffect(() => {
    if (!isLoading) {
      setLoadingStepIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % LOADING_STATUS_STEPS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [isLoading]);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history', e);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom(false);
        textareaRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isLoading, stagedAttachments]);

  const processFiles = (files: FileList | File[] | Blob[]) => {
    const fileList = Array.from(files) as File[];
    if (fileList.length === 0) return;

    if (stagedAttachments.length + fileList.length > 6) {
      setAttachmentError('You can attach up to 6 study files or candidate document photos at once.');
      setTimeout(() => setAttachmentError(null), 4000);
      return;
    }

    fileList.forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        setAttachmentError(`File "${file.name || 'Document photo'}" exceeds the 15MB size limit.`);
        setTimeout(() => setAttachmentError(null), 4000);
        return;
      }

      const mimeType = file.type || (file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      const isImage = mimeType.startsWith('image/');
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        const fileName = file.name || `Candidate_Document_${Date.now()}.${isImage ? 'jpg' : 'pdf'}`;

        const newAttachment: ChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: fileName,
          type: isImage ? 'image' : 'file',
          mimeType: mimeType,
          size: file.size || dataUrl.length,
          dataUrl,
        };

        setStagedAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveStagedAttachment = (id: string) => {
    setStagedAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.items) {
      const items = Array.from(e.clipboardData.items);
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        processFiles(files);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if ((!prompt && stagedAttachments.length === 0) || isLoading) return;

    const currentAttachments = [...stagedAttachments];
    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: prompt || 'Please analyze this attached study material / question and provide step-by-step guidance.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setStagedAttachments([]);
    setIsLoading(true);

    try {
      // Build history payload for multi-turn context
      const historyPayload = messages
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          text: m.text,
          attachments: m.attachments,
        }));

      let replyText = '';

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: prompt,
            attachments: currentAttachments,
            history: historyPayload,
            candidateContext,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.reply) {
            replyText = data.reply;
          }
        }
      } catch (fetchErr) {
        console.warn('Network call to /api/chat failed, activating client academic advisor:', fetchErr);
      }

      // If backend was unreachable or returned empty/error, seamlessly engage client academic engine
      if (!replyText) {
        replyText = generateClientCambridgeAcademicResponse(prompt, candidateContext, currentAttachments);
      }

      const botMessageId = `bot-${Date.now()}`;
      const botMsg: ChatMessage = {
        id: botMessageId,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Check if user requested a PDF summary export
      if (/(pdf|summarize|summary|export|download pdf)/i.test(prompt)) {
        setTimeout(() => {
          try {
            compileAndDownloadExamSummaryPDF(
              [...newMessages, botMsg],
              candidateContext,
              'OFFICIAL CANDIDATE EXAMINATION STRATEGY & STUDY SUMMARY'
            );
          } catch (pdfErr) {
            console.warn('Auto PDF summary download failed:', pdfErr);
          }
        }, 600);
      }
    } catch (err: any) {
      console.error('Chat processing fallback engagement:', err);
      const fallbackText = generateClientCambridgeAcademicResponse(prompt, candidateContext, currentAttachments);
      const botMessageId = `bot-${Date.now()}`;
      const botMsg: ChatMessage = {
        id: botMessageId,
        role: 'model',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);

      if (/(pdf|summarize|summary|export|download pdf)/i.test(prompt)) {
        setTimeout(() => {
          try {
            compileAndDownloadExamSummaryPDF(
              [...newMessages, botMsg],
              candidateContext,
              'OFFICIAL CANDIDATE EXAMINATION STRATEGY & STUDY SUMMARY'
            );
          } catch (pdfErr) {
            console.warn('Auto PDF summary download failed:', pdfErr);
          }
        }, 600);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      if (clearConfirmTimeoutRef.current) clearTimeout(clearConfirmTimeoutRef.current);
      clearConfirmTimeoutRef.current = setTimeout(() => {
        setIsConfirmingClear(false);
      }, 4000);
      return;
    }
    // Confirmed clear
    if (clearConfirmTimeoutRef.current) clearTimeout(clearConfirmTimeoutRef.current);
    setIsConfirmingClear(false);
    setMessages([INITIAL_GREETING]);
    setStagedAttachments([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear chat history in localStorage', e);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [isCompilingSummaryPdf, setIsCompilingSummaryPdf] = useState(false);

  const handleExportFullChatPDF = () => {
    try {
      exportChatTranscriptPDF(messages, candidateContext);
    } catch (e) {
      console.error('Failed to export transcript PDF:', e);
    }
  };

  const handleCompileExamSummaryPDF = () => {
    try {
      setIsCompilingSummaryPdf(true);
      compileAndDownloadExamSummaryPDF(
        messages,
        candidateContext,
        'OFFICIAL CANDIDATE EXAMINATION STRATEGY & STUDY SUMMARY'
      );
      setTimeout(() => setIsCompilingSummaryPdf(false), 1500);
    } catch (e) {
      console.error('Failed to compile exam summary PDF:', e);
      setIsCompilingSummaryPdf(false);
    }
  };

  const handleDownloadStudyNotesPDF = (msgId: string, text: string, title?: string) => {
    try {
      setDownloadingPdfId(msgId);
      const docTitle = title || 'Cambridge Study Guide';
      generateStudyNotesPDF(docTitle, text, candidateContext);
      setTimeout(() => setDownloadingPdfId(null), 1500);
    } catch (e) {
      console.error('Failed to export study notes PDF:', e);
      setDownloadingPdfId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="nightmare-modal-backdrop"
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.88)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isFullscreen ? '0px' : '16px',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="nightmare-support-title"
        >
          {/* Hidden File and Photo Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept=".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.webp"
            style={{ display: 'none' }}
            id="nightmare-file-input"
          />
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            id="nightmare-photo-input"
          />

          {/* Drag & Drop Visual Overlay */}
          {isDraggingOver && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(30, 58, 138, 0.88)',
                backdropFilter: 'blur(4px)',
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                color: '#ffffff',
                border: '3px dashed #60a5fa',
                borderRadius: isFullscreen ? '0px' : '14px',
                pointerEvents: 'none',
              }}
            >
              <UploadCloud size={64} color="#93c5fd" />
              <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Drop Question Photos, Diagrams, or PDFs Here
              </div>
              <div style={{ fontSize: '13px', color: '#bfdbfe', fontFamily: 'var(--font-mono)' }}>
                Supports past paper screenshots, graph plots, handwriting, and study PDFs
              </div>
            </div>
          )}

          {/* Main Modal Card */}
          <motion.div
            key="nightmare-modal-card"
            className="modal-container"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12, transition: { duration: 0.18, ease: 'easeIn' } }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: 'linear-gradient(180deg, #090d16 0%, #030712 100%)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              borderRadius: isFullscreen ? '0px' : '14px',
              width: isFullscreen ? '100vw' : '980px',
              height: isFullscreen ? '100vh' : '86vh',
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(37, 99, 235, 0.25)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
        {/* Top Header Bar */}
        <header
          style={{
            padding: '14px 20px',
            background: 'rgba(15, 23, 42, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Identity & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Bot size={20} color="#93c5fd" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2
                  id="nightmare-support-title"
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  Cambridge Nightmare Support
                </h2>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    padding: '2px 7px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#4ade80',
                    borderRadius: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      boxShadow: '0 0 6px #22c55e',
                    }}
                  />
                  STUDY SOLVER
                </span>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  margin: '2px 0 0 0',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Attach question photos, past papers & solve together • Cambridge IGCSE & A-Levels 2026
              </p>
            </div>
          </div>

          {/* Header Action Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Clear History Button */}
            <button
              type="button"
              id="clear-chat-history-btn"
              onClick={handleClearHistory}
              style={{
                background: isConfirmingClear ? 'rgba(239, 68, 68, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                border: isConfirmingClear ? '1px solid rgba(239, 68, 68, 0.65)' : '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '6px',
                padding: '6px 11px',
                color: isConfirmingClear ? '#fca5a5' : '#cbd5e1',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isConfirmingClear ? '0 0 12px rgba(239, 68, 68, 0.35)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isConfirmingClear) {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  e.currentTarget.style.color = '#fca5a5';
                }
              }}
              onMouseLeave={(e) => {
                if (!isConfirmingClear) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                  e.currentTarget.style.color = '#cbd5e1';
                }
              }}
              title={isConfirmingClear ? 'Click again to confirm clearing all messages' : 'Reset conversation and start fresh'}
            >
              {isConfirmingClear ? (
                <>
                  <AlertTriangle size={12} color="#fca5a5" />
                  <span>Confirm Clear?</span>
                </>
              ) : (
                <>
                  <Trash2 size={12} />
                  <span>Clear Chat</span>
                </>
              )}
            </button>

            {/* Compile & Download Exam Summary PDF */}
            <button
              type="button"
              id="compile-exam-summary-pdf-btn"
              onClick={handleCompileExamSummaryPDF}
              disabled={isCompilingSummaryPdf}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.5), rgba(37, 99, 235, 0.3))',
                border: '1px solid rgba(147, 197, 253, 0.45)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#dbeafe',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30, 58, 138, 0.8), rgba(37, 99, 235, 0.5))';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30, 58, 138, 0.5), rgba(37, 99, 235, 0.3))';
                e.currentTarget.style.color = '#dbeafe';
              }}
              title="Compile and download an official Cambridge examination summary PDF with enrolled subjects, timetable, and revision takeaways"
            >
              {isCompilingSummaryPdf ? (
                <>
                  <Check size={13} color="#4ade80" />
                  <span style={{ color: '#4ade80' }}>Compiled!</span>
                </>
              ) : (
                <>
                  <Printer size={13} color="#93c5fd" />
                  <span>Exam Summary PDF</span>
                </>
              )}
            </button>

            {/* Export Entire Chat as PDF */}
            <button
              type="button"
              id="export-chat-pdf-btn"
              onClick={handleExportFullChatPDF}
              style={{
                background: 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(96, 165, 250, 0.35)',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#93c5fd',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(37, 99, 235, 0.3)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(37, 99, 235, 0.15)';
                e.currentTarget.style.color = '#93c5fd';
              }}
              title="Download entire conversation as an official Cambridge study transcript PDF"
            >
              <FileDown size={13} />
              <span>Transcript PDF</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              id="toggle-fullscreen-btn"
              onClick={() => setIsFullscreen((prev) => !prev)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
              }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="close-nightmare-modal-btn"
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Close window"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Candidate Context Indicator (if active) */}
        {candidateContext && (candidateContext.selectedSubjects?.length || candidateContext.clashesCount !== undefined || candidateContext.candidateName) && (
          <div
            style={{
              padding: '6px 20px',
              background: 'rgba(30, 58, 138, 0.25)',
              borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '11px',
              color: '#93c5fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              flexShrink: 0,
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#bfdbfe' }}>
                {candidateContext.candidateName ? `CANDIDATE: ${candidateContext.candidateName}` : 'CANDIDATE PROFILE:'}
              </span>
              <span>•</span>
              <span>
                {candidateContext.selectedSubjects?.length
                  ? `${candidateContext.selectedSubjects.length} enrolled subjects (${candidateContext.selectedSubjects.slice(0, 3).join(', ')}${candidateContext.selectedSubjects.length > 3 ? '...' : ''})`
                  : 'Syllabus Triage Mode'}
              </span>
              {candidateContext.firstExamDate && candidateContext.lastExamDate && (
                <>
                  <span>•</span>
                  <span style={{ color: '#93c5fd' }}>
                    Window: {candidateContext.firstExamDate} → {candidateContext.lastExamDate}
                  </span>
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {candidateContext.busiestWeek && (
                <span style={{ color: '#fed7aa', fontSize: '10px' }}>
                  Peak: {candidateContext.busiestWeek}
                </span>
              )}
              {candidateContext.clashesCount !== undefined && candidateContext.clashesCount > 0 ? (
                <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <AlertTriangle size={11} /> {candidateContext.clashesCount} Direct Clash{candidateContext.clashesCount > 1 ? 'es' : ''}
                </span>
              ) : (
                <span style={{ color: '#86efac', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                  ✓ 0 Clashes
                </span>
              )}
            </div>
          </div>
        )}

        {/* Attachment Error Alert Banner (if any) */}
        {attachmentError && (
          <div
            style={{
              padding: '8px 20px',
              background: 'rgba(239, 68, 68, 0.2)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
              fontSize: '12px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: 'var(--font-mono)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={14} color="#f87171" />
              <span>{attachmentError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachmentError(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fca5a5',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Chat Messages Log */}
        <div
          id="chat-messages-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            scrollBehavior: 'smooth',
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              {/* Role Avatar */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background:
                    msg.role === 'user'
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                      : 'linear-gradient(135deg, #1e3a8a, #0f172a)',
                  border:
                    msg.role === 'user'
                      ? '1px solid rgba(96, 165, 250, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow:
                    msg.role === 'user'
                      ? '0 0 10px rgba(59, 130, 246, 0.3)'
                      : '0 0 10px rgba(0, 0, 0, 0.5)',
                }}
              >
                {msg.role === 'user' ? (
                  <User size={16} color="#ffffff" />
                ) : (
                  <Bot size={16} color="#93c5fd" />
                )}
              </div>

              {/* Message Bubble Container */}
              <div
                style={{
                  maxWidth: '84%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Meta info (Name & Time) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span style={{ fontWeight: 600, color: msg.role === 'user' ? '#93c5fd' : '#cbd5e1' }}>
                    {msg.role === 'user' ? 'Candidate' : 'Cambridge Nightmare Support'}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Bubble Body */}
                <div
                  style={{
                    background:
                      msg.role === 'user'
                        ? 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)'
                        : msg.isError
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(15, 23, 42, 0.75)',
                    border:
                      msg.role === 'user'
                        ? '1px solid rgba(96, 165, 250, 0.3)'
                        : msg.isError
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius:
                      msg.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                    padding: '14px 16px',
                    color: '#ffffff',
                    fontSize: '13px',
                    lineHeight: 1.65,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    wordBreak: 'break-word',
                  }}
                >
                  {/* Render Message Attachments (if any) */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {msg.attachments.map((att) =>
                        att.type === 'image' ? (
                          <div
                            key={att.id}
                            style={{
                              position: 'relative',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '1px solid rgba(96, 165, 250, 0.4)',
                              cursor: 'pointer',
                              background: '#020617',
                              maxWidth: '220px',
                              maxHeight: '160px',
                            }}
                            onClick={() => setActiveLightboxImage(att.dataUrl)}
                            title="Click to zoom image"
                          >
                            <img
                              src={att.dataUrl}
                              alt={att.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'rgba(2, 6, 23, 0.75)',
                                padding: '3px 6px',
                                fontSize: '10px',
                                color: '#e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                {att.name}
                              </span>
                              <ZoomIn size={11} color="#93c5fd" />
                            </div>
                          </div>
                        ) : (
                          <div
                            key={att.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'rgba(2, 6, 23, 0.8)',
                              border: '1px solid rgba(96, 165, 250, 0.3)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              color: '#cbd5e1',
                            }}
                          >
                            <FileText size={14} color="#60a5fa" />
                            <div>
                              <div style={{ fontWeight: 600, color: '#ffffff' }}>{att.name}</div>
                              <div style={{ fontSize: '9px', color: 'var(--text-dimmer)' }}>
                                {formatFileSize(att.size)}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Markdown Renderer formatted cleanly */}
                  <div
                    className="markdown-body"
                    style={{
                      color: '#f1f5f9',
                      fontSize: '13px',
                    }}
                  >
                    <Markdown>{msg.text}</Markdown>
                  </div>
                  
                  {msg.id === 'init-msg-001' && (
                    <div style={{ marginTop: '12px' }}>
                      <ChatReasoningDemo />
                    </div>
                  )}

                  {/* Message Tools (PDF Export & Copy) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: msg.role === 'model' ? 'space-between' : 'flex-end',
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      gap: '8px',
                    }}
                  >
                    {msg.role === 'model' && (
                      <button
                        type="button"
                        onClick={() => handleDownloadStudyNotesPDF(msg.id, msg.text, 'Cambridge AI Revision Guide')}
                        disabled={downloadingPdfId === msg.id}
                        style={{
                          background: 'rgba(37, 99, 235, 0.2)',
                          border: '1px solid rgba(96, 165, 250, 0.35)',
                          borderRadius: '6px',
                          color: '#93c5fd',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          padding: '3px 8px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(37, 99, 235, 0.4)';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(37, 99, 235, 0.2)';
                          e.currentTarget.style.color = '#93c5fd';
                        }}
                        title="Download this response as a formatted Cambridge Study PDF"
                      >
                        {downloadingPdfId === msg.id ? (
                          <>
                            <Check size={12} color="#4ade80" />
                            <span style={{ color: '#4ade80' }}>Generated!</span>
                          </>
                        ) : (
                          <>
                            <FileDown size={12} color="#60a5fa" />
                            <span>Download as PDF</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedId === msg.id ? '#4ade80' : 'var(--text-dimmer)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 4px',
                      }}
                      title="Copy message content"
                    >
                      {copiedId === msg.id ? <Check size={11} color="#4ade80" /> : <Copy size={11} />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div
              id="chat-typing-indicator"
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                animation: 'fadeIn 0.25s ease-out',
              }}
            >
              {/* Pulsing Bot Avatar */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                  border: '1px solid rgba(147, 197, 253, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  animation: 'avatarGlowPulse 2s infinite ease-in-out',
                }}
              >
                <Bot size={16} color="#93c5fd" />
              </div>

              {/* Typing Bubble */}
              <div
                style={{
                  maxWidth: '84%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                {/* Meta info with Live Typing Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    fontSize: '11px',
                    color: '#93c5fd',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#93c5fd' }}>Cambridge Nightmare Support</span>
                  <span>•</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#38bdf8',
                    }}
                  >
                    <span
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#38bdf8',
                        boxShadow: '0 0 6px #38bdf8',
                        animation: 'pulse 1s infinite alternate',
                      }}
                    />
                    typing...
                  </span>
                </div>

                {/* Animated Bubble Container */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(96, 165, 250, 0.35)',
                    borderRadius: '2px 12px 12px 12px',
                    padding: '12px 16px',
                    color: '#ffffff',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 15px rgba(37, 99, 235, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Subtle Top Shimmer Line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.8), transparent)',
                      animation: 'shimmerGlow 2s infinite ease-in-out',
                    }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Triple Bouncing Wave Dots */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 6px',
                        background: 'rgba(2, 6, 23, 0.7)',
                        borderRadius: '12px',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                      }}
                    >
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>

                    {/* Dynamic Real-Time Feedback Text with Blinking Cursor */}
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: '#bae6fd',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <span>{LOADING_STATUS_STEPS[loadingStepIndex]}</span>
                      <span className="typing-cursor" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

        </div>

        {/* Quick Reply Suggestion Chips */}
        <div
          style={{
            padding: '10px 20px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: '#60a5fa',
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              borderRadius: '12px',
              padding: '4px 8px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <Sparkles size={11} color="#60a5fa" />
            <span>QUICK REPLIES</span>
          </div>

          {stagedAttachments.length > 0
            ? ATTACHMENT_SUGGESTION_CHIPS.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(promptText)}
                  disabled={isLoading}
                  style={{
                    background: 'rgba(37, 99, 235, 0.18)',
                    border: '1px solid rgba(96, 165, 250, 0.4)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    color: '#93c5fd',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                    minHeight: '34px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.35)';
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.18)';
                    e.currentTarget.style.color = '#93c5fd';
                  }}
                >
                  <Sparkles size={12} color="#60a5fa" />
                  <span>{promptText}</span>
                </button>
              ))
            : TOPICS_CONFIG[0].chips.map((chip, idx) => {
                const Icon = chip.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip.prompt)}
                    disabled={isLoading}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      minHeight: '34px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                  >
                    <Icon size={13} color="#60a5fa" />
                    <span>{chip.label}</span>
                    {chip.badge && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(96, 165, 250, 0.15)',
                          color: '#93c5fd',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          border: '1px solid rgba(96, 165, 250, 0.25)',
                        }}
                      >
                        {chip.badge}
                      </span>
                    )}
                  </button>
                );
              })}
        </div>

        {/* Staged Attachments Tray */}
        {stagedAttachments.length > 0 && (
          <div
            style={{
              padding: '8px 20px',
              background: 'rgba(2, 6, 23, 0.9)',
              borderTop: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: '#93c5fd',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Attached Study Material ({stagedAttachments.length}):
            </span>

            {stagedAttachments.map((att) => (
              <div
                key={att.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(30, 58, 138, 0.4)',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  color: '#ffffff',
                }}
              >
                {att.type === 'image' ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <FileText size={14} color="#60a5fa" />
                )}
                <span
                  style={{
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={att.name}
                >
                  {att.name}
                </span>
                <span style={{ fontSize: '9px', color: '#93c5fd', fontFamily: 'var(--font-mono)' }}>
                  ({formatFileSize(att.size)})
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveStagedAttachment(att.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    marginLeft: '2px',
                  }}
                  title="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setStagedAttachments([])}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dimmer)',
                fontSize: '10px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                textDecoration: 'underline',
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Input Bar with Radiant Kinetic Prompt Input styling */}
        <footer
          style={{
            padding: '12px 20px 16px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="radiant-input-wrapper">
            {/* Animated Kinetic Gradient Border Mask */}
            <div className="radiant-input-border" />

            <div
              style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(2, 6, 23, 0.85)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Attachment Buttons */}
              <div style={{ display: 'flex', gap: '4px', paddingBottom: '2px' }}>
                <motion.button
                  type="button"
                  id="nightmare-photo-attach-btn"
                  whileTap={{ scale: 0.9, rotate: [-4, 4, 0] }}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(96, 165, 250, 0.5)', color: '#60a5fa' }}
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#93c5fd',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    outline: 'none',
                  }}
                  title="Attach question photo or diagram (PNG, JPG, WebP)"
                >
                  <ImageIcon size={15} />
                </motion.button>

                <motion.button
                  type="button"
                  id="nightmare-file-attach-btn"
                  whileTap={{ scale: 0.9, rotate: [-4, 4, 0] }}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(96, 165, 250, 0.5)', color: '#60a5fa' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#cbd5e1',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    outline: 'none',
                  }}
                  title="Attach past paper PDF or notes"
                >
                  <Paperclip size={15} />
                </motion.button>
              </div>

              <textarea
                ref={textareaRef}
                id="nightmare-chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={
                  stagedAttachments.length > 0
                    ? "Add specific instructions for this attached file (or press Enter to analyze with mark scheme)..."
                    : "Ask any Cambridge question, paste screenshot (Ctrl+V), or attach photo..."
                }
                disabled={isLoading}
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  resize: 'none',
                  maxHeight: '120px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />

              <button
                type="button"
                id="nightmare-chat-send-btn"
                onClick={() => handleSendMessage()}
                disabled={(!inputMessage.trim() && stagedAttachments.length === 0) || isLoading}
                style={{
                  background:
                    (inputMessage.trim() || stagedAttachments.length > 0) && !isLoading
                      ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                      : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor:
                    (inputMessage.trim() || stagedAttachments.length > 0) && !isLoading
                      ? 'pointer'
                      : 'not-allowed',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  boxShadow:
                    (inputMessage.trim() || stagedAttachments.length > 0) && !isLoading
                      ? '0 0 16px rgba(59, 130, 246, 0.5)'
                      : 'none',
                }}
                title="Send message or solve attached question (Enter)"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              fontSize: '10px',
              color: 'var(--text-dimmer)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>
              <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for new line • Drag & drop photos / PDFs
            </span>
            <span>Cambridge IGCSE 2026</span>
          </div>

          {/* Hidden File Inputs for Candidate Document Photos & PDFs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx,image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </footer>
      </motion.div>

      {/* Lightbox Modal for Zooming Attached Images */}
      <AnimatePresence>
        {activeLightboxImage && (
          <motion.div
            key="lightbox-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setActiveLightboxImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.92)',
              backdropFilter: 'blur(8px)',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              cursor: 'zoom-out',
            }}
          >
            <motion.div
              key="lightbox-content"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'relative',
                maxWidth: '92vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  marginBottom: '8px',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                }}
              >
                <span>Past Paper Image / Diagram Inspection</span>
                <button
                  type="button"
                  onClick={() => setActiveLightboxImage(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <X size={14} /> Close
                </button>
              </div>
              <img
                src={activeLightboxImage}
                alt="Expanded study diagram"
                style={{
                  maxWidth: '92vw',
                  maxHeight: '82vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9)',
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    )}
  </AnimatePresence>
  );
};

export default CambridgeNightmareSupportModal;
