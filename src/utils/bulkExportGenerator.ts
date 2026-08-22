import { CandidateEnrollment, ExamSubject } from '../types';

export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'cambridge-standard';

export interface BulkExportOptions {
  format: ExportFormat;
  includeStatus?: boolean;
  includeTimestamp?: boolean;
  filterStatus?: 'all' | 'verified' | 'pending' | 'sent';
  filename?: string;
}

export interface CambridgeEntryFormat {
  candidateNumber: string;
  candidateName: string;
  email: string;
  discordHandle: string;
  centerNumber: string;
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    tier: string;
    paperComponents: string[];
  }>;
  registrationDate: string;
  verificationStatus: string;
}

/**
 * Filter enrollments based on status
 */
function filterByStatus(
  enrollments: CandidateEnrollment[],
  filterStatus: 'all' | 'verified' | 'pending' | 'sent'
): CandidateEnrollment[] {
  if (filterStatus === 'all') return enrollments;
  if (filterStatus === 'verified') return enrollments.filter((e) => e.status === 'Enrolled & Verified');
  if (filterStatus === 'sent') return enrollments.filter((e) => e.status === 'DM Sent');
  if (filterStatus === 'pending') return enrollments.filter((e) => e.status === 'Pending Admin DM');
  return enrollments;
}

/**
 * Format enrollment for Cambridge International entry submission
 */
function formatForCambridge(enrollment: CandidateEnrollment): CambridgeEntryFormat {
  return {
    candidateNumber: enrollment.id,
    candidateName: enrollment.candidateName || 'Not Provided',
    email: enrollment.email,
    discordHandle: enrollment.discord,
    centerNumber: enrollment.centerNumber || 'PRIVATE',
    subjects: enrollment.subjects.map((s) => ({
      subjectCode: s.code,
      subjectName: s.name,
      tier: s.tier,
      paperComponents: s.selectedPapers && s.selectedPapers.length > 0 ? s.selectedPapers : s.tier === 'Extended' ? ['Paper 1', 'Paper 2', 'Paper 3', 'Paper 4'] : ['Paper 1', 'Paper 2'],
    })),
    registrationDate: enrollment.timestamp,
    verificationStatus: enrollment.status,
  };
}

/**
 * Export to CSV format with Cambridge field mappings
 */
