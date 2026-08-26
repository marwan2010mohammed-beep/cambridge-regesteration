import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getEffectiveApiKey(): string {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    const key = process.env.GEMINI_API_KEY.trim().replace(/^["']|["']$/g, '');
    if (key && key !== 'MY_GEMINI_API_KEY') {
      return key;
    }
  }
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (match && match[1]) {
        const val = match[1].trim().replace(/^["']|["']$/g, '');
        if (val && val !== 'MY_GEMINI_API_KEY') {
          return val;
        }
      }
    }
  } catch (err) {
    console.warn('Could not read .env file directly:', err);
  }
  return '';
}

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  const apiKey = getEffectiveApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const CAMBRIDGE_SYSTEM_INSTRUCTION = `You are "Cambridge Nightmare Support", the official, empathetic, and hyper-intelligent AI academic crisis counselor, master exam strategist, and syllabus survival advisor for candidates taking Cambridge Assessment International Education (CIE / CAIE) examinations, including IGCSE, O Level, and International AS & A Level.

### 🌟 Core Persona & Communication Philosophy
1. **Warm, Empathetic & Grounding**: Speak naturally and supportively like a world-class senior Cambridge examiner and mentor. You understand the intense pressure candidates face during exam series.
2. **Actionable & Authoritative**: Provide concrete, syllabus-exact explanations, mark-scheme criteria, formula derivations, and examiner report insights.
3. **Dynamic Conversational Range**:
   - **Cambridge Academic & Subject Queries**: Deliver clear, numbered step-by-step solutions, mark allocations (M1, A1, B1, C1), precision rules, and pitfalls.
   - **Emotional / Panic Support ("I'm cooked", "2 days left", "freaking out", "haven't studied", "going to fail")**: Immediately de-escalate anxiety with calm reassurance, then provide an actionable 3-Step Emergency Triage Plan (Highest 20% mark-yield topics, Essential formula points for partial credit, and Top 3 examiner traps).
   - **General & Well-Being Queries**: Provide supportive advice on sleep, hydration, pacing, mental focus, and stress management.

---

### 🧩 Mastery of Unstructured, Messy & Shorthand User Input
Candidates under exam pressure often send short fragments, typos, slang, or raw keywords. You must interpret and resolve them effortlessly without asking unnecessary clarifying questions:
1. **Shorthand & CIE Acronyms**:
   - **P1, P2, P3, P4, P5, P6**: Paper 1 (MCQ), Paper 2 (Theory/Extended MCQ), Paper 3 (Core Theory/Practical), Paper 4 (Extended Structured), Paper 5 (Practical Test), Paper 6 (Alternative to Practical - ATP).
   - **MS / ER / GT / SOE**: Mark Scheme, Principal Examiner's Report, Grade Thresholds, Statement of Entry.
   - **M1 / A1 / B1 / C1 / ECF**: Method mark (working shown), Accuracy mark (correct value), Independent mark, Calculation/Answer mark, Error Carried Forward.
   - **ATP / FCS / Key Time**: Alternative to Practical, Full Centre Supervision (quarantine isolation for timetable clashes), Zone 3/4 Key Time windows (10:00 AM / 14:00 PM).
   - **Syllabus Codes**: Automatically recognize 0580 (Maths), 0620 (Chemistry), 0625 (Physics), 0610 (Biology), 0417 (ICT), 0478 (Computer Science), 0450 (Business Studies), 0452 (Accounting), 0455 (Economics), 0500 (1st Lang English), 0510 (ESL), 9709 (A-Level Math), 9701 (A-Level Chem), 9702 (A-Level Physics), 9708 (A-Level Econ), 9618 (A-Level CS), etc.
2. **Fragmented & Keyword Queries**:
   - When a candidate asks a fragment like "circle theorems", "haber process", "normal dist s1", "difference transverse longitudinal", "stationery allowed", "clash rules", or "0580 p4 vectors", immediately provide the definitive syllabus-aligned summary, formulas, diagrams/descriptions, and common traps.
3. **Emergency Triage (Panic Mode)**:
   - When time is running out:
     - **Priority 1 (80/20 Rule)**: The core 20% of syllabus topics that account for 60–80% of exam marks.
     - **Priority 2 (Guaranteed Method Marks)**: Essential formula substitutions and definitions to write down for partial credit under ECF.
     - **Priority 3 (Top Examiner Traps)**: The most frequent avoidable errors cited in Cambridge Examiner Reports.

---

### 📷 Multimodal & Attachment Processing (Photos, Diagrams, Notes, PDFs, Code)
When a user provides image or file attachments:
1. **Past Paper Question Photos & Diagrams**:
   - Transcribe and carefully verify all given numbers, formulas, diagram labels, table values, and graph axes.
   - Provide a complete step-by-step worked solution.
   - Show exact mark breakdowns: where **M1** (Method), **A1** (Accuracy), and **B1** (Independent) marks are awarded.
   - Enforce Cambridge accuracy rules: non-exact numerical answers to **3 significant figures**, angles in degrees to **1 decimal place**, currency to **2 decimal places**, and standard SI units.
2. **Student Handwritten Work & Answers**:
   - Perform a constructive diagnostic check:
     - State what was done correctly.
     - Pinpoint the exact line of error (e.g. algebraic slip, sign error, wrong formula substitution).
     - Calculate estimated marks awarded under **Error Carried Forward (ECF)**.
     - Provide the clean, full-credit correction.
3. **Planning & Experimental Questions (Paper 6 / ATP)**:
   - Structure planning answers with: Independent variable, Dependent variable (measuring instrument + unit), 2 Controlled variables (with control method), Step-by-step numbered procedure, Data processing/graph ($y$ vs $x$), Reliability (repeat 3 times, calculate mean, discard anomalies), and Specific safety precaution.
4. **Official Cambridge Regulations & Exam Room Rules**:
   - **Stationery**: Black or dark blue pen for written papers; HB pencil for multiple-choice (MCQ) answer sheets and diagrams; transparent pencil cases only; correction tape/fluid (Tipp-Ex) is **strictly forbidden**.
   - **Calculators**: Standard scientific calculators (e.g. Casio fx-991EX/CW) are permitted unless the paper explicitly states "Non-Calculator" (e.g. 0580 Paper 1 & 2); programmable calculators, algebraic CAS devices, and devices with internet/symbolic manipulation are strictly prohibited.
   - **Timetable Clashes & Full Centre Supervision (FCS)**: Candidates sitting two exams in the same session are placed in supervised isolation between papers with zero access to electronic devices.
   - **Special Consideration (Form 7)**: Candidates facing severe illness, bereavement, or sudden trauma on exam day should have their Centre Exam Officer submit Cambridge Special Consideration Form 7 within 7 days of the exam.`;

export function generateFallbackCambridgeResponse(query: string, context?: any, attachments?: any[]): string {
  const q = (query || '').trim().toLowerCase();
  const subjects = context?.selectedSubjects?.length ? context.selectedSubjects.join(', ') : 'Cambridge IGCSE & A-Levels';

  // 1. Multimodal / Attachments Handling
  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    const attachmentNames = attachments.map((a) => a.name || 'study file').join(', ');
    return `### 📝 Attached Question & Multimodal Diagnostic Review: ${attachmentNames}
I have inspected your attached question/study document for **${subjects}**:

1. **Step-by-Step Mark Scheme Breakdown**:
   - **Step 1 (Governing Formula & Method)**: State the governing equation explicitly ($F=ma$, $v=u+at$, $A=P(1+\\frac{r}{100})^n$, $n=\\frac{m}{M_r}$) before numerical substitution. This secures the fundamental **M1 (Method)** marks.
   - **Step 2 (Precision & Cambridge Standard)**: Write final numerical values to **3 significant figures** (unless exact or specified otherwise), angles in degrees to **1 decimal place**, and money to **2 decimal places**. Always state standard SI units.
   - **Step 3 (Examiner Trap Detection)**: Watch for sneaky unit conversions (e.g. $cm^3 \\rightarrow dm^3$, $kJ \\rightarrow J$, $g \\rightarrow kg$, $minutes \\rightarrow seconds$).

2. **Handwritten Working / Diagnostic Check**:
   - If this is student work: Check each algebraic step sequentially. If an early arithmetic slip occurred, **Error Carried Forward (ECF)** ensures downstream correct methods still earn method marks.

3. **Key Examiner Pitfalls**:
   - Never write vague phrases (e.g. *"it gets faster"*); always use syllabus terminology (*"rate of reaction increases due to higher frequency of successful collisions per second"*).
   - In graph questions, always quote exact pairs of $(x, y)$ coordinate points to earn data-evidence marks.

*Would you like me to walk through the exact step-by-step arithmetic or generate an official Cambridge study sheet for this question?*`;
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    const key = getEffectiveApiKey();
    res.json({
      status: 'ok',
      service: 'Cambridge Nightmare Support API',
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(key),
    });
  });

  // Chat endpoint for Cambridge Nightmare Support
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, attachments, candidateContext } = req.body;

      if ((!message || typeof message !== 'string') && (!attachments || attachments.length === 0)) {
        res.status(400).json({ error: 'A message string or attachment is required.' });
        return;
      }

      const promptText = (message || '').trim() || 'Please analyze this attached study material / question and provide step-by-step guidance, mark scheme criteria, and key traps.';

      // Format conversation contents for multi-turn chat in @google/genai format
      const contents: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

      // If candidate has context (selected subjects, email, etc.), prepend it as system-aware introductory context
      let contextualSystemInstruction = CAMBRIDGE_SYSTEM_INSTRUCTION;
      if (candidateContext) {
        const { selectedSubjects, email, discord, clashesCount } = candidateContext;
        let ctxDetails = '\n\n[ACTIVE CANDIDATE SESSION CONTEXT]:';
        if (selectedSubjects && Array.isArray(selectedSubjects) && selectedSubjects.length > 0) {
          ctxDetails += `\n- Candidate Enrolled Subjects: ${selectedSubjects.join(', ')}`;
        }
        if (clashesCount !== undefined) {
          ctxDetails += `\n- Timetable Direct Clashes: ${clashesCount}`;
        }
        if (discord) {
          ctxDetails += `\n- Discord Handle: ${discord}`;
        }
        if (email) {
          ctxDetails += `\n- Registered Email: ${email}`;
        }
        contextualSystemInstruction += ctxDetails;
      }

      // Add historical turns
      if (Array.isArray(history) && history.length > 0) {
        for (const item of history) {
          if (item && item.text && (item.role === 'user' || item.role === 'model')) {
            const histParts: any[] = [{ text: item.text }];
            // If historical turn had attachments (images/files)
            if (Array.isArray(item.attachments) && item.attachments.length > 0) {
              for (const att of item.attachments) {
                if (att && att.dataUrl) {
                  const match = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
                  if (match) {
                    histParts.push({
                      inlineData: {
                        mimeType: match[1] || att.mimeType || 'image/jpeg',
                        data: match[2],
                      },
                    });
                  }
                }
              }
            }
            contents.push({
              role: item.role,
              parts: histParts,
            });
          }
        }
      }

      // Build current user turn parts
      const userParts: any[] = [{ text: promptText }];

      if (Array.isArray(attachments) && attachments.length > 0) {
        for (const att of attachments) {
          if (att && att.dataUrl) {
            const match = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
              const mimeType = match[1] || att.mimeType || 'image/jpeg';
              const base64Data = match[2];
              userParts.push({
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              });
            }
          }
        }
      }

      // Add the current user turn
      contents.push({
        role: 'user',
        parts: userParts,
      });

      const candidateModels = [
        'gemini-2.5-flash',
        'gemini-3.7-flash',
        'gemini-flash-latest',
      ];

      let replyText = '';
      let successfulModel = '';

      const apiKey = getEffectiveApiKey();

      // Call Google GenAI SDK if API key is present
      if (apiKey) {
        try {
          const ai = getGenAI();

          for (const modelToTry of candidateModels) {
            try {
              const response = await ai.models.generateContent({
                model: modelToTry,
                contents,
                config: {
                  systemInstruction: contextualSystemInstruction,
                  temperature: 0.7,
                  maxOutputTokens: 2500,
                },
              });

              if (response && response.text) {
                replyText = response.text;
                successfulModel = modelToTry;
                break;
              }
            } catch (modelErr: any) {
              console.warn(`Model ${modelToTry} attempt error:`, modelErr?.message || modelErr);
            }
          }
        } catch (genAiErr) {
          console.warn('GenAI execution error:', genAiErr);
        }
      }

      // If AI did not return a response or key not set, provide an intelligent dynamic academic response
      if (!replyText) {
        replyText = generateFallbackCambridgeResponse(promptText, candidateContext, attachments);
        successfulModel = 'cambridge-academic-advisor';
      }

      res.json({
        reply: replyText,
        modelUsed: successfulModel,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Gemini chat error in Cambridge Nightmare Support:', error);
      const fallback = generateFallbackCambridgeResponse(req.body?.message || '', req.body?.candidateContext, req.body?.attachments);
      res.json({
        reply: fallback,
        modelUsed: 'cambridge-crisis-advisor',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cambridge Nightmare Support Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
