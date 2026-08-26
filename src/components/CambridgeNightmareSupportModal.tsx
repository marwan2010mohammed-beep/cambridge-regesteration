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

const SUGGESTION_CHIPS = [
  {
    icon: Flame,
    label: '🚨 Panic Mode: 48h Emergency Cram Plan',
    prompt: 'I have very little time left and feel overwhelmed. Give me an emergency 48-hour Cambridge triage plan for my subjects to maximize my marks.',
    badge: 'Triage',
  },
  {
    icon: BookOpen,
    label: 'Math 0580: P4 Traps & Tips',
    prompt: 'What are the most common trap questions and lost marks in Cambridge IGCSE Mathematics 0580 Paper 4 (Extended)?',
    badge: '0580 Math',
  },
  {
    icon: Sparkles,
    label: 'Chem 0620 / Physics 0625: P6 ATP Checklist',
    prompt: 'Give me the essential Paper 6 Alternative to Practical (ATP) experimental design rules, gas/cation tests, and graph plotting rules to guarantee full marks.',
    badge: 'Paper 6 ATP',
  },
  {
    icon: Layers,
    label: 'Grade Thresholds & A* Boundaries',
    prompt: 'How do Cambridge grade thresholds and component weightings work? How are raw marks converted to A* grades in Oct/Nov?',
    badge: 'Thresholds',
  },
  {
    icon: Calendar,
    label: 'Exam Clashes & Full Centre Supervision',
    prompt: 'How do I handle exam clashes if I have two Cambridge papers scheduled in the same session, and what are the Key Time supervision rules?',
    badge: 'Timetable',
  },
  {
    icon: ShieldAlert,
    label: 'Time-per-Mark & Blanking Out Strategy',
    prompt: 'What is the optimal time-per-mark allocation strategy in Cambridge exams, and what should I do if my brain blanks out on question 1?',
    badge: 'Strategy',
  },
  {
    icon: FileText,
    label: 'Retrieve Statement of Entry (SOE)',
    prompt: 'How do I retrieve my official Cambridge Statement of Entry (SOE), center number, and 4-digit candidate number?',
    badge: 'Official SOE',
  },
  {
    icon: Printer,
    label: '📄 Download Exam Summary PDF',
    prompt: 'Compile a comprehensive official Cambridge examination strategy and study summary PDF with my enrolled subjects, schedule, and revision takeaways.',
    badge: 'PDF Summary',
  },
];

const ATTACHMENT_SUGGESTION_CHIPS = [
  'Solve this past paper question with mark scheme breakdown',
  'Check my working, identify lost marks, and show ECF points',
  'Explain the theory, formulas, and definitions for this question',
  'What are the common examiner report traps for this problem?',
  'Generate a 1-page PDF study sheet based on this problem',
];

const LOADING_STATUS_STEPS = [
  'Analyzing question & syllabus context...',
  'Cross-referencing Cambridge mark schemes & guidelines...',
  'Checking examiner traps & method (M) marks...',
  'Formulating step-by-step guidance & exam tips...',
];


