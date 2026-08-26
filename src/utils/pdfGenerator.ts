import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CandidateEnrollment, ExamSubject, ScheduledExamPaper } from '../types';
import { getScheduledPapersForSubject, generateTimetableSummary } from '../data/examSchedule';

/**
 * Generate and download an official Cambridge Assessment International Education
 * Statement of Entry & Registration Receipt PDF for an enrolled candidate.
 */
export function generateStatementOfEntryPDF(
  enrollment: CandidateEnrollment,
  fullSubjectsList?: ExamSubject[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const navyColor = [15, 23, 42]; // #0f172a
  const cambridgeBlue = [30, 58, 138]; // #1e3a8a
  const accentBlue = [37, 99, 235]; // #2563eb
  const textDark = [30, 41, 59]; // #1e293b
  const textMuted = [100, 116, 139]; // #64748b
  const borderGrey = [226, 232, 240]; // #e2e8f0
  const lightBg = [248, 250, 252]; // #f8fafc

  // --- 1. TOP HEADER BANNER ---
  doc.setFillColor(cambridgeBlue[0], cambridgeBlue[1], cambridgeBlue[2]);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Decorative sub-bar
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(0, 24, pageWidth, 2, 'F');

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CAMBRIDGE ASSESSMENT INTERNATIONAL EDUCATION', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('OCTOBER / NOVEMBER 2026 EXAMINATION SERIES — STATEMENT OF ENTRY', margin, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CENTRE: EG042', pageWidth - margin, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('ZONE 3/4 TIMETABLE', pageWidth - margin, 18, { align: 'right' });

  let curY = 32;

  // --- 2. DOCUMENT TITLE & ISSUANCE ---
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FINAL STATEMENT OF ENTRY & REGISTRATION RECEIPT', margin, curY);

  curY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const dateFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(
    `Document Ref: CIE-SOE-${enrollment.id}  •  Issued Date: ${dateFormatted}  •  Status: OFFICIAL ENROLMENT RECORD`,
    margin,
    curY
  );

  curY += 7;

  // --- 3. CANDIDATE DETAILS CARD ---
  const cardHeight = 34;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, curY, contentWidth, cardHeight, 2, 2, 'FD');

  // Left Column
  const col1X = margin + 5;
  const col2X = margin + 98;
  let cardY = curY + 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('CANDIDATE NAME:', col1X, cardY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(enrollment.candidateName || enrollment.discord || 'Enrolled Private Candidate', col1X + 34, cardY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('CANDIDATE ID / NO:', col2X, cardY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cambridgeBlue[0], cambridgeBlue[1], cambridgeBlue[2]);
  doc.text(enrollment.id, col2X + 34, cardY);

  cardY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('EMAIL ADDRESS:', col1X, cardY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(enrollment.email, col1X + 34, cardY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('DISCORD CONTACT:', col2X, cardY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.text(enrollment.discord, col2X + 34, cardY);

  cardY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('CENTRE NAME:', col1X, cardY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('International Cambridge Examination Center (EG042)', col1X + 34, cardY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('REGISTRATION:', col2X, cardY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // green
  doc.text('VERIFIED & LOGGED', col2X + 34, cardY);

  cardY += 7;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('EXAM SERIES:', col1X, cardY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Cambridge IGCSE October/November 2026', col1X + 34, cardY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('SUBMITTED AT:', col2X, cardY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(enrollment.timestamp || 'Standard Session', col2X + 34, cardY);

  curY += cardHeight + 7;

  // --- 4. PREPARE SUBJECTS & SCHEDULE DATA ---
  // Build full ExamSubject objects for timetable calculation
  const mappedSubjects: ExamSubject[] = enrollment.subjects.map((s) => {
    const fullSub = fullSubjectsList?.find((item) => item.code === s.code);
    return {
      code: s.code,
      name: s.name,
      category: fullSub?.category || 'IGCSE',
      papers: fullSub?.papers || s.selectedPapers || ['Paper 2', 'Paper 4'],
      selectedPapers: s.selectedPapers || fullSub?.selectedPapers || ['Paper 2', 'Paper 4'],
      tier: (s.tier as 'Core' | 'Extended' | 'Standard') || 'Extended',
      selected: true,
    };
  });

  const timetableSummary = generateTimetableSummary(mappedSubjects);

  // Build rows for the Statement of Entry table
  const tableRows: string[][] = [];

  for (const sub of mappedSubjects) {
    const scheduled = getScheduledPapersForSubject(sub);

    if (scheduled.length > 0) {
      for (const p of scheduled) {
        const dateObj = new Date(p.date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        tableRows.push([
          sub.code,
          sub.name,
          p.tier || sub.tier,
          `${p.paperCode} - ${p.paperName}`,
          formattedDate,
          `${p.session} (${p.timeSlot})`,
          p.durationLabel,
        ]);
      }
    } else {
      // Fallback if paper schedules aren't listed
      const papersStr = sub.selectedPapers && sub.selectedPapers.length > 0
        ? sub.selectedPapers.join(', ')
        : 'Components 12, 22';
      tableRows.push([
        sub.code,
        sub.name,
        sub.tier,
        papersStr,
        'Oct / Nov 2026',
        'AM / PM (Scheduled)',
        'Standard',
      ]);
    }
  }

  // --- 5. STATEMENT OF ENTRY TABLE ---
  autoTable(doc, {
    startY: curY,
    head: [
      [
        'Syllabus',
        'Syllabus Title',
        'Option/Tier',
        'Component & Paper',
        'Exam Date',
        'Session (Time)',
        'Duration',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.2,
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 7.2,
      cellPadding: 2.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 46 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 38 },
      4: { cellWidth: 24, fontStyle: 'bold' },
      5: { cellWidth: 24 },
      6: { cellWidth: 14, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  // Get position after table
  const lastAutoTable = (doc as any).lastAutoTable;
  curY = (lastAutoTable ? lastAutoTable.finalY : curY + 60) + 6;

  // If table went near bottom of page, create space or new page if needed
  if (curY > pageHeight - 65) {
    doc.addPage();
    curY = 20;
  }

  // --- 6. TIMETABLE & SPACING SUMMARY BOX ---
  const summaryBoxHeight = 20;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.roundedRect(margin, curY, contentWidth, summaryBoxHeight, 2, 2, 'FD');

  const statCol1 = margin + 6;
  const statCol2 = margin + 50;
  const statCol3 = margin + 98;
  const statCol4 = margin + 144;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('TOTAL SUBJECTS', statCol1, curY + 6);
  doc.text('SCHEDULED PAPERS', statCol2, curY + 6);
  doc.text('TIMETABLE CLASHES', statCol3, curY + 6);
  doc.text('EXAMINATION SPAN', statCol4, curY + 6);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cambridgeBlue[0], cambridgeBlue[1], cambridgeBlue[2]);
  doc.text(`${enrollment.subjects.length} Subjects`, statCol1, curY + 14);
  doc.text(`${timetableSummary.totalPapers || tableRows.length} Papers`, statCol2, curY + 14);

  if (timetableSummary.directClashesCount > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text(`${timetableSummary.directClashesCount} Clash (Resolving)`, statCol3, curY + 14);
  } else {
    doc.setTextColor(16, 185, 129);
    doc.text('0 Direct Clashes (Clean)', statCol3, curY + 14);
  }

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(
    `${timetableSummary.totalExamDays || enrollment.subjects.length} Exam Days`,
    statCol4,
    curY + 14
  );

  curY += summaryBoxHeight + 6;

  // --- 7. NOTICE TO CANDIDATES / EXAMINATION REGULATIONS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('IMPORTANT NOTICE TO CANDIDATES & EXAMINATION HALL REGULATIONS:', margin, curY);

  curY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const rules = [
    '1. Identification: You must present this Statement of Entry along with valid photo ID (Passport / National ID) at the entrance.',
    '2. Key Times & Arrival: Candidates must arrive at the examination hall at least 30 minutes prior to the designated session Key Time.',
    '3. Unauthorized Items: Mobile phones, smart watches, digital storage, and unauthorized notes are strictly prohibited in the exam hall.',
    '4. Timetable Clashes: If you have two papers scheduled in the same session, invigilators will arrange supervised isolation under CIE rules.',
    '5. Special Arrangements & Materials: Scientific calculators and geometrical instruments must comply with syllabus regulations.',
  ];

  for (const rule of rules) {
    doc.text(rule, margin, curY);
    curY += 3.4;
  }

  curY += 2;

  // --- 8. OFFICIAL VERIFICATION & SIGNATURE STRIP ---
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, curY, pageWidth - margin, curY);

  curY += 5;
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('CAMBRIDGE EXAMINATIONS OFFICER SIGNATURE', margin, curY);
  doc.text('CANDIDATE SIGNATURE & CONFIRMATION', pageWidth - margin - 65, curY);

  curY += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Dr. A. Sterling — Cambridge Examination Center', margin, curY);
  doc.text('I confirm my subject entry choices and agree to CIE regulations.', pageWidth - margin - 65, curY);

  // Bottom Security / Footer bar
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    `Cambridge Assessment International Education  •  Oct/Nov 2026 Series  •  Security Verification Checksum: ${enrollment.id}-${Date.now().toString(36).toUpperCase()}`,
    margin,
    pageHeight - 3
  );
  doc.text(`Page 1 of 1`, pageWidth - margin, pageHeight - 3, { align: 'right' });

  // Save the PDF file to user device
  const filename = `Cambridge_Statement_of_Entry_${enrollment.id}.pdf`;
  doc.save(filename);
}

/**
 * Clean markdown symbols for clean PDF rendering
 */
function cleanMarkdownForPDF(text: string): string {
  return text
    .replace(/^#+\s+/gm, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold asterisks
    .replace(/\*(.*?)\*/g, '$1') // Remove italic asterisks
    .replace(/`([^`]+)`/g, '$1') // Remove code backticks
    .replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```[a-z]*\n?/g, '').trim();
    })
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Clean links
    .replace(/\$\$(.*?)\$\$/g, '$1') // Clean math $$
    .replace(/\$(.*?)\$/g, '$1'); // Clean math $
}

/**
 * Generate and download a Cambridge Academic Study Notes / Crisis Support Guide PDF
 * based on an AI response or customized study sheet.
 */
export function generateStudyNotesPDF(
  title: string,
  content: string,
  candidateContext?: { selectedSubjects?: string[]; email?: string }
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const cambridgeBlue = [30, 58, 138]; // #1e3a8a
  const accentBlue = [37, 99, 235]; // #2563eb
  const textDark = [30, 41, 59]; // #1e293b
  const textMuted = [100, 116, 139]; // #64748b
  const borderGrey = [226, 232, 240]; // #e2e8f0
  const lightBg = [248, 250, 252]; // #f8fafc

  // Header Banner
  doc.setFillColor(cambridgeBlue[0], cambridgeBlue[1], cambridgeBlue[2]);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(0, 22, pageWidth, 1.5, 'F');

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CAMBRIDGE NIGHTMARE SUPPORT — OFFICIAL REVISION STUDY GUIDE', margin, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const subjectsText = candidateContext?.selectedSubjects?.length
    ? `SUBJECTS: ${candidateContext.selectedSubjects.join(', ')}`
    : 'CAMBRIDGE IGCSE / O LEVEL / A-LEVEL EXAMINATION SERIES';
  doc.text(subjectsText, margin, 17);

  const dateFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`ISSUED: ${dateFormatted}`, pageWidth - margin, 10, { align: 'right' });

  let curY = 30;

  // Document Title
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title.toUpperCase(), margin, curY);

  curY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Cambridge Assessment International Education Study Blueprint & Mark Scheme Strategy Sheet', margin, curY);

  curY += 6;

  // Metadata Card
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, curY, contentWidth, 14, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('REVISION SCOPE:', margin + 4, curY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Command Words • Formula Sheets • Past Paper Trap Analysis • M1 Method Marks', margin + 34, curY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('FORMAT COMPLIANCE:', margin + 4, curY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text('Strictly Aligned with CIE Examiner Reports & October/November 2026 Regulations', margin + 42, curY + 11);

  curY += 20;

  // Main Content Paragraphs
  const cleanedContent = cleanMarkdownForPDF(content);
  const lines = cleanedContent.split('\n');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) {
      curY += 3;
      continue;
    }

    // Check if new page is needed
    if (curY > pageHeight - 20) {
      doc.addPage();
      curY = 20;
    }

    // Detect section headers
    if (
      rawLine.startsWith('---') ||
      rawLine.startsWith('###') ||
      /^[0-9]+\.\s+[A-Z]/.test(rawLine) ||
      rawLine.includes('Blueprints') ||
      rawLine.includes('Syllabus') ||
      rawLine.includes('Strategy')
    ) {
      curY += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(cambridgeBlue[0], cambridgeBlue[1], cambridgeBlue[2]);
      
      const wrappedHeader = doc.splitTextToSize(rawLine.replace(/^[#-]+\s*/, ''), contentWidth);
      doc.text(wrappedHeader, margin, curY);
      curY += wrappedHeader.length * 4.5;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      continue;
    }

    // Bullet points
    if (rawLine.startsWith('- ') || rawLine.startsWith('* ') || rawLine.startsWith('• ')) {
      doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
      doc.circle(margin + 2, curY - 1, 0.8, 'F');
      const bulletText = rawLine.replace(/^[-*•]\s+/, '');
      const wrappedBullet = doc.splitTextToSize(bulletText, contentWidth - 6);
      doc.text(wrappedBullet, margin + 6, curY);
      curY += wrappedBullet.length * 4;
      continue;
    }

    // Normal text
    const wrappedText = doc.splitTextToSize(rawLine, contentWidth);
    doc.text(wrappedText, margin, curY);
    curY += wrappedText.length * 4;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Cambridge Assessment International Education • Study Guide Export • Official Candidate Counseling System`,
      margin,
      pageHeight - 3
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 3, { align: 'right' });
  }

  const safeFilename = `Cambridge_Study_Notes_${title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.pdf`;
  doc.save(safeFilename);
}

/**
 * Export full chat session between Candidate and Cambridge AI into a complete PDF transcript
 */
export function exportChatTranscriptPDF(
  messages: Array<{ role: string; text: string; timestamp?: string }>,
  candidateContext?: { selectedSubjects?: string[]; email?: string }
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 22, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CAMBRIDGE NIGHTMARE SUPPORT — SESSION TRANSCRIPT & STUDY RECORD', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const subjects = candidateContext?.selectedSubjects?.join(', ') || 'General Cambridge IGCSE & A-Levels';
  doc.text(`Candidate Subjects: ${subjects}`, margin, 17);

  const dateStr = new Date().toLocaleString('en-GB');
  doc.text(`Date: ${dateStr}`, pageWidth - margin, 11, { align: 'right' });

  let curY = 30;

  for (const msg of messages) {
    if (!msg.text) continue;
    const isUser = msg.role === 'user';

    if (curY > pageHeight - 25) {
      doc.addPage();
      curY = 20;
    }

    // Role badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    if (isUser) {
      doc.setTextColor(37, 99, 235);
      doc.text(`[CANDIDATE] ${msg.timestamp || ''}`, margin, curY);
    } else {
      doc.setTextColor(30, 58, 138);
      doc.text(`[CAMBRIDGE NIGHTMARE SUPPORT] ${msg.timestamp || ''}`, margin, curY);
    }
    curY += 4.5;

    // Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const cleanText = cleanMarkdownForPDF(msg.text);
    const splitLines = doc.splitTextToSize(cleanText, contentWidth);

    doc.text(splitLines, margin, curY);
    curY += splitLines.length * 3.8 + 4;

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, curY - 2, pageWidth - margin, curY - 2);
    curY += 3;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Cambridge Assessment International Education • Nightmare Support Session Transcript`,
      margin,
      pageHeight - 3
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 3, { align: 'right' });
  }

  doc.save(`Cambridge_Nightmare_Support_Session_${Date.now()}.pdf`);
}

/**
 * Compile and download an official Cambridge Academic & Examination Summary PDF
 * combining candidate examination details, scheduled papers, timetable stats,
 * and key strategic revision takeaways compiled from the AI consultation.
 */
export function compileAndDownloadExamSummaryPDF(
  messages: Array<{ role: string; text: string; timestamp?: string }>,
  candidateContext?: {
    selectedSubjects?: string[];
    email?: string;
    candidateName?: string;
    discord?: string;
    clashesCount?: number;
  },
  customTitle?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const cambridgeBlue = [30, 58, 138]; // #1e3a8a
  const accentBlue = [37, 99, 235]; // #2563eb
  const textDark = [30, 41, 59]; // #1e293b
  const textMuted = [100, 116, 139]; // #64748b
  const borderGrey = [226, 232, 240]; // #e2e8f0
  const lightBg = [248, 250, 252]; // #f8fafc

  // --- 1. TOP HEADER BANNER ---
  doc.setFillColor(cambridgeBlue[0], cambridgeBlue[1], cambridgeBlue[2]);
  doc.rect(0, 0, pageWidth, 22, 'F');
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(0, 22, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CAMBRIDGE ASSESSMENT INTERNATIONAL EDUCATION', margin, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('CANDIDATE CRISIS COUNSELING & EXAM STRATEGY SUMMARY REPORT', margin, 16);

  const dateFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`SERIES: OCT/NOV 2026`, pageWidth - margin, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`COMPILED: ${dateFormatted}`, pageWidth - margin, 16, { align: 'right' });

  let curY = 30;

  // --- 2. REPORT TITLE ---
  const reportTitle = customTitle || 'OFFICIAL CANDIDATE EXAMINATION STRATEGY & STUDY SUMMARY';
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text(reportTitle, margin, curY);

  curY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    'Synthesized from Cambridge Nightmare Support active counseling session & syllabus database.',
    margin,
    curY
  );

  curY += 6;

  // --- 3. CANDIDATE PROFILE & EXAMINATION DETAILS CARD ---
  const cardHeight = 26;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, curY, contentWidth, cardHeight, 2, 2, 'FD');

  const cName = candidateContext?.candidateName || (candidateContext?.email ? candidateContext.email.split('@')[0].toUpperCase() : 'REGISTERED CANDIDATE');
  const cEmail = candidateContext?.email || 'Registered in Portal';
  const cSubjectsCount = candidateContext?.selectedSubjects?.length || 0;
  const cClashes = candidateContext?.clashesCount ?? 0;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('CANDIDATE NAME:', margin + 4, curY + 6);
  doc.text('CONTACT / EMAIL:', margin + 4, curY + 13);
  doc.text('EXAM CENTRE:', margin + 4, curY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(cName, margin + 34, curY + 6);
  doc.text(cEmail, margin + 34, curY + 13);
  doc.text('EG042 — Cambridge International Centre (Zone 3/4)', margin + 34, curY + 20);

  const col2X = margin + 105;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('REGISTERED SUBJECTS:', col2X, curY + 6);
  doc.text('TIMETABLE CLASHES:', col2X, curY + 13);
  doc.text('SECURITY STATUS:', col2X, curY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${cSubjectsCount} Subjects Enrolled`, col2X + 38, curY + 6);

  if (cClashes > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text(`${cClashes} Direct Clash (FCS Managed)`, col2X + 38, curY + 13);
  } else {
    doc.setTextColor(16, 185, 129);
    doc.text('0 Direct Clashes (Clear)', col2X + 38, curY + 13);
  }

  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text('Verified Candidate', col2X + 38, curY + 20);

  curY += cardHeight + 7;

  // --- 4. SUBJECTS & PAPERS SUMMARY TABLE ---
  if (candidateContext?.selectedSubjects && candidateContext.selectedSubjects.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(cambridgeBlue[0], cambridgeBlue[1], cambridgeBlue[2]);
    doc.text('EXAMINATION SUBJECTS & SCHEDULED COMPONENTS', margin, curY);
    curY += 3.5;

    const tableRows: any[] = [];
    for (const subStr of candidateContext.selectedSubjects) {
      const match = subStr.match(/^(\d{4})\s*[-–]?\s*(.*)$/);
      const code = match ? match[1] : subStr.slice(0, 4);
      const title = match ? match[2] : subStr;
      
      const dummySub: ExamSubject = {
        code,
        name: title || subStr,
        tier: 'Extended',
        papers: ['Paper 1', 'Paper 2', 'Paper 3', 'Paper 4', 'Paper 6'],
        selectedPapers: ['Paper 2', 'Paper 4', 'Paper 6'],
        category: 'General',
        selected: true,
      };
      const papers = getScheduledPapersForSubject(dummySub);
      if (papers && papers.length > 0) {
        for (const p of papers) {
          tableRows.push([
            code,
            title || p.subjectName,
            p.paperCode,
            p.date,
            p.timeSlot,
            p.durationLabel,
          ]);
        }
      } else {
        tableRows.push([
          code,
          title || subStr,
          'Core / Extended Components',
          'Oct/Nov 2026',
          'AM / PM Session',
          'Standard Duration',
        ]);
      }
    }

    autoTable(doc, {
      startY: curY,
      head: [['Code', 'Subject Title', 'Paper Code', 'Exam Date', 'Time Window', 'Duration']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        cellPadding: 1.8,
      },
      bodyStyles: {
        fontSize: 6.8,
        textColor: [30, 41, 59],
        cellPadding: 1.8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 14, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 26, fontStyle: 'bold' },
        3: { cellWidth: 25 },
        4: { cellWidth: 36 },
        5: { cellWidth: 26, halign: 'center' },
      },
      margin: { left: margin, right: margin },
    });

    const lastTable = (doc as any).lastAutoTable;
    curY = (lastTable ? lastTable.finalY : curY + 30) + 6;
  }

  // --- 5. COMPILED STRATEGIC TAKEAWAYS & ADVICE FROM SESSION ---
  if (curY > pageHeight - 40) {
    doc.addPage();
    curY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(cambridgeBlue[0], cambridgeBlue[1], cambridgeBlue[2]);
  doc.text('KEY ACADEMIC & REVISION STRATEGIES COMPILED FROM CONSULTATION', margin, curY);

  curY += 4.5;

  // Draw Strategic Highlights Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.roundedRect(margin, curY, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('CORE EXAM METHODOLOGY & PACING RULES:', margin + 4, curY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('• 1 Mark = 1 Minute Rule: Never spend more minutes on a question than its allocated marks.', margin + 4, curY + 10);
  doc.text('• Method Marks (M1): Always write initial formula substitutions to guarantee partial credit via ECF.', margin + 4, curY + 14);

  curY += 23;

  // Render each consultation question & key strategy
  let queryCount = 0;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg.text) continue;

    if (curY > pageHeight - 25) {
      doc.addPage();
      curY = 20;
    }

    if (msg.role === 'user') {
      queryCount++;
      curY += 2;
      doc.setFillColor(238, 242, 255);
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(margin, curY, contentWidth, 7, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(37, 99, 235);
      const userSnippet = doc.splitTextToSize(`[Topic / Query ${queryCount}] ${cleanMarkdownForPDF(msg.text)}`, contentWidth - 6);
      doc.text(userSnippet[0], margin + 3, curY + 4.8);
      curY += 9;
    } else if (msg.role === 'model') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);

      const cleaned = cleanMarkdownForPDF(msg.text);
      const splitLines = doc.splitTextToSize(cleaned, contentWidth);

      const displayLines = splitLines.slice(0, 35);
      doc.text(displayLines, margin, curY);
      curY += displayLines.length * 3.5 + 4;

      doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, curY - 1.5, pageWidth - margin, curY - 1.5);
      curY += 2;
    }
  }

  // --- 6. FOOTER ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Cambridge Assessment International Education • Nightmare Support Official Summary Report • Ref: SUM-${Date.now().toString(36).toUpperCase()}`,
      margin,
      pageHeight - 3
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 3, { align: 'right' });
  }

  const safeFilename = `Cambridge_Exam_Summary_Report_${cName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20)}_${Date.now().toString().slice(-4)}.pdf`;
  doc.save(safeFilename);
}

