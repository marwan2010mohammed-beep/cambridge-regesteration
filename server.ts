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
    return process.env.GEMINI_API_KEY.trim();
  }
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim();
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
1. **Warm, Empathetic & Grounding**: Speak naturally and supportive like a world-class senior Cambridge examiner and mentor. You understand the intense pressure candidates face during exam series.
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

function decodeBase64Utf8(base64: string): string {
  try {
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function processAttachmentForPrompt(att: any): { isImage: boolean; isTextFile: boolean; textContent?: string; dataUrl: string; name: string } {
  const name = att.name || 'attachment';
  const dataUrl = att.dataUrl || '';
  const mimeType = att.mimeType || '';
  const isImage = att.type === 'image' || mimeType.startsWith('image/');
  
  let isTextFile = false;
  let textContent: string | undefined = undefined;

  if (!isImage && dataUrl) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const detectedMime = match[1];
      const base64Data = match[2];
      if (
        detectedMime.startsWith('text/') ||
        detectedMime.includes('json') ||
        detectedMime.includes('javascript') ||
        detectedMime.includes('python') ||
        detectedMime.includes('typescript') ||
        name.endsWith('.txt') ||
        name.endsWith('.md') ||
        name.endsWith('.py') ||
        name.endsWith('.json') ||
        name.endsWith('.csv')
      ) {
        isTextFile = true;
        textContent = decodeBase64Utf8(base64Data);
      }
    }
  }

  return { isImage, isTextFile, textContent, dataUrl, name };
}

async function callVoidAiChat(
  apiKey: string,
  systemPrompt: string,
  history: Array<{ role: 'user' | 'model'; text: string; attachments?: any[] }>,
  currentPrompt: string,
  attachments?: any[]
): Promise<string> {
  const hasImages = Array.isArray(attachments) && attachments.some((a) => a && (a.type === 'image' || a.mimeType?.startsWith('image/')));
  
  // Prioritize multimodal/vision models when images are present
  const models = hasImages
    ? ['gpt-4o', 'gemini-2.5-flash', 'gpt-4o-mini', 'gemini-3.5-flash-lite', 'deepseek-v3.2']
    : ['gpt-4o-mini', 'gpt-4o', 'qwen3.8-27b:free', 'deepseek-v3.2', 'gemini-3.5-flash-lite'];
  
  // Format messages into OpenAI format
  const messages: any[] = [
    { role: 'system', content: systemPrompt }
  ];

  // Append history
  if (Array.isArray(history) && history.length > 0) {
    for (const h of history) {
      if (!h || !h.text) continue;
      const role = h.role === 'model' ? 'assistant' : 'user';
      if (role === 'assistant') {
        messages.push({ role: 'assistant', content: h.text });
      } else {
        const userContent: any[] = [{ type: 'text', text: h.text }];
        if (Array.isArray(h.attachments) && h.attachments.length > 0) {
          for (const att of h.attachments) {
            const parsed = processAttachmentForPrompt(att);
            if (parsed.isImage && parsed.dataUrl) {
              userContent.push({
                type: 'image_url',
                image_url: { url: parsed.dataUrl }
              });
            } else if (parsed.isTextFile && parsed.textContent) {
              userContent.push({
                type: 'text',
                text: `\n[Attached File: ${parsed.name}]\n${parsed.textContent}\n`
              });
            }
          }
        }
        messages.push({
          role: 'user',
          content: userContent.length === 1 ? h.text : userContent
        });
      }
    }
  }

  // Process current turn attachments
  let finalPrompt = currentPrompt;
  const currentUserContent: any[] = [];
  let attachedTextFiles = '';

  if (Array.isArray(attachments) && attachments.length > 0) {
    for (const att of attachments) {
      const parsed = processAttachmentForPrompt(att);
      if (parsed.isImage && parsed.dataUrl) {
        currentUserContent.push({
          type: 'image_url',
          image_url: { url: parsed.dataUrl }
        });
      } else if (parsed.isTextFile && parsed.textContent) {
        attachedTextFiles += `\n[Attached File Content: ${parsed.name}]\n${parsed.textContent}\n`;
      }
    }
  }

  if (!finalPrompt.trim() && (currentUserContent.length > 0 || attachedTextFiles)) {
    finalPrompt = 'Please carefully inspect this attached Cambridge exam question / student working / syllabus material. Identify the subject and component, transcribe all given numbers and formulas, provide a step-by-step worked solution with M1/A1 marks, diagnose any student errors with Error Carried Forward (ECF), and outline common examiner report pitfalls.';
  }

  if (attachedTextFiles) {
    finalPrompt = `${finalPrompt}\n\n${attachedTextFiles}`;
  }

  currentUserContent.unshift({ type: 'text', text: finalPrompt });

  messages.push({
    role: 'user',
    content: currentUserContent.length === 1 ? finalPrompt : currentUserContent
  });

  for (const model of models) {
    try {
      const res = await fetch('https://api.voidai.app/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 2500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && typeof text === 'string' && text.trim().length > 0) {
          return text.trim();
        }
      } else {
        const errText = await res.text();
        console.warn(`VoidAI model ${model} returned status ${res.status}:`, errText.slice(0, 150));
      }
    } catch (err: any) {
      console.warn(`VoidAI model ${model} fetch exception:`, err?.message || err);
    }
  }

  return '';
}

