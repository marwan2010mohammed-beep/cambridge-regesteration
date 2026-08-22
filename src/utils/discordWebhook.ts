import { CandidateEnrollment, WebhookConfig, WebhookDispatchLog } from '../types';

const STORAGE_CONFIG_KEY = 'cie_discord_webhook_config';
const STORAGE_LOGS_KEY = 'cie_discord_webhook_logs';

function getDefaultEnvWebhookUrl(): string {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    return meta?.env?.VITE_DISCORD_WEBHOOK_URL || '';
  } catch {
    return '';
  }
}

/**
 * Default Webhook Configuration
 */
export function getWebhookConfig(): WebhookConfig {
  const envUrl = getDefaultEnvWebhookUrl();
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        url: parsed.url !== undefined ? parsed.url : envUrl,
        enabled: parsed.enabled !== undefined ? parsed.enabled : true,
        notifyDesktop: parsed.notifyDesktop !== undefined ? parsed.notifyDesktop : false,
        notifySound: parsed.notifySound !== undefined ? parsed.notifySound : true,
        adminChannelName: parsed.adminChannelName || '#cambridge-admin-alerts',
      };
    }
  } catch (err) {
    console.error('Error reading webhook config from localStorage:', err);
  }

  return {
    url: envUrl,
    enabled: true,
    notifyDesktop: false,
    notifySound: true,
    adminChannelName: '#cambridge-admin-alerts',
  };
}

export function saveWebhookConfig(config: Partial<WebhookConfig>): WebhookConfig {
  const current = getWebhookConfig();
  const updated: WebhookConfig = {
    ...current,
    ...config,
  };
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving webhook config to localStorage:', err);
  }
  return updated;
}

