import React, { useState, useEffect, useRef } from 'react';
import { CandidateEnrollment, ExamSubject } from '../types';
import { generateStatementOfEntryPDF } from '../utils/pdfGenerator';
import { Copy, Check, MessageSquare, Download, Trash2, Search, Lock, Unlock, ShieldCheck, Key, Eye, EyeOff, UserCheck, LogOut, AlertCircle, FileText } from 'lucide-react';

interface AdminRegistryModalProps {
  enrollments: CandidateEnrollment[];
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: CandidateEnrollment['status']) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  subjects?: ExamSubject[];
}

// Authorized Admin Accounts
export const AUTHORIZED_ADMINS = [
  { username: 'admin', password: 'cambridge2026', role: 'Super Administrator', badge: 'SUPERUSER' },
  { username: 'owner', password: 'cie_admin_2026', role: 'Site Owner', badge: 'OWNER' },
  { username: 'headmaster', password: 'exams2026', role: 'Exam Officer', badge: 'OFFICER' },
  { username: 'marwan', password: 'admin2026', role: 'Lead Administrator', badge: 'DIRECTOR' },
];

const ADMIN_SESSION_STORAGE_KEY = 'cambridge_admin_auth_user_v1';

export function AdminRegistryModal({
  enrollments,
  onClose,
  onUpdateStatus,
  onDeleteRecord,
  onClearAll,
  subjects,
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

  // Registry State
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) {
      usernameInputRef.current?.focus();
    }
  }, [currentUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const userClean = inputUsername.trim().toLowerCase();
    const passClean = inputPassword.trim();

    const matchedAccount = AUTHORIZED_ADMINS.find(
      (a) => a.username.toLowerCase() === userClean && a.password === passClean
    );

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
                  fontSize: '10px',
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

            {/* Login Form */}
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

              <button
                type="submit"
                className="btn btn--solid"
                style={{
                  padding: '12px 20px',
                  fontSize: '12px',
                  letterSpacing: '0.12em',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                <Unlock size={14} />
                UNLOCK CANDIDATE REGISTRY
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn--ghost"
                style={{ padding: '10px 16px', fontSize: '11px', color: '#fff' }}
                onClick={onClose}
              >
                Cancel
              </button>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#ffffff' }}>
                <ShieldCheck size={15} color="#a3e635" />
                <span>
                  LOGGED IN AS: <strong style={{ color: '#a3e635' }}>{currentUser}</strong> ({currentAdminProfile?.role || 'Admin'})
                </span>
                <span style={{ fontSize: '10px', background: 'rgba(163,230,53,0.2)', color: '#a3e635', padding: '1px 5px' }}>
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
                  fontSize: '10px',
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
                            fontSize: '10px',
                            padding: '3px 6px',
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

                        <button
                          type="button"
                          onClick={() => generateStatementOfEntryPDF(entry, subjects)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            color: '#60a5fa',
                            fontSize: '10px',
                            padding: '3px 6px',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                          }}
                          title="Generate & download official Cambridge Statement of Entry PDF for this candidate"
                        >
                          <FileText size={11} />
                          <span>PDF SOE</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteRecord(entry.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-dimmer)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                          }}
                          title="Remove candidate record"
                        >
                          <Trash2 size={12} />
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
                            fontSize: '10px',
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
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        PERSONAL EMAIL: <strong style={{ color: '#ffffff' }}>{entry.email}</strong>
                      </div>
                    </div>

                    {/* Candidate Name / Center Info if available */}
                    {(entry.candidateName || entry.centerNumber) && (
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {entry.candidateName && <span>NAME: <strong style={{ color: '#fff' }}>{entry.candidateName}</strong></span>}
                        {entry.candidateName && entry.centerNumber && <span> • </span>}
                        {entry.centerNumber && <span>CENTER: <strong style={{ color: '#fff' }}>{entry.centerNumber}</strong></span>}
                      </div>
                    )}

                    {/* Enrolled Papers List */}
                    <div style={{ marginTop: '2px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-dimmer)', letterSpacing: '0.12em', marginBottom: '4px' }}>
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
                                fontSize: '10px',
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
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
      </div>
    </div>
  );
}