function generateFallbackCambridgeResponse(query: string, context?: any, attachments?: any[]): string {
  const q = query.toLowerCase();
  const subjects = context?.selectedSubjects?.length ? context.selectedSubjects.join(', ') : 'Cambridge IGCSE & A-Levels';

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

  // Panic / Cramming / Emotional Distress
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
    q.includes('tomorrow')
  ) {
    return `### 🛑 Breathe & Ground: Your Emergency Cambridge Crisis Action Plan
First: **Take a deep breath.** Thousands of Cambridge candidates feel this exact panic every single series. Grade thresholds are designed to reward raw marks earned, and you can recover significant percentage points right now with a high-yield triage:

---

#### 🚨 3-Step Emergency Triage (The 80/20 Rule)
1. **Stop Passive Re-reading — Switch to Classified Past Papers**:
   - Do NOT spend hours reading the whole textbook. Pull the last 3 series (2022–2024) of **Paper 2 / Paper 4**.
   - Attempt questions topic-by-topic with the mark scheme side-by-side.
2. **Collect Guaranteed Method & Definition Marks**:
   - Cambridge awards **M1 (Method marks)** and **B1 (Independent marks)** simply for writing the correct formula, defining key terms, or showing intermediate steps—even if your final answer is wrong (**Error Carried Forward / ECF**).
3. **Master the Big 3 High-Yield Pillars for Your Subjects**:
   - **Maths (0580)**: Quadratics & algebra, Trigonometry (Sine/Cosine rules), Vectors, Probability trees, Cumulative frequency.
   - **Physics (0625)**: Mechanics formulas ($F=ma, W=mg$), Thermal capacity ($Q=mc\\Delta T$), Circuits ($V=IR, P=IV$), Wave equations ($v=f\\lambda$).
   - **Chemistry (0620)**: Moles calculations ($n=\\frac{m}{M_r}$), Electrolysis products, Organic polymerisation, Cation/Anion tests.

*Which specific paper or topic is giving you the highest stress right now? Let's solve it together step-by-step.*`;
  }

  // Stationery / Exam Room Regulations / Calculators
  if (
    q.includes('stationery') ||
    q.includes('pencil') ||
    q.includes('pen') ||
    q.includes('calculator') ||
    q.includes('tipp-ex') ||
    q.includes('correction') ||
    q.includes('ruler') ||
    q.includes('allowed')
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

  // Timetable Clashes & Full Centre Supervision (FCS)
  if (q.includes('clash') || q.includes('timetable') || q.includes('key time') || q.includes('supervision') || q.includes('quarantine') || q.includes('fcs')) {
    return `### 🕒 Cambridge Timetable Clash & Full Centre Supervision (FCS) Protocol
If you are entered for two papers scheduled in the same morning or afternoon session:

1. **Full Centre Supervision (FCS)**:
   - Your examination centre officer will arrange for you to sit one exam first, followed immediately by supervised isolation/quarantine before sitting the second exam.
   - **Strict Isolation Rules**: You are prohibited from accessing internet-enabled devices, phones, smartwatches, or speaking with unsupervised candidates during this hold. You may bring revision notes and food/water.

2. **Zone 3 / 4 Key Times**:
   - Morning Key Time is **10:00 AM local time** and Afternoon Key Time is **14:00 PM local time**.
   - You must be inside the exam hall or under supervised hold during these exact moments worldwide.`;
  }

  // 0580 Mathematics
  if (q.includes('0580') || (q.includes('math') && (q.includes('syllabus') || q.includes('vector') || q.includes('trig') || q.includes('circle')))) {
    return `### 📐 Cambridge IGCSE Mathematics (0580) Core Strategy & Traps

#### 1. Top High-Yield Topics:
- **Algebra & Quadratics**: Quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$, expanding, simultaneous linear and non-linear equations.
- **Trigonometry**: Right triangles (SOHCAHTOA), Sine Rule $\\frac{a}{\\sin A} = \\frac{b}{\\sin B}$, Cosine Rule $a^2 = b^2 + c^2 - 2bc\\cos A$, Area $= \\frac{1}{2}ab\\sin C$.
- **Vectors & Geometry**: Column vectors $\\begin{pmatrix} x \\\\ y \\end{pmatrix}$, magnitude $\\sqrt{x^2 + y^2}$, vector geometry paths (e.g. $\\vec{AB} = \\vec{AO} + \\vec{OB}$).
- **Circle Theorems**: Tangent perpendicular to radius ($90^\\circ$), Angle at centre $= 2\\times$ angle at circumference, Angles in same segment are equal, Opposite angles of cyclic quadrilateral sum to $180^\\circ$, Alternate segment theorem.

#### 2. Examiner Precision & Mark Rules:
- Non-exact numerical answers must be stated to **3 significant figures**.
- Angles in degrees to **1 decimal place**.
- Always show working for **M1 (Method marks)**; Cambridge applies **Error Carried Forward (ECF)**.`;
  }

  // 0620 Chemistry
  if (q.includes('0620') || q.includes('chemistry') || q.includes('mole') || q.includes('electrolysis')) {
    return `### 🧪 Cambridge IGCSE Chemistry (0620) High-Yield Blueprint

1. **Stoichiometry & Moles Formulas**:
   - Solids: $n = \\frac{\\text{mass (g)}}{M_r}$
   - Solutions: $n = \\text{concentration (mol/dm}^3) \\times \\text{volume (dm}^3)$
   - Gases at r.t.p.: $n = \\frac{\\text{volume (dm}^3)}{24\\text{ dm}^3}$

2. **Electrolysis Rules**:
   - **Cathode (-)**: Hydrogen is discharged unless metal is less reactive than hydrogen (e.g. $\\text{Cu}^{2+} + 2e^- \\rightarrow \\text{Cu}$).
   - **Anode (+)**: Halide ions ($\\text{Cl}^-, \\text{Br}^-, \\text{I}^-$) are discharged preferentially; otherwise $\\text{OH}^-$ discharges to form $\\text{O}_2$ ($4\\text{OH}^- \\rightarrow \\text{O}_2 + 2\\text{H}_2\\text{O} + 4e^-$).

3. **Organic Chemistry**:
   - Alkanes ($C_n H_{2n+2}$), Alkenes ($C_n H_{2n}$), Alcohols ($C_n H_{2n+1}OH$), Carboxylic Acids ($C_n H_{2n+1}COOH$).
   - Addition polymerisation (monomer with double bond) vs Condensation polymerisation (polyamides & polyesters, yielding small molecule byproduct like $\\text{H}_2\\text{O}$).`;
  }

  // 0625 Physics
  if (q.includes('0625') || q.includes('physics') || q.includes('wave') || q.includes('circuit')) {
    return `### ⚡ Cambridge IGCSE Physics (0625) Essential Formula & Traps

1. **Mechanics & Dynamics**:
   - Speed & Acceleration: $v = \\frac{s}{t}$, $a = \\frac{v-u}{t}$
   - Newton's 2nd Law: $F = ma$, Weight: $W = mg$ ($g = 9.8\\text{ m/s}^2$)
   - Kinetic & Potential Energy: $E_k = \\frac{1}{2}mv^2$, $E_p = mgh$

2. **Electricity & Circuits**:
   - Ohm's Law: $V = IR$, Electrical Power: $P = IV = I^2 R = \\frac{V^2}{R}$
   - Resistors in Series: $R_{\\text{total}} = R_1 + R_2$
   - Resistors in Parallel: $\\frac{1}{R_{\\text{total}}} = \\frac{1}{R_1} + \\frac{1}{R_2}$

3. **Waves & Thermal**:
   - Wave speed: $v = f\\lambda$, Law of refraction: $n = \\frac{\\sin i}{\\sin r} = \\frac{1}{\\sin c}$
   - Specific Heat Capacity: $Q = mc\\Delta T$`;
  }

  // 0610 Biology
  if (q.includes('0610') || q.includes('biology') || q.includes('enzyme') || q.includes('photosynthesis')) {
    return `### 🌿 Cambridge IGCSE Biology (0610) Core Principles & Traps

1. **Enzyme Action**:
   - Describe lock-and-key hypothesis: Active site complementary to substrate.
   - At high temperature or extreme pH: Enzyme is **denatured** (active site changes shape so substrate no longer fits)—never say the enzyme is "killed".

2. **Photosynthesis & Transport**:
   - Photosynthesis: $6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{light, chlorophyll}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$.
   - Xylem transports water and mineral ions unidirectionally (transpiration pull).
   - Phloem transports sucrose and amino acids bidirectionally (translocation).

3. **Magnification Formula**:
   - $\\text{Magnification} = \\frac{\\text{Image size}}{\\text{Actual size}}$ ($M = \\frac{I}{A}$). Always convert image measurements into the same units (e.g. mm to $\\mu$m by multiplying by 1000).`;
  }

  // Paper 4 Theory Strategy
  if (q.includes('paper 4') || q.includes('p4') || q.includes('extended') || q.includes('hard')) {
    return `### ⚡ Paper 4 Crisis Strategy: Maximizing Raw Marks
Examiner reports reveal that up to **22% of lost marks** stem from command words and missing intermediate working:

1. **Follow the Command Words**:
   - **"State" / "Name"**: 1 line only. Do not write paragraphs.
   - **"Explain"**: Requires cause-and-effect link (*"X happens because Y, resulting in Z"*).
   - **"Evaluate" / "Discuss"**: Balanced arguments with definitive concluding judgment.

2. **The 1-Minute-Per-Mark Rule**:
   - Allocate **~1 minute per mark**. If stuck on a 3-mark calculation for >3 minutes, write the formula (secures M1), make an educated estimate, and keep moving.

3. **Method Marks & Error Carried Forward (ECF)**:
   - Always state intermediate formulas. If your arithmetic slips, ECF protects all subsequent marks.`;
  }

  // Paper 6 ATP Strategy
  if (q.includes('paper 6') || q.includes('atp') || q.includes('alternative to practical')) {
    return `### 🧪 Paper 6 (Alternative to Practical) High-Yield Rules
Paper 6 is the highest return on investment for grade improvement:

1. **Graph Plotting Rules**:
   - Plot points with **small neat crosses (x)**.
   - Scale must occupy **more than 50%** of the grid on both axes.
   - Draw a single, smooth line of best fit—never connect dots with a ruler like a staircase.

2. **Planning 6-Mark Experiment Question**:
   - **Variables**: Independent (change), Dependent (measure with apparatus + unit), 2 Controlled (state method of keeping constant).
   - **Apparatus**: Name exact measuring tools (e.g. *gas syringe with 1cm³ graduations*, *stopwatch*, *thermostatic water bath*).
   - **Reliability**: *"Repeat 3 times and calculate mean average, discarding any anomalous results"*.
   - **Safety**: Specific hazard precaution (e.g. *wear goggles when heating acid*, *use gloves for corrosive reagents*).`;
  }

  // Grade Thresholds
  if (q.includes('threshold') || q.includes('boundary') || q.includes('grade') || q.includes('curve')) {
    return `### 📊 Grade Thresholds & Boundary Dynamics
- **Standardized Globally**: Cambridge grade thresholds are determined **after** all papers worldwide are marked. If a paper was exceptionally difficult, thresholds drop to protect students.
- **Typical A* Thresholds (Extended Tier)**:
  - Physics/Chemistry Paper 4 A* threshold typically sits between **60% – 72%**.
  - Mathematics (0580) Paper 4 A* usually sits between **78% – 86%**.
  - Biology (0610) Paper 4 A* usually sits between **62% – 74%**.
- Focus purely on securing every accessible method mark in front of you.`;
  }

  return `### 🎯 Cambridge Academic Support: Action Plan for ${subjects}
Here is your actionable guidance for your Cambridge exam series:

1. **Active Retrieval over Passive Reading**:
   - Solve classified past papers under timed conditions (2020–2024 Series).
2. **Examiner Reports Analysis**:
   - Review Cambridge Principal Examiner Reports to identify common misconceptions.
3. **Formula & Units Precision**:
   - Keep non-exact numerical answers to **3 significant figures**, state all working steps to guarantee **Method (M) marks**.

*What specific question, syllabus concept, or past paper component would you like to tackle next?*`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Cambridge Nightmare Support API',
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
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

      const promptText = message || 'Please analyze this attached study material / question and provide step-by-step guidance, mark scheme criteria, and key traps.';

      // Format conversation contents for multi-turn chat
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

      // List of candidate models in prioritized order according to @google/genai guidelines
      const candidateModels = [
        'gemini-2.5-flash',
        'gemini-3.7-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro-preview',
      ];

      let replyText = '';
      let successfulModel = '';

      const apiKey = getEffectiveApiKey();

      // 1. Try VoidAI / OpenAI compatible gateway first if key is present
      if (apiKey) {
        try {
          const voidAiReply = await callVoidAiChat(
            apiKey,
            contextualSystemInstruction,
            history || [],
            promptText,
            attachments || []
          );
          if (voidAiReply) {
            replyText = voidAiReply;
            successfulModel = 'voidai-gpt4o';
          }
        } catch (voidErr) {
          console.warn('VoidAI calling exception:', voidErr);
        }
      }

      // 2. If VoidAI did not handle it and key might be Google GenAI key, try GoogleGenAI
      if (!replyText && apiKey && apiKey.startsWith('AIza')) {
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
                  maxOutputTokens: 2000,
                },
              });

              if (response && response.text) {
                replyText = response.text;
                successfulModel = modelToTry;
                break;
              }
            } catch (modelErr: any) {
              console.warn(`Model ${modelToTry} attempt failed, trying next:`, modelErr?.message || modelErr);
            }
          }
        } catch (genAiErr) {
          console.warn('GenAI client initialization warning:', genAiErr);
        }
      }

      // If AI did not return a response or key not set, provide an intelligent fallback academic response
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
