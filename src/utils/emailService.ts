import emailjs from '@emailjs/browser';
import { CandidateEnrollment } from '../types';

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  enabled: boolean;
}

const EMAIL_CONFIG_KEY = 'cambridge_emailjs_config_v1';
const EMAIL_LOGS_KEY = 'cambridge_emailjs_logs_v1';

export function getEmailConfig(): EmailConfig {
  try {
    const saved = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // Ignore error
  }
  return {
    serviceId: '',
    templateId: '',
    publicKey: '',
    enabled: false,
  };
}

export function saveEmailConfig(config: Partial<EmailConfig>): void {
  const current = getEmailConfig();
  localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify({ ...current, ...config }));
}

export interface EmailDispatchResult {
  success: boolean;
  status: 'delivered' | 'failed' | 'simulated' | 'disabled';
  message: string;
}

export async function dispatchEmailConfirmation(candidate: CandidateEnrollment): Promise<EmailDispatchResult> {
  const config = getEmailConfig();

  if (!config.enabled) {
    return {
      success: true,
      status: 'disabled',
      message: 'Automated email confirmation is currently disabled.',
    };
  }

  if (!config.serviceId || !config.templateId || !config.publicKey) {
    return {
      success: true,
      status: 'simulated',
      message: 'Email credentials not configured. Email dispatch simulated.',
    };
  }

  const subjectsList = candidate.subjects.map(s => `[${s.code}] ${s.name} (${s.tier}) - Papers: ${s.selectedPapers?.join(', ') || 'All'}`).join('\n');

  const templateParams = {
    to_email: candidate.email,
    candidate_name: candidate.candidateName || 'Candidate',
    candidate_id: candidate.id,
    discord_handle: candidate.discord,
    center_number: candidate.centerNumber || 'EG042 (Default)',
    subjects_list: subjectsList,
    registration_date: candidate.timestamp,
  };

  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      { publicKey: config.publicKey }
    );

    if (response.status === 200) {
      return {
        success: true,
        status: 'delivered',
        message: `Email confirmation successfully sent to ${candidate.email}`,
      };
    } else {
      return {
        success: false,
        status: 'failed',
        message: `Email delivery failed (Status: ${response.status})`,
      };
    }
  } catch (error: any) {
    const errorMsg = error?.text || error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
    return {
      success: false,
      status: 'failed',
      message: `Email service error: ${errorMsg}`,
    };
  }
}

export async function testEmailConfirmation(customConfig?: EmailConfig): Promise<EmailDispatchResult> {
    const testCandidate: CandidateEnrollment = {
        id: `CIE-TEST-EMAIL`,
        email: 'admin-test@cambridge.edu',
        discord: '@ExamAdmin_Test',
        candidateName: 'Test Candidate Registration',
        centerNumber: 'EG042',
        subjects: [
          {
            code: '0580',
            name: 'Mathematics',
            tier: 'Extended',
            selectedPapers: ['Paper 2', 'Paper 4'],
          }
        ],
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        status: 'Pending Admin DM',
      };
      
    if(customConfig) {
        saveEmailConfig(customConfig);
    }
    const res = await dispatchEmailConfirmation(testCandidate);
    return res;
}
