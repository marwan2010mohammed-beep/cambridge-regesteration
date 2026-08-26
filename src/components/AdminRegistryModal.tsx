import React, { useState, useEffect, useRef } from 'react';
import { CandidateEnrollment, ExamSubject, WebhookConfig, WebhookDispatchLog } from '../types';
import { generateDiscordDMTemplate, DMTemplateType, DM_TEMPLATE_OPTIONS } from '../utils/discordDmGenerator';
import { ChartAreaInteractive } from './ChartAreaInteractive';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getWebhookConfig,
  saveWebhookConfig,
  getWebhookLogs,
  clearWebhookLogs,
  testDiscordWebhook,
  dispatchDiscordWebhook,
  requestDesktopNotificationPermission,
  playAdminNotificationSound,
} from '../utils/discordWebhook';
import { getEmailConfig, saveEmailConfig, EmailConfig, testEmailConfirmation } from '../utils/emailService';
import { UiverseButton } from './UiverseButton';
import { UiverseLoader } from './UiverseLoader';
import {
  Copy,
  Check,
  Mail,
  MessageSquare,
  Download,
  Trash2,
  Search,
  Lock,
  Unlock,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  UserCheck,
  LogOut,
  AlertCircle,
  FileText,
  Send,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Edit3,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Settings,
  Activity,
  BarChart3,
  RefreshCw,
  Zap,
  AlertTriangle,
} from 'lucide-react';

interface AdminRegistryModalProps {
  enrollments: CandidateEnrollment[];
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: CandidateEnrollment['status']) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  subjects?: ExamSubject[];
  preApprovedRoster: { email: string; discord: string; candidateName?: string }[];
  onUpdatePreApprovedRoster: (roster: { email: string; discord: string; candidateName?: string }[]) => void;
}

// Authorized Admin Accounts
export const AUTHORIZED_ADMINS = [
  { username: 'admin', password: 'cambridge2026', role: 'Super Administrator', badge: 'SUPERUSER' },
  { username: 'owner', password: 'cie_admin_2026', role: 'Site Owner', badge: 'OWNER' },
  { username: 'headmaster', password: 'exams2026', role: 'Exam Officer', badge: 'OFFICER' },
  { username: 'director', password: 'admin2026', role: 'Lead Administrator', badge: 'DIRECTOR' },
];

const ADMIN_SESSION_STORAGE_KEY = 'cambridge_admin_auth_user_v1';

