import { CandidateEnrollment, ExamSubject } from '../types';

export type DMTemplateType = 'verification' | 'quick_confirm' | 'statement_of_entry';

export interface DMTemplateOption {
  id: DMTemplateType;
  label: string;
  description: string;
}

export const DM_TEMPLATE_OPTIONS: DMTemplateOption[] = [
  {
    id: 'verification',
    label: 'Standard Paper Verification DM',
    description: 'Comprehensive confirmation message with full subject/paper breakdowns, ID requirements, and next steps.',
  },
  {
    id: 'quick_confirm',
    label: 'Quick Paper Check DM',
    description: 'Concise, direct message confirming syllabus component codes and asking for photo ID.',
  },
  {
    id: 'statement_of_entry',
    label: 'Statement of Entry Notice',
    description: 'Formal notification that Statement of Entry is generated and venue timetable is verified.',
  },
];

/**
 * Generates a pre-formatted Discord Direct Message for Cambridge administrators to send to candidates.
 */
export function generateDiscordDMTemplate(
  entry: CandidateEnrollment,
  type: DMTemplateType = 'verification',
  adminName?: string,
  _subjects?: ExamSubject[]
): string {
  const candidateGreeting = entry.candidateName
    ? entry.candidateName
    : entry.discord.startsWith('@')
    ? entry.discord
    : `@${entry.discord}`;

  const formattedSubjects = entry.subjects
    .map((sub) => {
      const papers =
        sub.selectedPapers && sub.selectedPapers.length > 0
          ? sub.selectedPapers.join(', ')
          : 'All syllabus papers';
      const tierBadge = sub.tier && sub.tier !== 'Standard' ? ` [${sub.tier}]` : '';
      return `• **[${sub.code}] ${sub.name}**${tierBadge}\n  └ Component(s): \`${papers}\``;
    })
    .join('\n');

  if (type === 'quick_confirm') {
    return `👋 **Hello ${candidateGreeting}!**

This is the Cambridge Examination Office regarding your **Oct/Nov 2026 Registration (${entry.id})**.

📋 **Your Enrolled Papers:**
${formattedSubjects}

⚡ **Please reply to this DM with:**
1. A quick **"Confirmed"** if all papers/tiers above are accurate.
2. A photo of your **valid Passport / National ID**.

Thank you!
— *Cambridge Exam Admin Team*`;
  }

  if (type === 'statement_of_entry') {
    return `📋 **Official Cambridge Statement of Entry Notice**

**Candidate:** ${candidateGreeting} | **Candidate ID:** \`${entry.id}\`
**Centre:** ${entry.centerNumber || 'EG042'} | **Email:** \`${entry.email}\`

Your Cambridge International Examination entry for the **October / November 2026 Series** has been verified and registered.

📚 **Registered Syllabus Components:**
${formattedSubjects}

⚠️ **Important Candidate Instructions:**
• Download your **Statement of Entry PDF** and retain a printed copy for every examination session.
• Bring your official photo ID (Passport / National ID) and Statement of Entry to the examination hall.
• Please arrive at least 30 minutes prior to Key Time (AM: 09:00 / PM: 13:30).

Best of luck with your examinations!
— *Cambridge Examination Administration Team*`;
  }

  // Default 'verification'
  return `👋 **Hello ${candidateGreeting},**

This is the **Cambridge IGCSE Examination Administration Team** regarding your candidate enrollment request for the **October / November 2026 Examination Series**.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **REGISTRATION DOSSIER**
• **Candidate ID:** \`${entry.id}\`
• **Candidate Name:** ${entry.candidateName || 'Not specified'}
• **Centre Number:** ${entry.centerNumber || 'EG042'}
• **Registered Email:** \`${entry.email}\`
• **Logged Timestamp:** ${entry.timestamp}
• **Total Enrolled Subjects:** ${entry.subjects.length}

📚 **ENROLLED SYLLABUS & COMPONENT PAPERS:**
${formattedSubjects}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 **ACTION REQUIRED (PLEASE REPLY TO THIS DM):**
1. **Confirm Paper Components:** Please review the syllabus codes, tiers, and component papers listed above and reply to verify they match your intended entry.
2. **Identification Document:** Send a clear photo/scan of your valid Passport or National ID.
3. **Clash / Special Arrangements:** If you have timetable clashes or require session isolation, please notify us immediately.

Once verified, your official **Cambridge Statement of Entry (SOE)** and venue entry pass will be dispatched to \`${entry.email}\`.

Best regards,
**Cambridge IGCSE Exam Administration Team**${adminName ? ` (${adminName})` : ''}`;
}
