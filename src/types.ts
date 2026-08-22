export interface ExamSubject {
  code: string;
  name: string;
  category?: string;
  papers: string[];
  selectedPapers?: string[]; // Specific papers selected (e.g. ['Paper 4 (Theory Extended)'])
  tier: 'Core' | 'Extended' | 'Standard';
  selected: boolean;
}

export interface CandidateEnrollment {
  id: string;
  email: string;
  discord: string;
  candidateName?: string;
  centerNumber?: string;
  subjects: {
    code: string;
    name: string;
    tier: string;
    selectedPapers?: string[];
  }[];
  timestamp: string;
  status: 'Pending Admin DM' | 'DM Sent' | 'Enrolled & Verified';
  adminNotes?: string;
}

export interface ScheduledExamPaper {
  id: string;
  subjectCode: string;
  subjectName: string;
  category: string;
  paperName: string;
  paperCode: string;
  date: string; // 'YYYY-MM-DD'
  dayOfWeek: string;
  session: 'AM' | 'PM' | 'EV';
  timeSlot: string; // e.g. '09:00 - 10:15' or '13:30 - 15:00'
  durationMinutes: number;
  durationLabel: string;
  tier: 'Core' | 'Extended' | 'Standard';
  isCourseworkOrOral?: boolean;
}

export interface TimetableClash {
  id: string;
  type: 'DIRECT_SESSION_CLASH' | 'SAME_DAY_DOUBLE';
  date: string;
  dayOfWeek: string;
  session?: 'AM' | 'PM' | 'EV';
  papers: ScheduledExamPaper[];
  description: string;
  severity: 'critical' | 'warning';
  resolutionGuidance: string;
}

export interface TimetableDaySchedule {
  date: string;
  dayOfWeek: string;
  papers: ScheduledExamPaper[];
  hasDirectClash: boolean;
  isSameDayDouble: boolean;
  totalDurationMinutes: number;
}

export interface TimetableSummary {
  totalPapers: number;
  totalExamDays: number;
  startDate: string;
  endDate: string;
  durationSpanDays: number;
  directClashesCount: number;
  sameDayDoubleCount: number;
  averageGapDays: number;
  busiestWeek: string;
  clashes: TimetableClash[];
  days: TimetableDaySchedule[];
}