export function exportToCSV(
  enrollments: CandidateEnrollment[],
  options: BulkExportOptions
): string {
  const filtered = filterByStatus(enrollments, options.filterStatus || 'all');

  if (filtered.length === 0) {
    return 'No candidates to export';
  }

  // CSV Headers
  const headers = [
    'Candidate Number',
    'Candidate Name',
    'Email',
    'Discord Handle',
    'Center Number',
    'Subject Code',
    'Subject Name',
    'Subject Tier',
    'Paper Components',
    'Registration Date',
    'Verification Status',
  ];

  // CSV Rows
  const rows: string[] = [];

  filtered.forEach((enrollment) => {
    const cambridge = formatForCambridge(enrollment);

    if (cambridge.subjects.length === 0) {
      rows.push(
        [
          cambridge.candidateNumber,
          `"${cambridge.candidateName}"`,
          cambridge.email,
          cambridge.discordHandle,
          cambridge.centerNumber,
          'N/A',
          'N/A',
          'N/A',
          'N/A',
          cambridge.registrationDate,
          cambridge.verificationStatus,
        ].join(',')
      );
    } else {
      cambridge.subjects.forEach((subject, idx) => {
        rows.push(
          [
            idx === 0 ? cambridge.candidateNumber : '',
            idx === 0 ? `"${cambridge.candidateName}"` : '',
            idx === 0 ? cambridge.email : '',
            idx === 0 ? cambridge.discordHandle : '',
            idx === 0 ? cambridge.centerNumber : '',
            subject.subjectCode,
            subject.subjectName,
            subject.tier,
            `"${subject.paperComponents.join('; ')}"`,
            idx === 0 ? cambridge.registrationDate : '',
            idx === 0 ? cambridge.verificationStatus : '',
          ].join(',')
        );
      });
    }
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export to JSON format with Cambridge schema
 */
export function exportToJSON(
  enrollments: CandidateEnrollment[],
  options: BulkExportOptions
): string {
  const filtered = filterByStatus(enrollments, options.filterStatus || 'all');

  const cambridgeData = filtered.map((enrollment) => formatForCambridge(enrollment));

  const output = {
    exportMetadata: {
      format: 'Cambridge International Entry Submission',
      exportDate: new Date().toISOString(),
      totalCandidates: cambridgeData.length,
      series: 'Oct/Nov 2026',
    },
    candidates: cambridgeData,
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Export to XLSX-compatible format (TSV with Excel headers)
 */
export function exportToXLSX(
  enrollments: CandidateEnrollment[],
  options: BulkExportOptions
): string {
  // For Excel compatibility, we use tab-separated values
  const filtered = filterByStatus(enrollments, options.filterStatus || 'all');

  if (filtered.length === 0) {
    return 'No candidates to export';
  }

  // Excel-compatible headers
  const headers = [
    'Candidate ID',
    'Full Name',
    'Email Address',
    'Discord Username',
    'Exam Center',
    'Subject Code',
    'Subject',
    'Level',
    'Paper(s)',
    'Submitted',
    'Status',
  ];

  const rows: string[] = [];

  filtered.forEach((enrollment) => {
    const cambridge = formatForCambridge(enrollment);

    if (cambridge.subjects.length === 0) {
      rows.push(
        [
          cambridge.candidateNumber,
          cambridge.candidateName,
          cambridge.email,
          cambridge.discordHandle,
          cambridge.centerNumber,
          '',
          '',
          '',
          '',
          cambridge.registrationDate,
          cambridge.verificationStatus,
        ].join('\t')
      );
    } else {
      cambridge.subjects.forEach((subject, idx) => {
        rows.push(
          [
            idx === 0 ? cambridge.candidateNumber : '',
            idx === 0 ? cambridge.candidateName : '',
            idx === 0 ? cambridge.email : '',
            idx === 0 ? cambridge.discordHandle : '',
            idx === 0 ? cambridge.centerNumber : '',
            subject.subjectCode,
            subject.subjectName,
            subject.tier,
            subject.paperComponents.join('; '),
            idx === 0 ? cambridge.registrationDate : '',
            idx === 0 ? cambridge.verificationStatus : '',
          ].join('\t')
        );
      });
    }
  });

  return [headers.join('\t'), ...rows].join('\n');
}

/**
 * Export as Cambridge Standard Format (structured text)
 */
export function exportToCambridgeStandard(
  enrollments: CandidateEnrollment[],
  options: BulkExportOptions
): string {
  const filtered = filterByStatus(enrollments, options.filterStatus || 'all');

  let output = '';
  output += '═══════════════════════════════════════════════════════════════════\n';
  output += 'CAMBRIDGE INTERNATIONAL IGCSE OCT/NOV 2026 - CANDIDATE ENTRY MANIFEST\n';
  output += '═══════════════════════════════════════════════════════════════════\n\n';
  output += `Export Date: ${new Date().toISOString()}\n`;
  output += `Total Candidates: ${filtered.length}\n`;
  output += `Filter Status: ${options.filterStatus || 'ALL'}\n\n`;
  output += '───────────────────────────────────────────────────────────────────\n\n';

  filtered.forEach((enrollment, index) => {
    const cambridge = formatForCambridge(enrollment);

    output += `CANDIDATE ${index + 1} OF ${filtered.length}\n`;
    output += `─────────────────────────────────────────\n`;
    output += `Candidate Number: ${cambridge.candidateNumber}\n`;
    output += `Full Name: ${cambridge.candidateName}\n`;
    output += `Email: ${cambridge.email}\n`;
    output += `Discord Handle: ${cambridge.discordHandle}\n`;
    output += `Examination Center: ${cambridge.centerNumber}\n`;
    output += `Registration Date: ${cambridge.registrationDate}\n`;
    output += `Verification Status: ${cambridge.verificationStatus}\n\n`;

    output += `ENROLLED SUBJECTS & COMPONENTS (${cambridge.subjects.length}):\n`;
    cambridge.subjects.forEach((subject, subIdx) => {
      output += `  ${subIdx + 1}. [${subject.subjectCode}] ${subject.subjectName} (${subject.tier})\n`;
      output += `     Papers: ${subject.paperComponents.join(', ')}\n`;
    });

    output += '\n───────────────────────────────────────────────────────────────────\n\n';
  });

  output += '═══════════════════════════════════════════════════════════════════\n';
  output += `END OF MANIFEST - ${filtered.length} candidates processed\n`;
  output += '═══════════════════════════════════════════════════════════════════\n';

  return output;
}

/**
 * Main bulk export function
 */
export function generateBulkExport(
  enrollments: CandidateEnrollment[],
  options: BulkExportOptions
): { content: string; filename: string; mimeType: string } {
  let content = '';
  let filename = options.filename || `cambridge_export_${new Date().toISOString().slice(0, 10)}`;
  let mimeType = 'text/plain';

  switch (options.format) {
    case 'csv':
      content = exportToCSV(enrollments, options);
      filename += '.csv';
      mimeType = 'text/csv;charset=utf-8';
      break;

    case 'json':
      content = exportToJSON(enrollments, options);
      filename += '.json';
      mimeType = 'application/json;charset=utf-8';
      break;

    case 'xlsx':
      content = exportToXLSX(enrollments, options);
      filename += '.tsv';
      mimeType = 'text/tab-separated-values;charset=utf-8';
      break;

    case 'cambridge-standard':
      content = exportToCambridgeStandard(enrollments, options);
      filename += '_manifest.txt';
      mimeType = 'text/plain;charset=utf-8';
      break;

    default:
      content = exportToCSV(enrollments, options);
      filename += '.csv';
      mimeType = 'text/csv;charset=utf-8';
  }

  return { content, filename, mimeType };
}

/**
 * Trigger browser download of exported file
 */
export function downloadExport(
  enrollments: CandidateEnrollment[],
  options: BulkExportOptions
): void {
  const { content, filename, mimeType } = generateBulkExport(enrollments, options);

  const encodedUri = 'data:' + mimeType + ',' + encodeURIComponent(content);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate summary statistics for bulk export
 */
export function generateExportSummary(enrollments: CandidateEnrollment[]) {
  const summary = {
    totalCandidates: enrollments.length,
    verified: enrollments.filter((e) => e.status === 'Enrolled & Verified').length,
    dmSent: enrollments.filter((e) => e.status === 'DM Sent').length,
    pending: enrollments.filter((e) => e.status === 'Pending Admin DM').length,
    totalSubjectsEnrolled: enrollments.reduce((sum, e) => sum + e.subjects.length, 0),
    uniqueSubjects: Array.from(
      new Set(enrollments.flatMap((e) => e.subjects.map((s) => s.code)))
    ).length,
    centerCounts: enrollments.reduce(
      (acc, e) => {
        const center = e.centerNumber || 'PRIVATE';
        acc[center] = (acc[center] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  return summary;
}