export function getWebhookLogs(): WebhookDispatchLog[] {
  try {
    const saved = localStorage.getItem(STORAGE_LOGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error reading webhook logs:', err);
  }
  return [];
}

export function addWebhookLog(log: Omit<WebhookDispatchLog, 'id'>): WebhookDispatchLog {
  const newLog: WebhookDispatchLog = {
    ...log,
    id: `LOG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
  };
  try {
    const current = getWebhookLogs();
    const updated = [newLog, ...current].slice(0, 50); // keep last 50
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error adding webhook log:', err);
  }
  return newLog;
}

export function clearWebhookLogs(): void {
  try {
    localStorage.removeItem(STORAGE_LOGS_KEY);
  } catch (err) {
    console.error('Error clearing webhook logs:', err);
  }
}

/**
 * Plays a subtle, professional audio chime using Web Audio API
 */
export function playAdminNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2 (Harmonic accent)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.1); // D6
    gain2.gain.setValueAtTime(0.05, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.36);
  } catch {
    // AudioContext autoplay restrictions or disabled sound
  }
}

/**
 * Requests browser desktop notification permissions
 */
export async function requestDesktopNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * Triggers an OS desktop notification if permitted
 */
export function sendDesktopNotification(title: string, body: string): void {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'cie-candidate-registration',
      });
    }
  } catch (err) {
    console.warn('Desktop notification error:', err);
  }
}

/**
 * Formats a Discord Webhook Payload with rich embeds
 */
export function buildDiscordWebhookPayload(candidate: CandidateEnrollment) {
  const subjectsList = candidate.subjects
    .map((s, idx) => {
      const papers = s.selectedPapers && s.selectedPapers.length > 0
        ? s.selectedPapers.join(', ')
        : 'All syllabus components';
      const tierBadge = s.tier && s.tier !== 'Standard' ? ` [${s.tier}]` : '';
      return `${idx + 1}. **[${s.code}] ${s.name}**${tierBadge}\n   └ *Papers:* \`${papers}\``;
    })
    .join('\n');

  return {
    username: 'Cambridge IGCSE Registrar',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png',
    content: `🚨 **NEW CANDIDATE REGISTRATION RECEIVED** — Oct/Nov 2026 Examination Series`,
    embeds: [
      {
        title: `📋 Candidate Enrollment Record: ${candidate.id}`,
        description: `A candidate has submitted their Cambridge IGCSE paper registration. Administrators please verify syllabus component selections and send a direct message to confirm.`,
        color: 5793266, // #5865F2 Blurple
        fields: [
          {
            name: '👤 Candidate Discord',
            value: `**${candidate.discord}**`,
            inline: true,
          },
          {
            name: '📧 Candidate Email',
            value: `\`${candidate.email}\``,
            inline: true,
          },
          {
            name: '🏛️ Centre / Name',
            value: candidate.candidateName
              ? `${candidate.candidateName} (Centre: ${candidate.centerNumber || 'EG042'})`
              : `Centre: ${candidate.centerNumber || 'EG042'}`,
            inline: true,
          },
          {
            name: `📚 Enrolled Cambridge Subjects (${candidate.subjects.length})`,
            value: subjectsList || 'No subjects listed',
            inline: false,
          },
          {
            name: '⚡ Next Admin Action',
            value: `👉 **Send Discord DM to ${candidate.discord}** to verify papers and confirm Statement of Entry (SOE) issuance.`,
            inline: false,
          },
        ],
        footer: {
          text: `Cambridge International Examinations • Automated Webhook Alert`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export interface WebhookDispatchResult {
  success: boolean;
  status: 'delivered' | 'failed' | 'simulated' | 'disabled';
  error?: string;
  responseCode?: number;
  message: string;
}

/**
 * Dispatches an automatic Discord Webhook notification for a new candidate registration
 */
export async function dispatchDiscordWebhook(
  candidate: CandidateEnrollment
): Promise<WebhookDispatchResult> {
  const config = getWebhookConfig();

  // Play audio alert if enabled
  if (config.notifySound) {
    playAdminNotificationSound();
  }

  // Trigger desktop alert if enabled
  if (config.notifyDesktop) {
    sendDesktopNotification(
      `🔔 New Cambridge Registration: ${candidate.discord}`,
      `${candidate.subjects.length} subjects enrolled (${candidate.email})`
    );
  }

  // Broadcast custom event for in-app alert banner
  try {
    window.dispatchEvent(
      new CustomEvent('cie:new-candidate-registration', {
        detail: candidate,
      })
    );
  } catch {
    // window event dispatch error safe
  }

  if (!config.enabled) {
    addWebhookLog({
      candidateId: candidate.id,
      candidateDiscord: candidate.discord,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      status: 'simulated',
      url: 'Disabled in Admin Settings',
      payloadSummary: `${candidate.subjects.length} subjects for ${candidate.discord}`,
      errorMessage: 'Automatic webhook dispatch is toggled off.',
    });

    return {
      success: true,
      status: 'disabled',
      message: 'Automatic webhook dispatch is currently paused in admin settings.',
    };
  }

  const trimmedUrl = config.url ? config.url.trim() : '';

  // If no custom URL is provided, log simulated dispatch
  if (!trimmedUrl) {
    const log = addWebhookLog({
      candidateId: candidate.id,
      candidateDiscord: candidate.discord,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      status: 'simulated',
      url: 'Simulated (No Webhook URL configured)',
      payloadSummary: `${candidate.subjects.length} subjects for ${candidate.discord}`,
      errorMessage: 'Local simulation active. Add Discord Webhook URL in Admin Registry to dispatch to live Discord channel.',
    });

    return {
      success: true,
      status: 'simulated',
      message: 'Registration logged and internal admin alert triggered (Configure Discord Webhook URL in Admin Settings for channel dispatch).',
    };
  }

  const payload = buildDiscordWebhookPayload(candidate);

  try {
    // Standard Discord Webhook POST
    const response = await fetch(trimmedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 204) {
      addWebhookLog({
        candidateId: candidate.id,
        candidateDiscord: candidate.discord,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        status: 'delivered',
        url: trimmedUrl.replace(/(\/webhooks\/\d+\/)[^/]+/, '$1••••••••'),
        responseCode: response.status,
        payloadSummary: `${candidate.subjects.length} subjects for ${candidate.discord}`,
      });

      return {
        success: true,
        status: 'delivered',
        responseCode: response.status,
        message: 'Discord webhook successfully delivered to admin channel!',
      };
    } else {
      const errorText = await response.text().catch(() => 'HTTP error ' + response.status);
      addWebhookLog({
        candidateId: candidate.id,
        candidateDiscord: candidate.discord,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        status: 'failed',
        url: trimmedUrl.replace(/(\/webhooks\/\d+\/)[^/]+/, '$1••••••••'),
        responseCode: response.status,
        errorMessage: errorText,
        payloadSummary: `${candidate.subjects.length} subjects for ${candidate.discord}`,
      });

      return {
        success: false,
        status: 'failed',
        responseCode: response.status,
        error: errorText,
        message: `Discord webhook delivery failed (HTTP ${response.status}). Check webhook URL.`,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    addWebhookLog({
      candidateId: candidate.id,
      candidateDiscord: candidate.discord,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      status: 'failed',
      url: trimmedUrl.replace(/(\/webhooks\/\d+\/)[^/]+/, '$1••••••••'),
      errorMessage: errorMsg,
      payloadSummary: `${candidate.subjects.length} subjects for ${candidate.discord}`,
    });

    return {
      success: false,
      status: 'failed',
      error: errorMsg,
      message: `Webhook dispatch failed (${errorMsg}). Verify URL format and network connectivity.`,
    };
  }
}

/**
 * Dispatches a test webhook notification
 */
export async function testDiscordWebhook(customUrl?: string): Promise<WebhookDispatchResult> {
  const testCandidate: CandidateEnrollment = {
    id: `CIE-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    email: 'admin-test@cambridge.edu',
    discord: '@ExamAdmin_Test',
    candidateName: 'Test Candidate Registration',
    centerNumber: 'EG042',
    subjects: [
      {
        code: '0580',
        name: 'Mathematics',
        tier: 'Extended',
        selectedPapers: ['Paper 2 (Extended)', 'Paper 4 (Extended)'],
      },
      {
        code: '0620',
        name: 'Chemistry',
        tier: 'Extended',
        selectedPapers: ['Paper 2 (Multiple Choice)', 'Paper 4 (Theory)', 'Paper 6 (Alt to Practical)'],
      },
    ],
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
    status: 'Pending Admin DM',
  };

  const currentConfig = getWebhookConfig();
  if (customUrl !== undefined) {
    saveWebhookConfig({ url: customUrl });
  }

  const result = await dispatchDiscordWebhook(testCandidate);

  // restore if temporary
  if (customUrl !== undefined && customUrl !== currentConfig.url) {
    saveWebhookConfig({ url: currentConfig.url });
  }

  return result;
}