export function AdminRegistryModal({
  enrollments,
  onClose,
  onUpdateStatus,
  onDeleteRecord,
  onClearAll,
  subjects,
  preApprovedRoster,
  onUpdatePreApprovedRoster,
}: AdminRegistryModalProps) {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [inputUsername, setInputUsername] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Tab State
  const [activeAdminTab, setActiveAdminTab] = useState<'candidates' | 'analytics' | 'webhooks' | 'roster'>('candidates');

  // Roster Management Local States
  const [newRosterEmail, setNewRosterEmail] = useState('');
  const [newRosterDiscord, setNewRosterDiscord] = useState('');
  const [newRosterName, setNewRosterName] = useState('');
  const [rosterSearchTerm, setRosterSearchTerm] = useState('');
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [rosterSuccess, setRosterSuccess] = useState<string | null>(null);

  // Registry State
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedDmId, setCopiedDmId] = useState<string | null>(null);
  const [activeDmCandidate, setActiveDmCandidate] = useState<CandidateEnrollment | null>(null);
  const [activeDmTemplateType, setActiveDmTemplateType] = useState<DMTemplateType>('verification');
  const [customDmText, setCustomDmText] = useState<string>('');
  const [dmCopiedSuccess, setDmCopiedSuccess] = useState(false);
  const [resendingWebhookId, setResendingWebhookId] = useState<string | null>(null);
  const [resendWebhookFeedback, setResendWebhookFeedback] = useState<string | null>(null);

  // EmailJS Settings State
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => getEmailConfig());
  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testEmailMessage, setTestEmailMessage] = useState<string>('');
  
  // Webhook Settings State
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(() => getWebhookConfig());
  const [webhookLogs, setWebhookLogs] = useState<WebhookDispatchLog[]>(() => getWebhookLogs());
  const [testWebhookStatus, setTestWebhookStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testWebhookMessage, setTestWebhookMessage] = useState<string>('');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Refresh logs on open/focus
    setWebhookLogs(getWebhookLogs());
    setWebhookConfig(getWebhookConfig());
  }, []);

  useEffect(() => {
    if (!currentUser && !isAuthenticating) {
      usernameInputRef.current?.focus();
    }
  }, [currentUser, isAuthenticating]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const userClean = inputUsername.trim().toLowerCase();
    const passClean = inputPassword.trim();

    const matchedAccount = AUTHORIZED_ADMINS.find(
      (a) => a.username.toLowerCase() === userClean && a.password === passClean
    );

    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      if (matchedAccount) {
        setCurrentUser(matchedAccount.username);
        try {
          sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, matchedAccount.username);
        } catch {
          // Ignored
        }
        setInputPassword('');
        setAuthError(null);
      } else {
        setLoginAttempts((prev) => prev + 1);
        setAuthError('Access Denied: Invalid administrator username or password.');
      }
    }, 650);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    } catch {
      // Ignored
    }
    setInputPassword('');
    setAuthError(null);
  };

  const subjectDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {};
    enrollments.forEach((env) => {
      env.subjects.forEach((sub) => {
        const key = `[${sub.code}] ${sub.name}`;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // limit to top 15 subjects
  }, [enrollments]);

  const filtered = enrollments.filter((entry) => {
    const term = searchTerm.toLowerCase();
    return (
      entry.discord.toLowerCase().includes(term) ||
      entry.email.toLowerCase().includes(term) ||
      (entry.candidateName && entry.candidateName.toLowerCase().includes(term)) ||
      (entry.centerNumber && entry.centerNumber.toLowerCase().includes(term)) ||
      entry.subjects.some((s) => s.code.includes(term) || s.name.toLowerCase().includes(term))
    );
  });

  const handleCopyDiscord = (discord: string, id: string) => {
    navigator.clipboard.writeText(discord);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickCopyDM = (entry: CandidateEnrollment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const dmText = generateDiscordDMTemplate(
      entry,
      'verification',
      currentAdminProfile?.role || 'Admin Officer',
      subjects
    );
    navigator.clipboard.writeText(dmText);
    setCopiedDmId(entry.id);
    setTimeout(() => setCopiedDmId(null), 2500);

    // If candidate status is Pending Admin DM, automatically update to DM Sent
    if (entry.status === 'Pending Admin DM') {
      onUpdateStatus(entry.id, 'DM Sent');
    }
  };

  const handleOpenDmModal = (entry: CandidateEnrollment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveDmCandidate(entry);
    setActiveDmTemplateType('verification');
    const initialText = generateDiscordDMTemplate(
      entry,
      'verification',
      currentAdminProfile?.role || 'Admin Officer',
      subjects
    );
    setCustomDmText(initialText);
    setDmCopiedSuccess(false);
  };

  const handleSwitchTemplateType = (type: DMTemplateType) => {
    if (!activeDmCandidate) return;
    setActiveDmTemplateType(type);
    const text = generateDiscordDMTemplate(
      activeDmCandidate,
      type,
      currentAdminProfile?.role || 'Admin Officer',
      subjects
    );
    setCustomDmText(text);
    setDmCopiedSuccess(false);
  };

  const handleCopyModalDmText = (markStatusSent = true) => {
    if (!activeDmCandidate) return;
    navigator.clipboard.writeText(customDmText);
    setDmCopiedSuccess(true);
    setTimeout(() => setDmCopiedSuccess(false), 2500);

    if (markStatusSent || activeDmCandidate.status === 'Pending Admin DM') {
      onUpdateStatus(activeDmCandidate.id, 'DM Sent');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Discord Username',
      'Personal Email',
      'Candidate Name',
      'Center',
      'Subjects Count',
      'Subjects & Papers Enrolled',
      'Status',
      'Timestamp',
    ];
    const rows = enrollments.map((e) => [
      e.id,
      `"${e.discord}"`,
      `"${e.email}"`,
      `"${e.candidateName || 'N/A'}"`,
      `"${e.centerNumber || 'N/A'}"`,
      e.subjects.length,
      `"${e.subjects.map((s) => `${s.code} ${s.name} [${s.selectedPapers && s.selectedPapers.length > 0 ? s.selectedPapers.join(', ') : 'All Papers'}]`).join('; ')}"`,
      `"${e.status}"`,
      `"${e.timestamp}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cambridge_real_candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveWebhookSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingWebhook(true);
    const updated = saveWebhookConfig(webhookConfig);
    setWebhookConfig(updated);
    setTimeout(() => {
      setIsSavingWebhook(false);
    }, 600);
  };

  const handleTestWebhookDispatch = async () => {
    setTestWebhookStatus('testing');
    setTestWebhookMessage('Dispatching test payload to Discord webhook endpoint...');
    try {
      const result = await testDiscordWebhook(webhookConfig.url);
      setWebhookLogs(getWebhookLogs());
      if (result.success && result.status === 'delivered') {
        setTestWebhookStatus('success');
        setTestWebhookMessage('✓ Test webhook delivered successfully to your Discord channel!');
      } else if (result.status === 'simulated') {
        setTestWebhookStatus('success');
        setTestWebhookMessage('✓ Test payload generated and internal admin audio chime played (Paste a live Discord Webhook URL for channel delivery).');
      } else {
        setTestWebhookStatus('failed');
        setTestWebhookMessage(`✕ Webhook delivery failed: ${result.error || result.message}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestWebhookStatus('failed');
      setTestWebhookMessage(`✕ Webhook error: ${msg}`);
    }
  };

  const handleToggleDesktopAlerts = async () => {
    if (!webhookConfig.notifyDesktop) {
      const granted = await requestDesktopNotificationPermission();
      const updated = saveWebhookConfig({ notifyDesktop: granted });
      setWebhookConfig(updated);
      if (!granted) {
        alert('Desktop notification permission was denied or is unsupported by your browser.');
      }
    } else {
      const updated = saveWebhookConfig({ notifyDesktop: false });
      setWebhookConfig(updated);
    }
  };

  const handleResendWebhookForCandidate = async (entry: CandidateEnrollment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setResendingWebhookId(entry.id);
    setResendWebhookFeedback(null);
    try {
      const result = await dispatchDiscordWebhook(entry);
      setWebhookLogs(getWebhookLogs());
      if (result.success) {
        setResendWebhookFeedback(`✓ Webhook notification triggered for ${entry.discord}!`);
      } else {
        setResendWebhookFeedback(`✕ Webhook failed: ${result.error || result.message}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setResendWebhookFeedback(`✕ Webhook error: ${msg}`);
    } finally {
      setTimeout(() => {
        setResendingWebhookId(null);
      }, 1000);
      setTimeout(() => {
        setResendWebhookFeedback(null);
      }, 4000);
    }
  };

  const handleSaveEmailSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveEmailConfig(emailConfig);
    alert('EmailJS API Settings saved locally.');
  };

  const handleTestEmail = async () => {
    setTestEmailStatus('testing');
    setTestEmailMessage('Dispatching automated email test...');
    
    try {
      const result = await testEmailConfirmation(emailConfig);
      setTestEmailStatus(result.success ? 'success' : 'failed');
      setTestEmailMessage(result.message);
    } catch (err: any) {
      setTestEmailStatus('failed');
      setTestEmailMessage(err.message);
    }
  };

  const handleClearWebhookLogs = () => {
    if (confirm('Clear all webhook dispatch history logs?')) {
      clearWebhookLogs();
      setWebhookLogs([]);
    }
  };

  const handleAddRosterEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setRosterError(null);
    setRosterSuccess(null);

    const emailClean = newRosterEmail.trim().toLowerCase();
    let discordClean = newRosterDiscord.trim();
    if (!discordClean.startsWith('@')) {
      discordClean = `@${discordClean}`;
    }

    if (!emailClean || !newRosterDiscord.trim()) {
      setRosterError('Email and Discord username are both required.');
      return;
    }

    // Check if duplicate already exists in the roster
    const exists = preApprovedRoster.some(
      (item) => item.email.toLowerCase() === emailClean || item.discord.toLowerCase() === discordClean.toLowerCase()
    );

    if (exists) {
      setRosterError('This email address or Discord username is already in the pre-approved roster.');
      return;
    }

    const newEntry = {
      email: emailClean,
      discord: discordClean,
      candidateName: newRosterName.trim() || undefined,
    };

    onUpdatePreApprovedRoster([...preApprovedRoster, newEntry]);
    setNewRosterEmail('');
    setNewRosterDiscord('');
    setNewRosterName('');
    setRosterSuccess(`✓ Successfully added "${discordClean}" to the pre-approved roster!`);
    setTimeout(() => setRosterSuccess(null), 4000);
  };

  const handleRemoveRosterEntry = (email: string, discord: string) => {
    if (confirm(`Are you sure you want to remove ${discord} from the pre-approved candidate roster?`)) {
      const filtered = preApprovedRoster.filter(
        (item) => !(item.email.toLowerCase() === email.toLowerCase() && item.discord.toLowerCase() === discord.toLowerCase())
      );
      onUpdatePreApprovedRoster(filtered);
      setRosterSuccess('Candidate entry removed from pre-approved roster.');
      setTimeout(() => setRosterSuccess(null), 3000);
    }
  };

  const currentAdminProfile = AUTHORIZED_ADMINS.find((a) => a.username === currentUser);

  return (
    <div
      className="terminal-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dialog-title"
      onClick={onClose}
    >
      <div
        className="terminal-modal terminal-modal--wide"
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: 'var(--font-mono)',
          maxWidth: '820px',
          width: '95%',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid var(--line)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentUser ? (
              <Unlock size={16} color="#a3e635" />
            ) : (
              <Lock size={16} color="#ef4444" />
            )}
            <span
              id="admin-dialog-title"
              style={{
                fontSize: '12px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              {currentUser
                ? '[ SECURE DISPATCH CONSOLE • REGISTERED CANDIDATES ]'
                : '[ RESTRICTED ACCESS • ADMIN AUTHENTICATION REQUIRED ]'}
            </span>
            {currentUser && (
              <span
                style={{
                  fontSize: '12px',
                  background: 'rgba(163, 230, 53, 0.18)',
                  border: '1px solid rgba(163, 230, 53, 0.4)',
                  color: '#a3e635',
                  padding: '2px 6px',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                }}
              >
                UNLOCKED: {enrollments.length} CANDIDATES
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '4px 8px',
              fontFamily: 'var(--font-mono)',
            }}
            aria-label="Close admin dialog"
          >
            [X]
          </button>
        </div>

        {/* LOCKED VIEW: Login Gateway */}
        {!currentUser ? (
          <div>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <ShieldCheck size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.5 }}>
                <strong>Access Restricted to Verified Cambridge Session Administrators.</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-dim)' }}>
                  This console contains sensitive candidate registrations, personal emails, and Discord communication tags. Enter authorized administrator credentials to unlock the registry.
                </p>
              </div>
            </div>

            {/* Login Form or Loading State */}
            {isAuthenticating ? (
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--line-strong)',
                  padding: '36px 20px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <UiverseLoader label="Authenticating Administrator PIN & Credentials..." size="md" />
              </div>
            ) : (
              <form
                onSubmit={handleLogin}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--line-strong)',
                  padding: '20px',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div>
                  <label
                    htmlFor="admin-username-input"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      letterSpacing: '0.12em',
                      color: 'var(--text-dim)',
                      marginBottom: '6px',
                    }}
                  >
                    ADMINISTRATOR USERNAME:
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--line)',
                      padding: '8px 12px',
                    }}
                  >
                    <UserCheck size={14} color="var(--text-dim)" style={{ marginRight: '8px' }} />
                    <input
                      ref={usernameInputRef}
                      id="admin-username-input"
                      type="text"
                      placeholder="Enter username (e.g. admin or owner)..."
                      value={inputUsername}
                      onChange={(e) => setInputUsername(e.target.value)}
                      required
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-password-input"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      letterSpacing: '0.12em',
                      color: 'var(--text-dim)',
                      marginBottom: '6px',
                    }}
                  >
                    SECURITY PASSWORD:
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--line)',
                      padding: '8px 12px',
                    }}
                  >
                    <Key size={14} color="var(--text-dim)" style={{ marginRight: '8px' }} />
                    <input
                      id="admin-password-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password..."
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value)}
                      required
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 4px',
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div
                    style={{
                      color: '#f87171',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '8px 10px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <AlertCircle size={14} />
                    <span>{authError}</span>
                  </div>
                )}

                <UiverseButton
                  type="submit"
                  variant="default"
                  size="md"
                  fullWidth
                  icon={<Unlock size={14} />}
                >
                  Unlock Candidate Registry
                </UiverseButton>
              </form>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <UiverseButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </UiverseButton>
            </div>
          </div>
        ) : (
          /* UNLOCKED VIEW: Full Candidates Registry */
          <div>
            {/* Authenticated Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(163, 230, 53, 0.08)',
                border: '1px solid rgba(163, 230, 53, 0.3)',
                padding: '8px 12px',
                marginBottom: '14px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#ffffff' }}>
                <ShieldCheck size={15} color="#a3e635" />
                <span>
                  LOGGED IN AS: <strong style={{ color: '#a3e635' }}>{currentUser}</strong> ({currentAdminProfile?.role || 'Admin'})
                </span>
                <span style={{ fontSize: '12px', background: 'rgba(163,230,53,0.2)', color: '#a3e635', padding: '1px 5px' }}>
                  {currentAdminProfile?.badge || 'VERIFIED'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--line)',
                  color: 'var(--text-dim)',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Lock admin panel & sign out"
              >
                <LogOut size={12} />
                LOCK & LOGOUT
              </button>
            </div>

            {/* Admin Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid var(--line)',
                marginBottom: '14px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveAdminTab('candidates')}
                style={{
                  background: activeAdminTab === 'candidates' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${activeAdminTab === 'candidates' ? '#ffffff' : 'transparent'}`,
                  color: activeAdminTab === 'candidates' ? '#ffffff' : 'var(--text-dim)',
                  padding: '8px 14px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <UserCheck size={13} />
                <span>CANDIDATES REGISTRY ({enrollments.length})</span>
                {enrollments.filter((e) => e.status === 'Pending Admin DM').length > 0 && (
                  <span
                    style={{
                      background: '#fde047',
                      color: '#000',
                      padding: '1px 5px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {enrollments.filter((e) => e.status === 'Pending Admin DM').length} PENDING DM
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveAdminTab('analytics')}
                style={{
                  background: activeAdminTab === 'analytics' ? 'rgba(234, 179, 8, 0.18)' : 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${activeAdminTab === 'analytics' ? '#eab308' : 'transparent'}`,
                  color: activeAdminTab === 'analytics' ? '#ffffff' : 'var(--text-dim)',
                  padding: '8px 14px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <BarChart3 size={13} color={activeAdminTab === 'analytics' ? '#eab308' : 'var(--text-dim)'} />
                <span>SUBJECT ANALYTICS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveAdminTab('webhooks');
                  setWebhookLogs(getWebhookLogs());
                }}
                style={{
                  background: activeAdminTab === 'webhooks' ? 'rgba(88, 101, 242, 0.18)' : 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${activeAdminTab === 'webhooks' ? '#5865F2' : 'transparent'}`,
                  color: activeAdminTab === 'webhooks' ? '#ffffff' : 'var(--text-dim)',
                  padding: '8px 14px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Bell size={13} color={activeAdminTab === 'webhooks' ? '#5865F2' : 'var(--text-dim)'} />
                <span>DISCORD WEBHOOK & ALERTS</span>
                {webhookConfig.enabled ? (
                  <span
                    style={{
                      background: 'rgba(74, 222, 128, 0.2)',
                      color: '#4ade80',
                      padding: '1px 5px',
                      fontSize: '12px',
                      border: '1px solid rgba(74, 222, 128, 0.4)',
                    }}
                  >
                    ACTIVE
                  </span>
                ) : (
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      padding: '1px 5px',
                      fontSize: '12px',
                    }}
                  >
                    PAUSED
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveAdminTab('roster');
                }}
                style={{
                  background: activeAdminTab === 'roster' ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${activeAdminTab === 'roster' ? '#06b6d4' : 'transparent'}`,
                  color: activeAdminTab === 'roster' ? '#ffffff' : 'var(--text-dim)',
                  padding: '8px 14px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <UserCheck size={13} color={activeAdminTab === 'roster' ? '#06b6d4' : 'var(--text-dim)'} />
                <span>PRE-APPROVED ROSTER ({preApprovedRoster.length})</span>
              </button>
            </div>

            {resendWebhookFeedback && (
              <div
                style={{
                  background: resendWebhookFeedback.startsWith('✓') ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${resendWebhookFeedback.startsWith('✓') ? 'rgba(74, 222, 128, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  color: resendWebhookFeedback.startsWith('✓') ? '#a3e635' : '#f87171',
                  padding: '8px 12px',
                  fontSize: '11px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {resendWebhookFeedback.startsWith('✓') ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                <span>{resendWebhookFeedback}</span>
              </div>
            )}

            {/* TAB 1: CANDIDATES REGISTRY */}
            {activeAdminTab === 'candidates' && (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '14px' }}>
                  Real candidates who registered with their personal email and Discord tag are listed below. Click <strong>COPY DISCORD</strong> to quickly reach out to each candidate.
                </p>

            {/* Controls Toolbar */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--line-strong)',
                  padding: '6px 10px',
                  flex: 1,
                  minWidth: '220px',
                }}
              >
                <Search size={14} color="var(--text-dim)" style={{ marginRight: '8px' }} />
                <input
                  type="text"
                  placeholder="Filter by Discord, Email, Name, Center, or Subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    outline: 'none',
                    width: '100%',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href="https://discord.gg/YD3hR9Sn54"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(88, 101, 242, 0.2)',
                    border: '1px solid rgba(88, 101, 242, 0.5)',
                    color: '#ffffff',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    letterSpacing: '0.08em',
                    textDecoration: 'none',
                  }}
                  title="Open Official Discord Server in new tab"
                >
                  <MessageSquare size={13} color="#818cf8" />
                  DISCORD SERVER ↗
                </a>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'var(--fill-solid)',
                    border: '1px solid var(--line-strong)',
                    color: '#ffffff',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    letterSpacing: '0.08em',
                  }}
                  title="Export all records as CSV"
                >
                  <Download size={13} />
                  EXPORT CSV
                </button>

                {enrollments.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'transparent',
                      border: '1px solid var(--line)',
                      color: 'var(--text-dim)',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                    }}
                    title="Clear all saved records"
                  >
                    <Trash2 size={12} />
                    CLEAR LOGS
                  </button>
                )}
              </div>
            </div>

            {/* Candidate List */}
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: '30px 20px',
                  textAlign: 'center',
                  border: '1px dashed var(--line)',
                  color: 'var(--text-dim)',
                  fontSize: '12px',
                  marginBottom: '16px',
                }}
              >
                No matching candidate registration records found.
              </div>
            ) : (
              <div
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '16px',
                  paddingRight: '4px',
                }}
              >
                {filtered.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      border: '1px solid var(--line-strong)',
                      background: 'rgba(255,255,255,0.03)',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {/* Top Row: IDs & Status */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '6px',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        paddingBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-dimmer)' }}>[{entry.id}]</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{entry.timestamp}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={entry.status}
                          onChange={(e) => onUpdateStatus(entry.id, e.target.value as CandidateEnrollment['status'])}
                          style={{
                            background:
                              entry.status === 'Enrolled & Verified'
                                ? 'rgba(46, 204, 113, 0.15)'
                                : entry.status === 'DM Sent'
                                ? 'rgba(52, 152, 219, 0.15)'
                                : 'rgba(241, 196, 15, 0.15)',
                            border: '1px solid var(--line)',
                            color:
                              entry.status === 'Enrolled & Verified'
                                ? '#a3e635'
                                : entry.status === 'DM Sent'
                                ? '#60a5fa'
                                : '#fde047',
                            fontSize: '12px',
                            padding: '6px 10px',
                            minHeight: '38px',
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.08em',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="Pending Admin DM" style={{ background: '#111', color: '#fff' }}>Pending Admin DM</option>
                          <option value="DM Sent" style={{ background: '#111', color: '#fff' }}>DM Sent</option>
                          <option value="Enrolled & Verified" style={{ background: '#111', color: '#fff' }}>Enrolled & Verified</option>
                        </select>

                        {/* Quick 1-Click Copy Discord DM Template */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickCopyDM(entry, e)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: copiedDmId === entry.id ? 'rgba(74, 222, 128, 0.2)' : 'rgba(88, 101, 242, 0.18)',
                            border: `1px solid ${copiedDmId === entry.id ? 'rgba(74, 222, 128, 0.5)' : 'rgba(88, 101, 242, 0.45)'}`,
                            color: copiedDmId === entry.id ? '#a3e635' : '#c7d2fe',
                            fontSize: '12px',
                            padding: '6px 12px',
                            minHeight: '38px',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          title="Generate & copy pre-formatted Discord direct message template for this candidate to clipboard (auto-marks status as DM Sent)"
                        >
                          {copiedDmId === entry.id ? (
                            <>
                              <Check size={13} color="#a3e635" />
                              <span style={{ fontWeight: 700 }}>DM COPIED!</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare size={13} color="#5865F2" />
                              <span>COPY DM</span>
                            </>
                          )}
                        </button>

                        {/* Open DM Template Customizer / Previewer */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenDmModal(entry, e)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid var(--line)',
                            color: '#ffffff',
                            fontSize: '12px',
                            padding: '6px 12px',
                            minHeight: '38px',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                          }}
                          title="Preview, customize, and generate Discord DM message variations for this candidate"
                        >
                          <Edit3 size={13} />
                          <span>PREVIEW DM</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const { generateStatementOfEntryPDF } = await import('../utils/pdfGenerator');
                            generateStatementOfEntryPDF(entry, subjects);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            color: '#60a5fa',
                            fontSize: '12px',
                            padding: '6px 12px',
                            minHeight: '38px',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                          }}
                          title="Generate & download official Cambridge Statement of Entry PDF for this candidate"
                        >
                          <FileText size={13} />
                          <span>PDF SOE</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteRecord(entry.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            cursor: 'pointer',
                            padding: '6px 10px',
                            minWidth: '38px',
                            minHeight: '38px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Remove candidate record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Discord & Email */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(88, 101, 242, 0.18)',
                            border: '1px solid rgba(88, 101, 242, 0.45)',
                            padding: '4px 8px',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <MessageSquare size={13} color="#5865F2" />
                          <span>{entry.discord}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyDiscord(entry.discord, entry.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid var(--line)',
                            color: '#ffffff',
                            fontSize: '12px',
                            padding: '4px 6px',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                          }}
                          title="Copy Discord username to clipboard"
                        >
                          {copiedId === entry.id ? (
                            <>
                              <Check size={11} color="#a3e635" />
                              <span style={{ color: '#a3e635' }}>COPIED</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>COPY DISCORD</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenDmModal(entry, e)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(88, 101, 242, 0.12)',
                            border: '1px solid rgba(88, 101, 242, 0.35)',
                            color: '#c7d2fe',
                            fontSize: '12px',
                            padding: '4px 6px',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                          }}
                          title="Open Discord DM dispatch template generator"
                        >
                          <Send size={10} color="#5865F2" />
                          <span>DM TEMPLATE</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleResendWebhookForCandidate(entry, e)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: resendingWebhookId === entry.id ? 'rgba(234, 179, 8, 0.25)' : 'rgba(234, 179, 8, 0.1)',
                            border: '1px solid rgba(234, 179, 8, 0.4)',
                            color: '#fde047',
                            fontSize: '12px',
                            padding: '4px 6px',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                          }}
                          title="Trigger Discord Webhook alert for this candidate now"
                        >
                          <Zap size={10} color="#fde047" />
                          <span>{resendingWebhookId === entry.id ? 'SENDING...' : 'TRIGGER WEBHOOK'}</span>
                        </button>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        PERSONAL EMAIL: <strong style={{ color: '#ffffff' }}>{entry.email}</strong>
                      </div>
                    </div>

                    {/* Candidate Name / Center Info if available */}
                    {(entry.candidateName || entry.centerNumber) && (
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        {entry.candidateName && <span>NAME: <strong style={{ color: '#fff' }}>{entry.candidateName}</strong></span>}
                        {entry.candidateName && entry.centerNumber && <span> • </span>}
                        {entry.centerNumber && <span>CENTER: <strong style={{ color: '#fff' }}>{entry.centerNumber}</strong></span>}
                      </div>
                    )}

                    {/* Enrolled Papers List */}
                    <div style={{ marginTop: '2px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-dimmer)', letterSpacing: '0.12em', marginBottom: '4px' }}>
                        ENROLLED PAPERS ({entry.subjects.length}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {entry.subjects.map((sub) => {
                          const papersSummary =
                            sub.selectedPapers && sub.selectedPapers.length > 0
                              ? sub.selectedPapers
                                  .map((p) => {
                                    const m = p.match(/Paper\s*\d+/i);
                                    return m ? m[0] : p;
                                  })
                                  .join(', ')
                              : 'All Papers';
                          return (
                            <span
                              key={sub.code}
                              style={{
                                fontSize: '12px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid var(--line)',
                                padding: '3px 7px',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <strong style={{ color: '#60a5fa' }}>[{sub.code}]</strong>
                              <span>{sub.name}</span>
                              <span
                                style={{
                                  color: '#a3e635',
                                  fontSize: '9px',
                                  fontWeight: 600,
                                  background: 'rgba(163,230,53,0.12)',
                                  padding: '1px 4px',
                                }}
                              >
                                {papersSummary}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB ANALYTICS: SUBJECT DISTRIBUTION */}
        {activeAdminTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
            <ChartAreaInteractive />

            <div
              style={{
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                padding: '12px 14px',
                fontSize: '11px',
                color: '#fef08a',
                lineHeight: 1.5,
              }}
            >
              <strong>Subject Distribution Analytics</strong>
              <p style={{ margin: '4px 0 0', color: 'var(--text-dim)' }}>
                Visualizing the distribution of Cambridge IGCSE subjects selected by candidates (Top 15 subjects by enrollment volume).
              </p>
            </div>

            {subjectDistribution.length > 0 ? (
              <div style={{ flex: 1, minHeight: '350px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--line)', borderRadius: '6px', padding: '16px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }} 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      axisLine={{ stroke: '#444' }}
                      tickLine={{ stroke: '#444' }}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                      axisLine={{ stroke: '#444' }}
                      tickLine={{ stroke: '#444' }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        background: '#1e1f22', 
                        border: '1px solid #3f4147', 
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: '#fff'
                      }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Enrolled Candidates" 
                      fill="#eab308" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                No subject enrollment data available yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISCORD WEBHOOK & ADMIN ALERTS */}
        {activeAdminTab === 'webhooks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                background: 'rgba(88, 101, 242, 0.1)',
                border: '1px solid rgba(88, 101, 242, 0.35)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={16} color="#5865F2" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                    AUTOMATIC DISCORD WEBHOOK DISPATCH
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    background: webhookConfig.enabled ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: webhookConfig.enabled ? '#4ade80' : '#f87171',
                    border: `1px solid ${webhookConfig.enabled ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  }}
                >
                  {webhookConfig.enabled ? '● REAL-TIME DISPATCH ENABLED' : '○ DISPATCH PAUSED'}
                </span>
              </div>

              <p style={{ fontSize: '11px', color: '#b5bac1', lineHeight: 1.5, margin: 0 }}>
                When a candidate submits their Cambridge registration, an automatic HTTP POST is instantly dispatched to your Discord administrator channel with candidate Discord handle, verified email, syllabus codes, and selected components.
              </p>

              <form onSubmit={handleSaveWebhookSettings} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#949ba4', marginBottom: '4px', letterSpacing: '0.08em' }}>
                    DISCORD CHANNEL WEBHOOK URL:
                  </label>
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/123456789/abcdef..."
                    value={webhookConfig.url}
                    onChange={(e) => setWebhookConfig((prev) => ({ ...prev, url: e.target.value }))}
                    style={{
                      width: '100%',
                      background: '#1e1f22',
                      border: '1px solid #3f4147',
                      color: '#ffffff',
                      padding: '10px 12px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '10px', color: '#949ba4', marginTop: '3px', display: 'block' }}>
                    💡 To create: Discord Channel Settings → Integrations → Webhooks → New Webhook → Copy Webhook URL.
                  </span>
                </div>

                {/* Notification Toggles */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#ffffff', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={webhookConfig.enabled}
                      onChange={(e) => {
                        const updated = saveWebhookConfig({ enabled: e.target.checked });
                        setWebhookConfig(updated);
                      }}
                    />
                    <span>Enable Webhook Dispatch</span>
                  </label>

                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#ffffff', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={webhookConfig.notifySound}
                      onChange={(e) => {
                        const updated = saveWebhookConfig({ notifySound: e.target.checked });
                        setWebhookConfig(updated);
                      }}
                    />
                    <span>Play Admin Audio Alert</span>
                  </label>

                  <button
                    type="button"
                    onClick={playAdminNotificationSound}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--line)',
                      color: '#ffffff',
                      fontSize: '10px',
                      padding: '2px 8px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Volume2 size={11} />
                    <span>Test Audio Alert</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleDesktopAlerts}
                    style={{
                      background: webhookConfig.notifyDesktop ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${webhookConfig.notifyDesktop ? 'rgba(74,222,128,0.4)' : 'var(--line)'}`,
                      color: webhookConfig.notifyDesktop ? '#a3e635' : '#ffffff',
                      fontSize: '10px',
                      padding: '2px 8px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Bell size={11} />
                    <span>{webhookConfig.notifyDesktop ? '✓ Desktop Alerts ON' : 'Enable Desktop Alerts'}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    style={{
                      background: '#5865F2',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '8px 16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Settings size={12} />
                    <span>{isSavingWebhook ? '✓ SAVED!' : 'SAVE WEBHOOK SETTINGS'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestWebhookDispatch}
                    disabled={testWebhookStatus === 'testing'}
                    style={{
                      background: 'rgba(234, 179, 8, 0.15)',
                      border: '1px solid rgba(234, 179, 8, 0.4)',
                      color: '#fde047',
                      fontSize: '11px',
                      padding: '8px 16px',
                      cursor: testWebhookStatus === 'testing' ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Zap size={12} />
                    <span>{testWebhookStatus === 'testing' ? 'SENDING TEST PAYLOAD...' : 'DISPATCH TEST WEBHOOK'}</span>
                  </button>
                </div>

                {testWebhookMessage && (
                  <div
                    style={{
                      padding: '8px 10px',
                      background: testWebhookStatus === 'success' ? 'rgba(74, 222, 128, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: `1px solid ${testWebhookStatus === 'success' ? 'rgba(74, 222, 128, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                      color: testWebhookStatus === 'success' ? '#a3e635' : '#f87171',
                      fontSize: '11px',
                      marginTop: '4px',
                    }}
                  >
                    {testWebhookMessage}
                  </div>
                )}
              </form>
            </div>

            
            {/* EmailJS API Settings */}
            <div
              style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} color="#eab308" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                    AUTOMATED EMAIL CONFIRMATION (API)
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    background: emailConfig.enabled ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: emailConfig.enabled ? '#4ade80' : '#f87171',
                    border: `1px solid ${emailConfig.enabled ? 'rgba(74,222,128,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  }}
                >
                  {emailConfig.enabled ? '● EMAIL AUTOMATION ENABLED' : '○ EMAIL AUTOMATION PAUSED'}
                </span>
              </div>

              <p style={{ fontSize: '11px', color: '#b5bac1', lineHeight: 1.5, margin: 0 }}>
                Configure your EmailJS API keys to automatically dispatch an email summary to candidates upon registration.
              </p>

              <form onSubmit={handleSaveEmailSettings} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#949ba4', marginBottom: '4px', letterSpacing: '0.08em' }}>
                    SERVICE ID:
                  </label>
                  <input
                    type="text"
                    value={emailConfig.serviceId}
                    onChange={(e) => setEmailConfig({ ...emailConfig, serviceId: e.target.value })}
                    placeholder="e.g. service_xxxxx"
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid #3f4147',
                      borderRadius: '4px',
                      padding: '8px 10px',
                      color: '#dbdee1',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#949ba4', marginBottom: '4px', letterSpacing: '0.08em' }}>
                    TEMPLATE ID:
                  </label>
                  <input
                    type="text"
                    value={emailConfig.templateId}
                    onChange={(e) => setEmailConfig({ ...emailConfig, templateId: e.target.value })}
                    placeholder="e.g. template_xxxxx"
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid #3f4147',
                      borderRadius: '4px',
                      padding: '8px 10px',
                      color: '#dbdee1',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#949ba4', marginBottom: '4px', letterSpacing: '0.08em' }}>
                    PUBLIC KEY:
                  </label>
                  <input
                    type="password"
                    value={emailConfig.publicKey}
                    onChange={(e) => setEmailConfig({ ...emailConfig, publicKey: e.target.value })}
                    placeholder="e.g. public_xxxxx"
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid #3f4147',
                      borderRadius: '4px',
                      padding: '8px 10px',
                      color: '#dbdee1',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="enable-email-automation"
                    checked={emailConfig.enabled}
                    onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })}
                  />
                  <label htmlFor="enable-email-automation" style={{ fontSize: '11px', color: '#dbdee1', cursor: 'pointer' }}>
                    Enable automatic email dispatch for new registrations
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="submit"
                    style={{
                      background: '#5865F2',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Check size={14} />
                    <span>Save Email API Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testEmailStatus === 'testing' || !emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '8px 16px',
                      cursor: (testEmailStatus === 'testing' || !emailConfig.serviceId) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      opacity: (testEmailStatus === 'testing' || !emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) ? 0.6 : 1,
                    }}
                  >
                    <Zap size={14} />
                    <span>{testEmailStatus === 'testing' ? 'Sending...' : 'Test Email Dispatch'}</span>
                  </button>
                </div>

                {testEmailMessage && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: testEmailStatus === 'success' ? 'rgba(74, 222, 128, 0.15)' : testEmailStatus === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${testEmailStatus === 'success' ? 'rgba(74, 222, 128, 0.4)' : testEmailStatus === 'failed' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                      color: testEmailStatus === 'success' ? '#a3e635' : testEmailStatus === 'failed' ? '#f87171' : '#b5bac1',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {testEmailStatus === 'success' ? <CheckCircle2 size={14} /> : testEmailStatus === 'failed' ? <AlertTriangle size={14} /> : <div className="uiverse-loader" style={{ transform: 'scale(0.3)' }} />}
                    <span>{testEmailMessage}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Webhook Activity History Logs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#ffffff' }}>
                  <Activity size={13} color="#60a5fa" />
                  <span>RECENT WEBHOOK DISPATCH LOGS ({webhookLogs.length})</span>
                </div>

                {webhookLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearWebhookLogs}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dimmer)',
                      fontSize: '10px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Clear Activity Log
                  </button>
                )}
              </div>

              {webhookLogs.length === 0 ? (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    border: '1px dashed var(--line)',
                    color: 'var(--text-dim)',
                    fontSize: '11px',
                  }}
                >
                  No webhook triggers recorded yet. When candidates enroll, automatic logs will appear here.
                </div>
              ) : (
                <div
                  style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    border: '1px solid var(--line-strong)',
                    background: 'rgba(0,0,0,0.3)',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.06)', borderBottom: '1px solid var(--line)' }}>
                        <th style={{ padding: '6px 10px', color: '#949ba4', fontWeight: 600 }}>TIMESTAMP</th>
                        <th style={{ padding: '6px 10px', color: '#949ba4', fontWeight: 600 }}>CANDIDATE</th>
                        <th style={{ padding: '6px 10px', color: '#949ba4', fontWeight: 600 }}>STATUS</th>
                        <th style={{ padding: '6px 10px', color: '#949ba4', fontWeight: 600 }}>SUMMARY / DETAILS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {webhookLogs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '6px 10px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                            {log.timestamp}
                          </td>
                          <td style={{ padding: '6px 10px', color: '#60a5fa', fontWeight: 600 }}>
                            {log.candidateDiscord}
                          </td>
                          <td style={{ padding: '6px 10px' }}>
                            <span
                              style={{
                                fontSize: '9px',
                                padding: '1px 5px',
                                background:
                                  log.status === 'delivered'
                                    ? 'rgba(74, 222, 128, 0.2)'
                                    : log.status === 'simulated'
                                    ? 'rgba(234, 179, 8, 0.2)'
                                    : 'rgba(239, 68, 68, 0.2)',
                                color:
                                  log.status === 'delivered'
                                    ? '#4ade80'
                                    : log.status === 'simulated'
                                    ? '#fde047'
                                    : '#f87171',
                              }}
                            >
                              {log.status.toUpperCase()} {log.responseCode ? `(${log.responseCode})` : ''}
                            </span>
                          </td>
                          <td style={{ padding: '6px 10px', color: log.errorMessage ? '#f87171' : 'var(--text-dim)' }}>
                            {log.errorMessage || log.payloadSummary || log.url}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeAdminTab === 'roster' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header description */}
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '12px 14px',
                fontSize: '11px',
                color: '#cffafe',
                lineHeight: 1.5,
              }}
            >
              <strong>Official Pre-Approved Candidate Roster</strong>
              <p style={{ margin: '4px 0 0', color: 'var(--text-dim)' }}>
                To secure the registration process and prevent uninvited users, candidate enrollments are cross-referenced with this roster. During registration, the submitted personal email AND Discord handle must exactly match one of these pre-approved pairings. Duplicate enrollments are automatically declined.
              </p>
            </div>

            {/* Roster form to add new entry */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--line-strong)',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#fff', fontWeight: 600, marginBottom: '10px' }}>
                ADD PRE-APPROVED CANDIDATE TO ROSTER
              </div>
              <form onSubmit={handleAddRosterEntry} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Candidate Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={newRosterName}
                    onChange={(e) => setNewRosterName(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--line)',
                      padding: '8px 10px',
                      color: '#fff',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Pre-Approved Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. john.doe@example.com"
                    value={newRosterEmail}
                    onChange={(e) => setNewRosterEmail(e.target.value)}
                    required
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--line)',
                      padding: '8px 10px',
                      color: '#fff',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
                <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Discord Username *</label>
                  <input
                    type="text"
                    placeholder="e.g. @johndoe"
                    value={newRosterDiscord}
                    onChange={(e) => setNewRosterDiscord(e.target.value)}
                    required
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--line)',
                      padding: '8px 10px',
                      color: '#fff',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    background: '#06b6d4',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 14px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Add Candidate
                </button>
              </form>

              {rosterError && (
                <div style={{ color: '#f87171', fontSize: '11px', marginTop: '10px' }}>
                  ✕ {rosterError}
                </div>
              )}
              {rosterSuccess && (
                <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '10px' }}>
                  {rosterSuccess}
                </div>
              )}
            </div>

            {/* List and Search of pre-approved candidates */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>
                  CURRENT ACTIVE ROSTER ({preApprovedRoster.length} APPROVED ENTRIES)
                </span>
                <input
                  type="text"
                  placeholder="Search roster..."
                  value={rosterSearchTerm}
                  onChange={(e) => setRosterSearchTerm(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--line)',
                    padding: '4px 8px',
                    color: '#fff',
                    fontSize: '11px',
                    width: '180px',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>

              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  border: '1px solid var(--line-strong)',
                  background: 'rgba(0,0,0,0.3)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.06)', borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '6px 10px', color: '#949ba4', fontWeight: 600 }}>CANDIDATE NAME</th>
                      <th style={{ padding: '6px 10px', color: '#949ba4', fontWeight: 600 }}>PRE-APPROVED EMAIL</th>
                      <th style={{ padding: '6px 10px', color: '#949ba4', fontWeight: 600 }}>DISCORD HANDLE</th>
                      <th style={{ padding: '6px 10px', color: '#949ba4', fontWeight: 600, textAlign: 'center' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preApprovedRoster
                      .filter((item) => {
                        const term = rosterSearchTerm.toLowerCase().trim();
                        if (!term) return true;
                        return (
                          item.email.toLowerCase().includes(term) ||
                          item.discord.toLowerCase().includes(term) ||
                          (item.candidateName && item.candidateName.toLowerCase().includes(term))
                        );
                      })
                      .map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '6px 10px', color: '#fff' }}>
                            {item.candidateName || <span style={{ color: 'var(--text-dimmer)', fontStyle: 'italic' }}>Anonymous</span>}
                          </td>
                          <td style={{ padding: '6px 10px', color: 'var(--text-dim)' }}>{item.email}</td>
                          <td style={{ padding: '6px 10px', color: '#22d3ee', fontWeight: 600 }}>{item.discord}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveRosterEntry(item.email, item.discord)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '12px', marginTop: '14px' }}>
          <button
            type="button"
            className="btn btn--ghost"
            style={{ padding: '10px 18px', fontSize: '11px', color: '#fff', width: 'auto' }}
            onClick={onClose}
          >
            Close Registry
          </button>
        </div>
      </div>
    )}


        {/* Discord DM Template Preview & Customizer Modal */}
        {activeDmCandidate && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              padding: '16px',
            }}
            onClick={() => setActiveDmCandidate(null)}
          >
            <div
              style={{
                background: '#18191c',
                border: '1px solid #5865F2',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '680px',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 30px rgba(88, 101, 242, 0.25)',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* DM Modal Header */}
              <div
                style={{
                  padding: '14px 18px',
                  background: '#1e1f22',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      background: '#5865F2',
                      borderRadius: '6px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MessageSquare size={16} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', color: '#ffffff' }}>
                      DISCORD DM TEMPLATE DISPATCH
                    </div>
                    <div style={{ fontSize: '11px', color: '#949ba4', marginTop: '2px' }}>
                      Target Candidate: <strong style={{ color: '#5865F2' }}>{activeDmCandidate.discord}</strong> • ID:{' '}
                      <span style={{ color: '#ffffff' }}>[{activeDmCandidate.id}]</span> •{' '}
                      <span>{activeDmCandidate.email}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveDmCandidate(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#949ba4',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px 8px',
                  }}
                  title="Close DM Template"
                >
                  ✕
                </button>
              </div>

              {/* Template Selection Tabs */}
              <div
                style={{
                  padding: '12px 18px 6px 18px',
                  background: '#232428',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ fontSize: '10px', color: '#949ba4', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  SELECT DIRECT MESSAGE TEMPLATE TYPE:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DM_TEMPLATE_OPTIONS.map((tmpl) => {
                    const isSelected = activeDmTemplateType === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => handleSwitchTemplateType(tmpl.id)}
                        style={{
                          background: isSelected ? 'rgba(88, 101, 242, 0.25)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isSelected ? '#5865F2' : 'rgba(255,255,255,0.1)'}`,
                          color: isSelected ? '#ffffff' : '#949ba4',
                          fontSize: '11px',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isSelected && <Check size={11} color="#5865F2" />}
                        <span>{tmpl.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '11px', color: '#b5bac1', marginTop: '8px', fontStyle: 'italic' }}>
                  {DM_TEMPLATE_OPTIONS.find((t) => t.id === activeDmTemplateType)?.description}
                </div>
              </div>

              {/* Editable Markdown Message Box */}
              <div style={{ padding: '16px 18px', flex: 1, overflowY: 'auto' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '10px', color: '#949ba4', letterSpacing: '0.08em' }}>
                    EDITABLE DISCORD MARKDOWN OUTPUT:
                  </span>
                  <span style={{ fontSize: '10px', color: '#4ade80' }}>
                    {dmCopiedSuccess ? '✓ COPIED TO CLIPBOARD!' : 'Ready to Copy & Send'}
                  </span>
                </div>

                <textarea
                  value={customDmText}
                  onChange={(e) => setCustomDmText(e.target.value)}
                  style={{
                    width: '100%',
                    height: '240px',
                    background: '#2b2d31',
                    border: '1px solid #3f4147',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    color: '#dbdee1',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    lineHeight: '1.45',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  placeholder="Pre-formatted Discord Direct Message content..."
                />

                <div
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                    fontSize: '11px',
                    color: '#949ba4',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={12} color="#5865F2" />
                    <span>Includes dynamic subject codes, papers, timestamps & admin signature.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwitchTemplateType(activeDmTemplateType)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#60a5fa',
                      fontSize: '11px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Reset to Default Text
                  </button>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div
                style={{
                  padding: '14px 18px',
                  background: '#1e1f22',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyDiscord(activeDmCandidate.discord, activeDmCandidate.id)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    title="Copy only candidate Discord handle"
                  >
                    <Copy size={12} />
                    <span>Copy @Handle</span>
                  </button>

                  <a
                    href="https://discord.com/app"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: 'rgba(88, 101, 242, 0.15)',
                      border: '1px solid rgba(88, 101, 242, 0.4)',
                      borderRadius: '4px',
                      color: '#c7d2fe',
                      fontSize: '11px',
                      padding: '8px 12px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    title="Open Discord in browser"
                  >
                    <ExternalLink size={12} />
                    <span>Open Discord</span>
                  </a>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyModalDmText(false)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Copy size={12} />
                    <span>Copy Text Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyModalDmText(true)}
                    style={{
                      background: '#5865F2',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(88, 101, 242, 0.4)',
                    }}
                  >
                    {dmCopiedSuccess ? <Check size={14} color="#a3e635" /> : <Send size={14} />}
                    <span>{dmCopiedSuccess ? '✓ COPIED & MARKED DM SENT!' : 'Copy & Mark "DM Sent"'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRegistryModal;
