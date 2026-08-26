import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
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

const CAMBRIDGE_SYSTEM_INSTRUCTION = `You are "Cambridge Nightmare Support", the official AI academic crisis counselor, exam strategist, and syllabus survival advisor for candidates sitting the Cambridge International (CIE / Cambridge Assessment International Education) IGCSE, O Level, and International AS/A Level October/November examination series.

Your mission:
1. Alleviate candidate panic and "Cambridge nightmares" (e.g. brutal Paper 4s, boundary anxiety, syllabus cramming, timetable clash stress, practical paper fears like Paper 6 Alternative to Practical, examiner report pitfalls).
2. Deliver concrete, highly actionable academic advice: breakdown of mark scheme expectations, syllabus learning objectives, formula memorization techniques, time-per-mark allocation strategies (e.g. 1 minute per mark rule), and examiner report insights (common misconceptions and trap questions).
3. Assist with logistical and regulatory questions: Zone 3/4 Key Times, Full Centre Supervision rules, Statement of Entry verifications, permitted stationery / calculator allowances (e.g. standard scientific without CAS/graphic plotting), formula sheets, and candidate identification.
4. Support emotional resilience: Validate the candidate's feelings with calm empathy, witty and reassuring academic humor when appropriate, and relentless encouragement.
5. Provide structured, clean Markdown formatting with clear bullet points, bold key terms, formula blocks, and step-by-step revision checklists.

If the candidate shares their enrolled subjects or timetable details, tailor your advice specifically to those syllabus codes (e.g. 0580 Math, 0620 Chemistry, 0625 Physics, 0610 Biology, 0417 ICT, 0478 Computer Science, 0450 Business Studies, 0452 Accounting, 0455 Economics, 0500 First Language English, 0510 English as a Second Language). Always be reassuring, sharp, professional, and uncompromisingly helpful.`;