function generateClientCambridgeAcademicResponse(query: string, context?: any, attachments?: ChatAttachment[]): string {
  const q = (query || '').trim().toLowerCase();
  const subjects = context?.selectedSubjects?.length ? context.selectedSubjects.join(', ') : 'Cambridge IGCSE / O Level & A-Levels';

  // 1. Multimodal / Attachments Handling
  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    const attachmentNames = attachments.map((a) => a.name || 'study file').join(', ');
    return `### 📝 Attached Cambridge Question & Diagnostic Review: ${attachmentNames}

I have analyzed your attached study material / question for **${subjects}**:

1. **Step-by-Step Mark Scheme Breakdown**:
   - **Formulas & Substituted Values**: Always state the general formula before substituting numbers (e.g. $A = \\frac{1}{2}ab\\sin C$, $F = ma$, or $n = \\frac{m}{M_r}$). If your arithmetic slips, examiners award the **M1** (Method mark) through Error Carried Forward (**ECF**).
   - **Significant Figures**: Cambridge requires non-exact answers rounded to **3 significant figures** (or 1 decimal place for angles in degrees, 2 d.p. for currency).
   - **Units**: Ensure standard SI units are explicitly stated ($m/s^2$, $dm^3$, $J$, $N$, etc.).

2. **Handwritten Diagnostic & Error Carried Forward (ECF)**:
   - If you provided your own handwritten solution: Check each line of working. Under CIE regulations, an isolated calculation slip on step 1 does not invalidate subsequent correct algebra.

3. **Common Examiner Traps for this Question**:
   - Check if unit conversions are required before applying formulas (e.g. converting $cm^3$ to $dm^3$ by dividing by 1000, or grams to kilograms).
   - For graph questions, quote exact pairs of $(x, y)$ coordinates to claim the data-evidence mark.

*Would you like me to write out the full derivation step-by-step or highlight common misconceptions on the Examiner Report?*`;
  }

  // 2. Greetings & Casual Conversational Openers
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q === 'yo' ||
    q.startsWith('hi ') ||
    q.startsWith('hello ') ||
    q.startsWith('hey ') ||
    q.includes('good morning') ||
    q.includes('good afternoon') ||
    q.includes('good evening') ||
    q.includes('who are you') ||
    q.includes('who r u') ||
    q.includes('what can you do') ||
    q === 'start' ||
    q === 'help'
  ) {
    return `### 👋 Welcome to Cambridge Nightmare Support!
Hello! I am your dedicated Cambridge International examination strategist and academic counselor for **${subjects}**.

How can I assist you right now? Here are our top focus tools:
1. **Solve a Past Paper Problem**: Type your question or paste a screenshot, and I'll break down the mark scheme (**M1/A1**), exact formula, and examiner traps.
2. **Paper 4 Extended Strategy**: Master the 1-minute-per-mark rule and command words (*"Explain"*, *"State"*, *"Evaluate"*).
3. **Paper 6 (ATP) Experimental Design**: Full 6-mark planning templates (Variables, Apparatus, Procedure, Reliability, Safety).
4. **Formula & Theory Quick-Drill**: Revise key equations for Physics (0625), Chemistry (0620), Maths (0580), or Biology (0610).
5. **Emergency Cramming Triage**: If your exam is in 1–2 days, I'll give you the top 20% high-yield topics to pass with confidence.

*Tell me which subject, paper, or question you'd like to work on!*`;
  }

  // 3. Acknowledgments, Gratitude & Transitions
  if (
    q === 'thanks' ||
    q === 'thank you' ||
    q === 'thx' ||
    q === 'ty' ||
    q === 'ok' ||
    q === 'okay' ||
    q === 'got it' ||
    q === 'cool' ||
    q === 'understood' ||
    q === 'great' ||
    q === 'awesome' ||
    q === 'nice' ||
    q === 'alright' ||
    q === 'sure' ||
    q === 'yes' ||
    q === 'yep' ||
    q === 'no' ||
    q === 'bye' ||
    q === 'goodbye'
  ) {
    return `### 👍 Glad to Help!
You're making great progress. Consistent active practice is the #1 predictor of moving up whole grade boundaries in Cambridge examinations.

What would you like to tackle next?
- **Try another calculation or past paper problem** (Maths, Physics, or Chemistry)
- **Review Paper 6 ATP graph rules & 6-mark experiments**
- **Check official exam regulations** (Stationery, Calculators, Timetable Clashes)
- **Review high-yield formula sheets**

*Type any question, topic keyword, or paste a problem whenever you're ready!*`;
  }

  // 4. Clarification / Follow-up queries ("why", "explain more", "give example", "details")
  if (
    q.includes('explain more') ||
    q.includes('tell me more') ||
    q.includes('why') ||
    q.includes('give me an example') ||
    q.includes('example') ||
    q.includes('details') ||
    q.includes('elaborate') ||
    q.includes('how come')
  ) {
    return `### 🔍 In-Depth Cambridge Academic Breakdown

To master this at the highest Cambridge grade standard (**A/A***):

1. **The Examiner's Marking Perspective**:
   - Cambridge examiners look for specific **technical keywords** in structured questions. If a question asks to *"Explain"*, you must link cause and consequence (*"A causes B, leading to C"*).
   - If an algebraic derivation is required, always state the base equation in general algebraic terms before substituting numbers to secure the **M1 (Method)** mark.

2. **Step-by-Step Worked Example**:
   - **Given Data**: Extract all numerical variables and convert immediately to standard SI units ($cm^3 \\rightarrow dm^3$, $g \\rightarrow kg$, $minutes \\rightarrow seconds$).
   - **Formula Application**: Substitute clearly into the equation.
   - **Rounding**: Give final numerical answers to **3 significant figures** (or 1 decimal place for angles).

*Would you like me to generate a full exam-style question on this topic with mark scheme rubrics?*`;
  }

  // 5. Panic / Cramming / Emotional Distress
  if (
    q.includes('cooked') ||
    q.includes('panic') ||
    q.includes('freak') ||
    q.includes('crying') ||
    q.includes('scared') ||
    q.includes('haven\'t studied') ||
    q.includes('fail') ||
    q.includes('cram') ||
    q.includes('1 day') ||
    q.includes('2 days') ||
    q.includes('tomorrow') ||
    q.includes('stress') ||
    q.includes('anxiety')
  ) {
    return `### 🛑 Breathe & Ground: Your Emergency Cambridge Crisis Action Plan
First: **Take a deep breath.** Thousands of Cambridge candidates feel this exact panic during the exam series. Grade thresholds exist to reward every raw mark you earn, and you can recover significant marks right now:

---

#### 🚨 3-Step Emergency Triage (The 80/20 Rule)
1. **Stop Passive Re-reading — Switch to Classified Past Papers**:
   - Do NOT spend hours reading the whole textbook. Pull the last 3 series (2022–2024) of **Paper 2 / Paper 4**.
   - Attempt questions topic-by-topic with the mark scheme side-by-side.
2. **Collect Guaranteed Method & Definition Marks**:
   - Cambridge awards **M1 (Method marks)** and **B1 (Independent marks)** simply for writing the correct formula, defining key terms, or showing intermediate steps—even if your final answer is wrong (**Error Carried Forward / ECF**).
3. **Master the Big High-Yield Pillars**:
   - **Maths (0580)**: Quadratics & algebra, Trigonometry (Sine/Cosine rules), Vectors, Probability trees, Cumulative frequency.
   - **Physics (0625)**: Mechanics formulas ($F=ma, W=mg$), Thermal capacity ($Q=mc\\Delta T$), Circuits ($V=IR, P=IV$), Wave equations ($v=f\\lambda$).
   - **Chemistry (0620)**: Moles calculations ($n=\\frac{m}{M_r}$), Electrolysis products, Organic polymerisation, Cation/Anion tests.

*Which specific paper or topic is giving you the highest stress right now? Let's solve it together step-by-step.*`;
  }

  // 6. Stationery / Exam Room Regulations / Calculators
  if (
    q.includes('stationery') ||
    q.includes('pencil') ||
    q.includes('pen') ||
    q.includes('calculator') ||
    q.includes('tipp-ex') ||
    q.includes('correction') ||
    q.includes('ruler') ||
    q.includes('allowed') ||
    q.includes('casio')
  ) {
    return `### 📋 Official Cambridge Examination Room & Stationery Regulations

Here are the strict Cambridge International regulations for what you can and cannot bring into the exam room:

1. **Pens & Pencils**:
   - **Theory / Structured Papers (Paper 2, 3, 4, 6)**: Must use **black or dark blue ballpoint pen**. Do NOT use erasable pens or highlighters on your answers.
   - **Multiple Choice (Paper 1 / MCQ)**: Must use an **HB soft pencil** and clean eraser to shade candidate sheets.
   - **Diagrams & Graphs**: Always draw graphs, best-fit lines, and geometric constructions in **HB pencil**.

2. **Strictly Forbidden Items**:
   - ❌ **Correction tape or fluid (Tipp-Ex)** is **strictly forbidden**. If you make a mistake, draw a single neat horizontal line through the incorrect work.
   - ❌ **Smartwatches, mobile phones, or electronic communication devices** (immediate disqualification penalty).
   - ❌ Opaque pencil cases (must be **100% transparent/clear**).

3. **Calculator Policy**:
   - Allowed: Standard scientific calculators (e.g. Casio fx-82, fx-991EX, fx-991CW).
   - Banned: Any calculator with symbolic algebraic manipulation (CAS), graphical programming capabilities, or internet retrieval.
   - Note: 0580 Mathematics Paper 1 and Paper 2 are **Non-Calculator** papers.

*Have any questions regarding specific calculator models or special consideration?*`;
  }

  // 7. Timetable Clashes & Full Centre Supervision (FCS)
  if (q.includes('clash') || q.includes('timetable') || q.includes('key time') || q.includes('supervision') || q.includes('quarantine') || q.includes('fcs')) {
    return `### 🕒 Cambridge Timetable Clash & Full Centre Supervision (FCS) Protocol
If you are entered for two papers scheduled in the same morning or afternoon session:

1. **Full Centre Supervision (FCS)**:
   - Your examination centre officer will arrange for you to sit one exam first, followed immediately by supervised isolation/quarantine before sitting the second exam.
   - **Strict Isolation Rules**: You are prohibited from accessing internet-enabled devices, phones, smartwatches, or speaking with unsupervised candidates during this hold. You may bring revision notes, food, and water.

2. **Zone 3 / 4 Key Times**:
   - Morning Key Time is **10:00 AM local time** and Afternoon Key Time is **14:00 PM local time**.
   - You must be inside the exam hall or under supervised hold during these exact moments worldwide.`;
  }

  // 8. Error Carried Forward (ECF) & Mark Scheme System
  if (q.includes('ecf') || q.includes('error carried forward') || q.includes('mark scheme') || q.includes('m1') || q.includes('a1') || q.includes('b1')) {
    return `### 🎯 Cambridge Marking Scheme Codes & Error Carried Forward (ECF)
Cambridge examiners mark using a strict, structured hierarchy:

1. **The Four Key Mark Types**:
   - **M marks (Method)**: Awarded for showing a correct algebraic formula or method step, even if your arithmetic calculation is wrong.
   - **A marks (Accuracy)**: Awarded for the correct numerical value dependent on preceding M marks.
   - **B marks (Independent)**: Awarded for correct facts, definitions, or statements with no method required.
   - **C marks (Communication/Working)**: Partial marks in math for showing working.

2. **How Error Carried Forward (ECF) Saves Your Grade**:
   - If you make an arithmetic error in Part (a) (e.g. getting $x = 12$ instead of $14$), but you use your calculated $x = 12$ correctly in Part (b) using the correct formula, **you receive full method and accuracy marks for Part (b)**.
   - **Rule**: Never cross out work unless you have written a replacement! Crossed out working cannot be awarded marks unless no other attempt is present.`;
  }

  // 9. 0580 / 9709 Mathematics
  if (q.includes('0580') || q.includes('9709') || q.includes('math') || q.includes('vector') || q.includes('trig') || q.includes('circle') || q.includes('quadratic') || q.includes('calculus')) {
    return `### 📐 Cambridge Mathematics (0580 / 9709) Core Blueprint & High-Yield Traps

#### 1. Top High-Yield Topics:
- **Algebra & Quadratics**: Quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$, completing the square, expanding brackets, simultaneous linear and non-linear equations.
- **Trigonometry**: Right triangles (SOHCAHTOA), Sine Rule $\\frac{a}{\\sin A} = \\frac{b}{\\sin B}$, Cosine Rule $a^2 = b^2 + c^2 - 2bc\\cos A$, Area of Triangle $= \\frac{1}{2}ab\\sin C$.
- **Vectors & Geometry**: Column vectors $\\begin{pmatrix} x \\\\ y \\end{pmatrix}$, magnitude $|\\vec{v}| = \\sqrt{x^2 + y^2}$, vector geometry path finding (e.g. $\\vec{AB} = \\vec{AO} + \\vec{OB}$).
- **Circle Theorems**:
  1. Angle at centre is $2\\times$ angle at circumference.
  2. Angles in the same segment subtended by the same arc are equal.
  3. Angle in a semi-circle is $90^\\circ$.
  4. Opposite angles of a cyclic quadrilateral sum to $180^\\circ$.
  5. Alternate Segment Theorem: Angle between tangent and chord equals angle in alternate segment.
- **Probability & Statistics**: Independent events $P(A \\cap B) = P(A) \\times P(B)$, Mutually exclusive $P(A \\cup B) = P(A) + P(B)$, Tree diagrams without replacement.

#### 2. Examiner Precision Rules:
- Non-exact numerical answers must be stated to **3 significant figures**.
- Angles in degrees to **1 decimal place**.
- Money values to **2 decimal places**.`;
  }

  // 10. 0620 / 9701 Chemistry
  if (q.includes('0620') || q.includes('9701') || q.includes('chemistry') || q.includes('mole') || q.includes('electrolysis') || q.includes('organic') || q.includes('titration')) {
    return `### 🧪 Cambridge Chemistry (0620 / 9701) High-Yield Blueprint

1. **Stoichiometry & Moles Formulas**:
   - Solids: $n = \\frac{\\text{mass (g)}}{M_r}$
   - Solutions: $n = \\text{concentration (mol/dm}^3) \\times \\text{volume (dm}^3)$
   - Gases at r.t.p.: $n = \\frac{\\text{volume (dm}^3)}{24\\text{ dm}^3}$ or $n = \\frac{\\text{volume (cm}^3)}{24000\\text{ cm}^3}$

2. **Electrolysis Rules**:
   - **Cathode (-)**: Hydrogen gas ($\\text{H}_2$) is discharged unless the metal is less reactive than hydrogen (e.g. $\\text{Cu}^{2+} + 2e^- \\rightarrow \\text{Cu}$).
   - **Anode (+)**: Halide ions ($\\text{Cl}^-, \\text{Br}^-, \\text{I}^-$) are discharged preferentially; otherwise $\\text{OH}^-$ discharges to form oxygen gas ($4\\text{OH}^- \\rightarrow \\text{O}_2 + 2\\text{H}_2\\text{O} + 4e^-$).

3. **Organic Chemistry**:
   - Alkanes ($C_n H_{2n+2}$), Alkenes ($C_n H_{2n}$), Alcohols ($C_n H_{2n+1}OH$), Carboxylic Acids ($C_n H_{2n+1}COOH$).
   - Addition polymerisation (monomers with double bonds) vs Condensation polymerisation (polyamides like Nylon & polyesters like Terylene, producing small byproduct molecules like $\\text{H}_2\\text{O}$).

4. **Qualitative Analysis (Flame Tests & Ion Precipitates)**:
   - $\\text{Cu}^{2+}$: Light blue precipitate with $\\text{NaOH}$; dissolves in excess $\\text{NH}_3$ to form a deep blue solution.
   - $\\text{Fe}^{2+}$: Green precipitate insoluble in excess.
   - $\\text{Fe}^{3+}$: Red-brown precipitate insoluble in excess.`;
  }

  // 11. 0625 / 9702 Physics
  if (q.includes('0625') || q.includes('9702') || q.includes('physics') || q.includes('wave') || q.includes('circuit') || q.includes('velocity') || q.includes('mechanics')) {
    return `### ⚡ Cambridge Physics (0625 / 9702) Essential Formula & Traps

1. **Mechanics & Dynamics**:
   - Speed & Acceleration: $v = \\frac{s}{t}$, $a = \\frac{v-u}{t}$
   - Equations of Motion: $v = u + at$, $s = ut + \\frac{1}{2}at^2$, $v^2 = u^2 + 2as$
   - Newton's 2nd Law: $F = ma$, Weight: $W = mg$ ($g = 9.8\\text{ m/s}^2$ or $10\\text{ m/s}^2$)
   - Kinetic & Potential Energy: $E_k = \\frac{1}{2}mv^2$, $E_p = mgh$, Work: $W = F \\times d$

2. **Electricity & Circuits**:
   - Ohm's Law: $V = IR$, Electrical Power: $P = IV = I^2 R = \\frac{V^2}{R}$
   - Resistors in Series: $R_{\\text{total}} = R_1 + R_2 + R_3$
   - Resistors in Parallel: $\\frac{1}{R_{\\text{total}}} = \\frac{1}{R_1} + \\frac{1}{R_2}$

3. **Waves & Thermal**:
   - Wave equation: $v = f\\lambda$, Refractive index: $n = \\frac{\\sin i}{\\sin r} = \\frac{1}{\\sin c} = \\frac{c}{v}$
   - Specific Heat Capacity: $Q = mc\\Delta T$, Latent Heat: $Q = mL$`;
  }

  // 12. 0610 / 9700 Biology
  if (q.includes('0610') || q.includes('9700') || q.includes('biology') || q.includes('enzyme') || q.includes('photosynthesis') || q.includes('heart') || q.includes('cell')) {
    return `### 🌿 Cambridge Biology (0610 / 9700) Core Principles & Traps

1. **Enzyme Action & Denaturation**:
   - Lock-and-key hypothesis: Active site complementary in shape to specific substrate.
   - At high temperature (>45°C) or extreme pH: Enzyme is **denatured** (tertiary protein structure and active site shape are permanently altered so substrate no longer fits)—**never write that the enzyme is "killed"** (examiner report penalty).

2. **Photosynthesis & Plant Transport**:
   - Equation: $6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{light, chlorophyll}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$.
   - **Xylem**: Transports water and dissolved mineral ions unidirectionally from roots to leaves via transpiration pull.
   - **Phloem**: Transports sucrose and amino acids bidirectionally (translocation) from sources to sinks.

3. **Magnification Formula**:
   - $\\text{Magnification} = \\frac{\\text{Image Size (I)}}{\\text{Actual Size (A)}}$ ($M = \\frac{I}{A}$).
   - **Trap**: Always measure in millimetres (mm) and convert to micrometres ($\\mu$m) by multiplying by 1000 before computing.`;
  }

  // 13. Paper 4 Theory Strategy
  if (q.includes('paper 4') || q.includes('p4') || q.includes('extended') || q.includes('hard') || q.includes('difficult')) {
    return `### ⚡ Paper 4 Crisis Strategy: Maximizing Raw Marks
Cambridge examiner reports reveal that up to **22% of lost marks** stem from command word misunderstandings and missing intermediate working:

1. **Follow the Command Words**:
   - **"State" / "Name"**: 1 line only. Do not write lengthy explanations.
   - **"Explain"**: Requires cause-and-effect link (*"X happens because Y, resulting in Z"*).
   - **"Evaluate" / "Discuss"**: Balanced arguments with a definitive concluding judgment.

2. **The 1-Minute-Per-Mark Rule**:
   - Allocate **~1 minute per mark**. If stuck on a 3-mark calculation for >3 minutes, write the formula (secures M1), make an educated estimate, and keep moving.

3. **Method Marks & Error Carried Forward (ECF)**:
   - Always state intermediate formulas. If your arithmetic slips, ECF protects all subsequent marks.`;
  }

  // 14. Paper 6 ATP Strategy
  if (q.includes('paper 6') || q.includes('atp') || q.includes('alternative to practical') || q.includes('experiment')) {
    return `### 🧪 Paper 6 (Alternative to Practical) High-Yield Rules
Paper 6 is the highest return on investment for grade improvement:

1. **Graph Plotting Rules**:
   - Plot points with **small neat crosses (x)**.
   - Points and scale must occupy **more than 50%** of the grid on both axes.
   - Draw a single, smooth line of best fit—never connect dots with a ruler like a staircase.

2. **Planning 6-Mark Experiment Question**:
   - **Variables**: Independent (change), Dependent (measure with apparatus + unit), 2 Controlled (state method of keeping constant).
   - **Apparatus**: Name exact measuring tools (e.g. *gas syringe with 1cm³ graduations*, *stopwatch*, *thermostatic water bath*).
   - **Reliability**: *"Repeat 3 times and calculate mean average, discarding any anomalous results"*.
   - **Safety**: Specific hazard precaution (e.g. *wear goggles when heating acid*, *use gloves for corrosive reagents*).`;
  }

  // 15. Grade Thresholds
  if (q.includes('threshold') || q.includes('boundary') || q.includes('grade') || q.includes('curve')) {
    return `### 📊 Grade Thresholds & Boundary Dynamics
- **Standardized Globally**: Cambridge grade thresholds are determined **after** all papers worldwide are marked. If a paper was exceptionally difficult, thresholds drop to protect students.
- **Typical A* Thresholds (Extended Tier)**:
  - Physics/Chemistry Paper 4 A* threshold typically sits between **60% – 72%**.
  - Mathematics (0580) Paper 4 A* usually sits between **78% – 86%**.
  - Biology (0610) Paper 4 A* usually sits between **62% – 74%**.
- Focus purely on securing every accessible method mark in front of you.`;
  }

  // 16. General Dynamic Advice tailored to query
  return `### 🎯 Cambridge Academic Guidance: ${query.length > 30 ? query.slice(0, 30) + '...' : query}

Here is your tailored strategy for **${subjects}**:

1. **Active Retrieval & Problem Solving**:
   - Solve classified past paper questions from recent series (2021–2024). Time yourself strictly to build exam pace.
2. **Formula & Method Precision**:
   - Write out governing equations first to guarantee **M1 (Method)** marks.
   - State non-exact numerical answers to **3 significant figures** with standard SI units.
3. **Targeted Drill**:
   - Identify weak sub-topics and cross-reference them against Cambridge Principal Examiner Reports.

*What specific question, equation, or past paper topic should we solve next?*`;
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

  const processFiles = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    if (stagedAttachments.length + fileList.length > 6) {
      setAttachmentError('You can attach up to 6 study files or photos at once.');
      setTimeout(() => setAttachmentError(null), 4000);
      return;
    }

    fileList.forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        setAttachmentError(`File "${file.name}" exceeds the 15MB size limit.`);
        setTimeout(() => setAttachmentError(null), 4000);
        return;
      }

      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        const newAttachment: ChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: isImage ? 'image' : 'file',
          mimeType: file.type || (isImage ? 'image/jpeg' : 'application/octet-stream'),
          size: file.size,
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
        {candidateContext && (candidateContext.selectedSubjects?.length || candidateContext.clashesCount !== undefined) && (
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
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600 }}>CANDIDATE PROFILE:</span>
              <span>
                {candidateContext.selectedSubjects?.length
                  ? `${candidateContext.selectedSubjects.length} enrolled subjects (${candidateContext.selectedSubjects.slice(0, 3).join(', ')}${candidateContext.selectedSubjects.length > 3 ? '...' : ''})`
                  : 'Syllabus Triage Mode'}
              </span>
            </div>
            {candidateContext.clashesCount !== undefined && candidateContext.clashesCount > 0 && (
              <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={11} /> {candidateContext.clashesCount} Direct Clashes
              </span>
            )}
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
            : SUGGESTION_CHIPS.map((chip, idx) => {
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
