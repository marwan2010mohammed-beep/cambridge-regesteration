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