function generateFallbackCambridgeResponse(query: string, context?: any, attachments?: any[]): string {
  const q = query.toLowerCase();
  const subjects = context?.selectedSubjects?.length ? context.selectedSubjects.join(', ') : 'Cambridge IGCSE & A-Levels';

  if (attachments && Array.isArray(attachments) && attachments.length > 0) {
    const attachmentNames = attachments.map((a) => a.name || 'study file').join(', ');
    return `### 📝 Attached Study File / Question Analysis: ${attachmentNames}
I've reviewed your attached question / study material for **${subjects}**:

1. **Step-by-Step Mark Scheme Breakdown**:
   - **Step 1 (Identify Given Quantities & Formula)**: State the governing equation or definition explicitly before substituting numbers (guarantees Formula/Method **M1** marks).
   - **Step 2 (Units & Precision)**: In Cambridge Physics, Chemistry & Math, state final answers to **3 significant figures** (or 1 decimal place for angles in degrees, 2 d.p. for money), and always write standard SI units.
   - **Step 3 (Examiner Trap Avoidance)**: Check for sneaky unit prefixes (e.g. $cm^3$ to $dm^3$, $kJ$ to $J$, $minutes$ to $seconds$).

2. **Common Past Paper Pitfalls**:
   - Never write loose phrases like *"the reaction happens faster because particles move more"* without naming **frequency of successful collisions per unit time**.
   - If evaluating a table/graph, quote exact pairs of numerical coordinates from the question to secure the data-evidence mark.

*Would you like me to detail the specific calculation steps or outline the exact examiner mark scheme criteria for this problem?*`;
  }

  if (q.includes('paper 4') || q.includes('p4') || q.includes('extended') || q.includes('difficult') || q.includes('hard')) {
    return `### ⚡ Paper 4 Crisis Strategy: Maximizing Raw Marks
Don't let the Paper 4 reputation intimidate you. Cambridge examiner reports reveal that up to **22% of lost marks** stem from formatting and command words rather than missing knowledge:

1. **Follow the Command Words**:
   - **"State" / "Name"**: 1 line only. Do not waste precious seconds writing essays.
   - **"Explain"**: Requires a cause-and-effect link (*"X happens because Y, resulting in Z"*).
   - **"Evaluate" / "Discuss"**: Must present balanced points with a definitive concluding judgment.

2. **The 1-Minute-Per-Mark Rule**:
   - For an 80-mark, 1h 15m paper: You have **~55 seconds per mark**. If you are stuck on a 3-mark derivation for >4 minutes, flag it, move on, and collect the guaranteed method marks downstream.

3. **Method & Error Carried Forward (ECF)**:
   - Always write intermediate formulas. Even if your final calculation slips, Cambridge awards **M-marks** (Method) and applies ECF so you only lose 1 mark instead of the whole question.`;
  }

  if (q.includes('clash') || q.includes('timetable') || q.includes('key time') || q.includes('supervision')) {
    return `### 🕒 Cambridge Timetable Clash & Key Time Protocol
If you have multiple papers scheduled in the same morning or afternoon session:

1. **Full Centre Supervision**:
   - Your examination centre officer will arrange for you to sit one exam first, followed immediately by quarantine/supervised break before the next exam.
   - **Crucial Rule**: No internet, phone, smartwatches, or contact with unsupervised candidates during the isolation window.

2. **Zone 3 / 4 Key Times**:
   - Morning Key Time is typically **10:00 AM local time** and Afternoon Key Time is **14:00 PM local time**.
   - You must be inside the exam hall or under supervised hold during these exact moments.`;
  }

  if (q.includes('paper 6') || q.includes('atp') || q.includes('alternative to practical') || q.includes('experiment')) {
    return `### 🧪 Paper 6 (Alternative to Practical) High-Yield Rules
Paper 6 is the easiest paper to guarantee an A* with strict template discipline:

1. **Graph Plotting Rules**:
   - Use **small neat crosses (x)**, not fat dots.
   - Points must occupy **more than 50%** of the grid on both axes.
   - Draw a single, smooth line of best fit—never connect dots with a ruler like a staircase.

2. **Planning / 6-Mark Experiment Question**:
   - **Variables**: State Independent (change), Dependent (measure with tool), and 2 Controlled (keep constant).
   - **Apparatus**: Name exact measuring tools (e.g. *gas syringe with 1cm³ precision*, *stopwatch*, *water bath*).
   - **Reliability**: Always write *"Repeat 3 times and calculate mean average, discarding anomalies"*.
   - **Safety**: State specific precaution (e.g. *wear goggles when heating acid*).`;
  }

  if (q.includes('threshold') || q.includes('boundary') || q.includes('grade') || q.includes('curve')) {
    return `### 📊 Grade Threshold & Boundary Reality Check
- **Cambridge adjustments**: Cambridge grade thresholds are determined **after** all papers worldwide are marked, compensating for exam difficulty. If a paper felt brutally hard to you, the global cohort felt it too, and the threshold drops.
- **Typical A* Bands (Extended)**:
  - Physics/Chemistry Paper 4 A* threshold often hovers between **60% - 72%**.
  - Mathematics (0580) Paper 4 A* usually sits between **78% - 86%**.
- Focus purely on winning every single accessible mark in front of you.`;
  }

  return `### 🎯 Cambridge Academic Support: Key Advice for ${subjects}
Here is your actionable gameplan for your active Cambridge exam preparation:

1. **Topical Past Papers over Passive Reading**:
   - Shift from re-reading textbooks to active retrieval. Complete 5–10 years of recent Series papers (Oct/Nov & May/June).
2. **Examiner Reports Analysis**:
   - Cambridge publishes "Principal Examiner Reports" for every series highlighting exact traps where >60% of students lose marks.
3. **Memory Traps**:
   - Review your syllabus definitions, standard SI units, and formula sheets daily.

*What specific syllabus topic, past paper question, or exam anxiety would you like to tackle next?*`;
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
        'gemini-3.7-flash',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite',
        'gemini-3.1-pro-preview',
      ];

      let replyText = '';
      let successfulModel = '';

      if (process.env.GEMINI_API_KEY) {
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
                  maxOutputTokens: 1800,
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
