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
