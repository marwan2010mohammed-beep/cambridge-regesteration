import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CountdownTimer } from './components/CountdownTimer';
import { AdminRegistryModal } from './components/AdminRegistryModal';
import { SubjectCatalogModal } from './components/SubjectCatalogModal';
import { ALL_OCT_NOV_SUBJECTS } from './data/subjects';
import { ExamSubject, CandidateEnrollment } from './types';
import { MessageSquare, Mail, ShieldAlert, CheckCircle2, Copy, Check, BookOpen, Search, X, Plus, Layers, ExternalLink, ArrowUpRight, Radio, Users } from 'lucide-react';

export const DISCORD_INVITE_URL = 'https://discord.gg/YD3hR9Sn54';

const INITIAL_ENROLLMENTS: CandidateEnrollment[] = [
  {
    id: 'CIE-8412',
    email: 'alex.candidate@cambridge-prep.edu',
    discord: 'alex_cie#4011',
    candidateName: 'Alex Carter',
    centerNumber: 'EG042',
    subjects: [
      { code: '0580', name: 'Mathematics', tier: 'Extended' },
      { code: '0625', name: 'Physics', tier: 'Extended' },
      { code: '0620', name: 'Chemistry', tier: 'Extended' },
    ],
    timestamp: '2026-08-20 14:32:10 UTC',
    status: 'DM Sent',
  },
  {
    id: 'CIE-9923',
    email: 'layla.mansoor@alazhar-school.org',
    discord: '@layla_igcse',
    candidateName: 'Layla Mansoor',
    centerNumber: 'EG118',
    subjects: [
      { code: '0478', name: 'Computer Science', tier: 'Standard' },
      { code: '0580', name: 'Mathematics', tier: 'Extended' },
    ],
    timestamp: '2026-08-21 09:15:44 UTC',
    status: 'Pending Admin DM',
  },
];

const LOCAL_STORAGE_KEY = 'cambridge_igcse_enrollments_v1';
const LOCAL_STORAGE_SUBJECTS_KEY = 'cambridge_igcse_selected_subjects_v1';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [discord, setDiscord] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [centerNumber, setCenterNumber] = useState('');
  
  // Initialize all subjects available for Oct/Nov examination session
  const [subjects, setSubjects] = useState<ExamSubject[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SUBJECTS_KEY);
      if (saved) {
        const savedSelectedCodes: string[] = JSON.parse(saved);
        const codeSet = new Set(savedSelectedCodes);
        return ALL_OCT_NOV_SUBJECTS.map((s) => ({
          ...s,
          selected: codeSet.has(s.code),
        }));
      }
    } catch {
      // fallback
    }
    return ALL_OCT_NOV_SUBJECTS;
  });

  const [inlineSubjectSearch, setInlineSubjectSearch] = useState('');
  const [isInlineDropdownOpen, setIsInlineDropdownOpen] = useState(false);
  const inlineSearchContainerRef = useRef<HTMLDivElement>(null);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [lastEnrolledRecord, setLastEnrolledRecord] = useState<CandidateEnrollment | null>(null);
  const [copiedDiscord, setCopiedDiscord] = useState(false);

  // Save selected subject codes to local storage
  useEffect(() => {
    try {
      const selectedCodes = subjects.filter((s) => s.selected).map((s) => s.code);
      localStorage.setItem(LOCAL_STORAGE_SUBJECTS_KEY, JSON.stringify(selectedCodes));
    } catch {
      // Ignored
    }
  }, [subjects]);

  // Persistent Enrollments list for admins & website owners
  const [enrollments, setEnrollments] = useState<CandidateEnrollment[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return INITIAL_ENROLLMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(enrollments));
    } catch {
      // Ignored
    }
  }, [enrollments]);

  // Click outside to close inline search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inlineSearchContainerRef.current &&
        !inlineSearchContainerRef.current.contains(e.target as Node)
      ) {
        setIsInlineDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // Close modals or mobile menu with escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeModal) {
          setActiveModal(null);
        } else if (menuOpen) {
          setMenuOpen(false);
          hamburgerRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, activeModal]);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);

  // Auto close mobile menu on screen widening
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 901 && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen]);

  // Focus modal input on appearance
  useEffect(() => {
    if (activeModal) {
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 60);
    }
  }, [activeModal]);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const selectedSubjectsList = subjects
    .filter((s) => s.selected)
    .map((s) => ({ code: s.code, name: s.name, tier: s.tier }));

  const handleEnrollmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      alert('Please enter your candidate email address.');
      return;
    }
    if (!discord.trim()) {
      alert('Please enter your Discord username so website admins can DM you to confirm papers.');
      return;
    }

    const selected = subjects.filter((s) => s.selected);
    if (selected.length === 0) {
      alert('Please select at least 1 Cambridge IGCSE paper component to enroll.');
      setActiveModal('papers');
      return;
    }

    const newRecord: CandidateEnrollment = {
      id: `CIE-${Math.floor(1000 + Math.random() * 9000)}`,
      email: email.trim(),
      discord: discord.trim().startsWith('@') ? discord.trim() : `@${discord.trim()}`,
      candidateName: candidateName.trim() || undefined,
      centerNumber: centerNumber.trim() || undefined,
      subjects: selected.map((s) => ({
        code: s.code,
        name: s.name,
        tier: s.tier,
        selectedPapers: s.selectedPapers && s.selectedPapers.length > 0 ? s.selectedPapers : [...s.papers],
      })),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      status: 'Pending Admin DM',
    };

    setEnrollments((prev) => [newRecord, ...prev]);
    setLastEnrolledRecord(newRecord);
    setFeedbackMessage(`Candidate enrollment logged! Website admins have received your submission and will DM ${newRecord.discord} on Discord shortly.`);
    setActiveModal('success');

    // Immediately clear all personal information, input fields, and subject/paper selections
    setEmail('');
    setDiscord('');
    setCandidateName('');
    setCenterNumber('');
    setInlineSubjectSearch('');
    setIsInlineDropdownOpen(false);
    setSubjects((prev) =>
      prev.map((s) => ({
        ...s,
        selected: false,
        selectedPapers: [...s.papers],
      }))
    );
  };

  const handleAccessClick = () => {
    if (email) {
      setFeedbackMessage(`Loading Cambridge International examination timetable & statement of entry for ${email}...`);
    } else {
      setFeedbackMessage('Please provide your registered school/candidate email address to access the Cambridge Oct/Nov session portal.');
    }
    setActiveModal('portal');
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    setFeedbackMessage(`Center Verification Key [${inviteCode.toUpperCase()}] authenticated for the Cambridge Oct/Nov examination series.`);
    setActiveModal('success');
  };

  const toggleSubject = (code: string) => {
    setSubjects((prev) =>
      prev.map((sub) => {
        if (sub.code !== code) return sub;
        const willSelect = !sub.selected;
        return {
          ...sub,
          selected: willSelect,
          selectedPapers: willSelect
            ? sub.selectedPapers && sub.selectedPapers.length > 0
              ? sub.selectedPapers
              : [...sub.papers]
            : sub.selectedPapers,
        };
      })
    );
  };

  const togglePaper = (code: string, paperName: string) => {
    setSubjects((prev) =>
      prev.map((sub) => {
        if (sub.code !== code) return sub;
        const currentSelectedPapers = sub.selectedPapers && sub.selectedPapers.length > 0 ? sub.selectedPapers : [...sub.papers];

        if (!sub.selected) {
          return {
            ...sub,
            selected: true,
            selectedPapers: [paperName],
          };
        }

        const alreadyHas = currentSelectedPapers.includes(paperName);
        if (alreadyHas) {
          const next = currentSelectedPapers.filter((p) => p !== paperName);
          if (next.length === 0) {
            return {
              ...sub,
              selected: false,
              selectedPapers: [...sub.papers],
            };
          }
          return {
            ...sub,
            selectedPapers: next,
          };
        } else {
          return {
            ...sub,
            selected: true,
            selectedPapers: [...currentSelectedPapers, paperName],
          };
        }
      })
    );
  };

  const selectOnlyPaper = (code: string, paperName: string) => {
    setSubjects((prev) =>
      prev.map((sub) => {
        if (sub.code !== code) return sub;
        return {
          ...sub,
          selected: true,
          selectedPapers: [paperName],
        };
      })
    );
  };

  const selectAllPapers = (code: string) => {
    setSubjects((prev) =>
      prev.map((sub) => {
        if (sub.code !== code) return sub;
        return {
          ...sub,
          selected: true,
          selectedPapers: [...sub.papers],
        };
      })
    );
  };

  const handleSelectMultiple = (codes: string[], select: boolean) => {
    const codeSet = new Set(codes);
    setSubjects((prev) =>
      prev.map((sub) => {
        if (!codeSet.has(sub.code)) return sub;
        return {
          ...sub,
          selected: select,
          selectedPapers: select
            ? sub.selectedPapers && sub.selectedPapers.length > 0
              ? sub.selectedPapers
              : [...sub.papers]
            : sub.selectedPapers,
        };
      })
    );
  };

  const inlineSearchResults = useMemo(() => {
    const q = inlineSubjectSearch.toLowerCase().trim();
    if (!q) return [];
    return subjects
      .filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.category && s.category.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [subjects, inlineSubjectSearch]);

  const handleCopyDiscordLink = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(DISCORD_INVITE_URL);
    setCopiedDiscord(true);
    setTimeout(() => setCopiedDiscord(false), 2200);
  };

  const handleUpdateStatus = (id: string, newStatus: CandidateEnrollment['status']) => {
    setEnrollments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const handleDeleteRecord = (id: string) => {
    setEnrollments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllRecords = () => {
    if (confirm('Are you sure you want to clear all candidate registry entries?')) {
      setEnrollments([]);
    }
  };

  const selectedCount = subjects.filter((s) => s.selected).length;

  return (
    <section className="hero" id="top">
      {/* Background Media & Cinematic Scrim */}
      <div className="hero__media" aria-hidden="true">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260806_132328_5f9029c8-218f-4489-82b6-29ff2849920e.png"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260806_133255_956f653f-5d80-4b06-abd5-0f46c98b60fa.mp4"
            type="video/mp4"
          />
        </video>
        <div className="scrim" />
      </div>

      {/* Navigation Header */}
      <nav role="banner">
        <a href="#top" className="logo" id="brand-logo" aria-label="Cambridge International">
          CAMBRIDGE
        </a>

        <div className="nav-cluster">
          <div className="nav-links" aria-label="Main Navigation">
            <a
              href="#story"
              className="nav-link"
              id="nav-story"
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('story');
              }}
            >
              Story
            </a>
            <a
              href="#papers"
              className="nav-link"
              id="nav-papers"
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('papers');
              }}
            >
              Papers ({selectedCount})
            </a>
            <a
              href="#identity"
              className="nav-link"
              id="nav-identity"
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('identity');
              }}
            >
              Identity
            </a>
            <a
              href="#admin-registry"
              className="nav-admin-link"
              id="nav-admin"
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('admin');
              }}
              title="View Candidate Registrations & Discord Handles (Site Owners / Admins)"
            >
              <span>Admin Log</span>
              <span className="nav-admin-badge-count">{enrollments.length}</span>
            </a>
          </div>

          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-discord-btn"
            id="nav-discord-link"
            title="Join Official Cambridge IGCSE Discord Server (discord.gg/YD3hR9Sn54)"
          >
            <MessageSquare size={13} />
            <span>Discord Server ↗</span>
          </a>

          <a
            href="#join"
            className="cta-join"
            id="nav-join-desktop"
            onClick={(e) => {
              e.preventDefault();
              setActiveModal('join');
            }}
          >
            Join Up
          </a>

          <button
            ref={hamburgerRef}
            type="button"
            className="nav__hamburger"
            id="nav-hamburger"
            aria-expanded={menuOpen}
            aria-controls="mobileMenu"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={toggleMenu}
          >
            <span className="hamburger__bar hamburger__bar--1" />
            <span className="hamburger__bar hamburger__bar--2" />
            <span className="hamburger__bar hamburger__bar--3" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        id="mobileMenu"
        className={`mobile-menu ${menuOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation menu"
        aria-hidden={!menuOpen}
        inert={!menuOpen ? true : undefined}
      >
        <div className="mobile-menu__nav">
          <div className="mobile-menu__item" style={{ '--i': 0 } as React.CSSProperties}>
            <a
              href="#story"
              className="mobile-menu__link"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setActiveModal('story');
              }}
            >
              Story
            </a>
          </div>
          <div className="mobile-menu__item" style={{ '--i': 1 } as React.CSSProperties}>
            <a
              href="#papers"
              className="mobile-menu__link"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setActiveModal('papers');
              }}
            >
              Papers ({selectedCount})
            </a>
          </div>
          <div className="mobile-menu__item" style={{ '--i': 2 } as React.CSSProperties}>
            <a
              href="#identity"
              className="mobile-menu__link"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setActiveModal('identity');
              }}
            >
              Identity
            </a>
          </div>
          <div className="mobile-menu__item" style={{ '--i': 3 } as React.CSSProperties}>
            <a
              href="#admin"
              className="mobile-menu__link"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setActiveModal('admin');
              }}
            >
              Admin Registry ({enrollments.length})
            </a>
          </div>
          <div className="mobile-menu__item" style={{ '--i': 4 } as React.CSSProperties}>
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-menu__link"
              style={{ color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <MessageSquare size={20} />
              <span>Discord Server ↗</span>
            </a>
          </div>
          <div className="mobile-menu__item" style={{ '--i': 5 } as React.CSSProperties}>
            <a
              href="#join"
              className="mobile-menu__cta"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setActiveModal('join');
              }}
            >
              Join Up
            </a>
          </div>
        </div>
      </div>

      {/* Left-Side Floating Discord Server Badge & Hub */}
      <aside className="discord-side-card" aria-label="Official Discord Community">
        <div className="discord-side-badge">
          <span>[ IGCSE DISCORD HUB ]</span>
          <div className="discord-side-status">
            <span className="discord-side-status-dot" />
            <span>ONLINE NETWORK</span>
          </div>
        </div>
        <div className="discord-side-title">
          Cambridge Candidate Server
        </div>
        <p className="discord-side-desc">
          Official Discord community for Oct/Nov examination series. Admins DM candidates here to verify statement of entry.
        </p>
        <div className="discord-side-actions">
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="discord-btn-primary"
            title="Open official Discord server (discord.gg/YD3hR9Sn54)"
          >
            <MessageSquare size={13} />
            <span>Join Server</span>
            <ArrowUpRight size={13} />
          </a>
          <button
            type="button"
            className="discord-btn-copy"
            onClick={handleCopyDiscordLink}
            title="Copy Discord invite URL to clipboard"
          >
            {copiedDiscord ? <Check size={12} color="#a3e635" /> : <Copy size={12} />}
            <span>{copiedDiscord ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </aside>

      {/* Right-Aligned Hero Registration Panel */}
      <div className="hero__body" role="main">
        <div className="panel">
          <div className="chip" id="registration-chip">
            [ Oct / Nov Registration ]
          </div>

          <h1 className="hero-h1" id="main-heading">
            IGCSE
          </h1>

          <p className="tagline">
            Your official entry to the Oct/Nov series examinations.
          </p>

          <CountdownTimer onOpenSchedule={() => setActiveModal('schedule')} />

          {/* Registration & Paper Enrollment Form with Email + Discord Username */}
          <form
            className="form-container"
            id="registration-form"
            noValidate
            onSubmit={handleEnrollmentSubmit}
          >
            {/* Email Field */}
            <div className="input-field-wrapper">
              <span className="input-field-icon" aria-hidden="true">
                <Mail size={15} />
              </span>
              <label htmlFor="candidate-email" className="sr-only">
                Personal Email
              </label>
              <input
                type="email"
                id="candidate-email"
                className="email-field email-field--with-icon"
                placeholder="Personal Email"
                aria-label="Personal Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {/* Discord Username Field & Server Link */}
            <div>
              <div className="input-field-wrapper">
                <span className="input-field-icon" aria-hidden="true">
                  <MessageSquare size={15} />
                </span>
                <label htmlFor="candidate-discord" className="sr-only">
                  Discord Username
                </label>
                <input
                  type="text"
                  id="candidate-discord"
                  className="email-field email-field--with-icon"
                  placeholder="Discord Username (e.g. @candidate or handle)"
                  aria-label="Discord Username"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="form-discord-link-badge" style={{ marginTop: '4px' }}>
                <span>Official Discord Server:</span>
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  title="Join Cambridge Discord Server"
                >
                  <span>Join Server ↗</span>
                </a>
              </div>
            </div>

            {/* Interactive Inline Subject Search & Quick Select */}
            <div className="inline-subject-search-container" ref={inlineSearchContainerRef}>
              <div className="input-field-wrapper">
                <span className="input-field-icon" aria-hidden="true">
                  <Search size={15} />
                </span>
                <label htmlFor="subject-search-input" className="sr-only">
                  Search & Enroll Subjects
                </label>
                <input
                  type="text"
                  id="subject-search-input"
                  className="email-field email-field--with-icon"
                  placeholder="Search & add subjects (e.g. 0580, Arabic, Physics, 0478)..."
                  aria-label="Search and add Cambridge subjects"
                  value={inlineSubjectSearch}
                  onChange={(e) => {
                    setInlineSubjectSearch(e.target.value);
                    setIsInlineDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (inlineSubjectSearch.trim()) {
                      setIsInlineDropdownOpen(true);
                    }
                  }}
                  autoComplete="off"
                />
                {inlineSubjectSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setInlineSubjectSearch('');
                      setIsInlineDropdownOpen(false);
                    }}
                    style={{
                      position: 'absolute',
                      right: '4px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Instant Search Suggestions Dropdown */}
              {isInlineDropdownOpen && inlineSearchResults.length > 0 && (
                <div className="subject-search-dropdown" role="listbox">
                  {inlineSearchResults.map((sub) => {
                    const selectedPapers = sub.selectedPapers || sub.papers;
                    const isAll = sub.selected && sub.papers.every((p) => selectedPapers.includes(p));

                    return (
                      <div
                        key={sub.code}
                        className={`subject-search-dropdown-item ${sub.selected ? 'is-selected' : ''}`}
                        style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}
                      >
                        <div
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                          onClick={() => toggleSubject(sub.code)}
                        >
                          <div>
                            <div style={{ fontSize: '12px', color: '#fff' }}>
                              <strong style={{ color: '#60a5fa' }}>[{sub.code}]</strong> {sub.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-dimmer)' }}>
                              {sub.category} • {sub.tier}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              border: '1px solid',
                              borderColor: sub.selected ? '#60a5fa' : 'var(--line)',
                              color: sub.selected ? '#fff' : 'var(--text-dim)',
                              background: sub.selected ? 'rgba(96,165,250,0.2)' : 'transparent',
                            }}
                          >
                            {sub.selected ? '✓ ENROLLED' : '+ ADD'}
                          </span>
                        </div>

                        {/* Papers row in dropdown */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexWrap: 'wrap',
                            paddingTop: '4px',
                            borderTop: '1px dashed rgba(255,255,255,0.06)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAllPapers(sub.code);
                            }}
                            style={{
                              background: isAll ? '#60a5fa' : 'rgba(255,255,255,0.06)',
                              color: isAll ? '#000' : 'var(--text-dim)',
                              border: '1px solid',
                              borderColor: isAll ? '#60a5fa' : 'var(--line)',
                              fontSize: '9px',
                              padding: '1px 5px',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            All Papers
                          </button>

                          {sub.papers.map((p) => {
                            const pMatch = p.match(/Paper\s*\d+/i);
                            const shortP = pMatch ? pMatch[0] : p;
                            const isPSelected = sub.selected && selectedPapers.includes(p);

                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectOnlyPaper(sub.code, p);
                                }}
                                style={{
                                  background:
                                    sub.selected && selectedPapers.length === 1 && selectedPapers[0] === p
                                      ? '#a3e635'
                                      : isPSelected
                                      ? 'rgba(96,165,250,0.25)'
                                      : 'rgba(255,255,255,0.04)',
                                  color:
                                    sub.selected && selectedPapers.length === 1 && selectedPapers[0] === p
                                      ? '#000'
                                      : isPSelected
                                      ? '#fff'
                                      : 'var(--text-dimmer)',
                                  border: '1px solid',
                                  borderColor: isPSelected ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.08)',
                                  fontSize: '9px',
                                  padding: '1px 4px',
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-mono)',
                                }}
                                title={`Select ${shortP} only for ${sub.name}`}
                              >
                                {shortP} only
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div
                    style={{
                      padding: '6px 10px',
                      background: 'rgba(255,255,255,0.03)',
                      textAlign: 'center',
                      fontSize: '10px',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onClick={() => {
                      setIsInlineDropdownOpen(false);
                      setActiveModal('papers');
                    }}
                  >
                    View all 42+ Cambridge subjects in full catalog ↗
                  </div>
                </div>
              )}

              {/* Selected Subjects Chips List */}
              {selectedCount > 0 && (
                <div className="subject-chips-list" aria-label="Selected examination subjects">
                  {subjects
                    .filter((s) => s.selected)
                    .map((s) => {
                      const selPapers = s.selectedPapers || s.papers;
                      const isAll = selPapers.length === s.papers.length;
                      const papersBadge = isAll
                        ? 'All Papers'
                        : selPapers.length === 1
                        ? `${selPapers[0].match(/Paper\s*\d+/i)?.[0] || selPapers[0]} only`
                        : `${selPapers.map((p) => p.match(/Paper\s*\d+/i)?.[0] || p).join(', ')}`;

                      return (
                        <span
                          key={s.code}
                          className="subject-chip"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <span className="subject-chip-code">{s.code}</span>
                          <span>{s.name.split(' ')[0]}</span>
                          <span
                            onClick={() => setActiveModal('papers')}
                            style={{
                              fontSize: '9px',
                              background: isAll ? 'rgba(255,255,255,0.1)' : 'rgba(163,230,53,0.15)',
                              color: isAll ? 'var(--text-dim)' : '#a3e635',
                              border: '1px solid',
                              borderColor: isAll ? 'rgba(255,255,255,0.15)' : 'rgba(163,230,53,0.4)',
                              padding: '1px 5px',
                              cursor: 'pointer',
                            }}
                            title="Click to customize papers"
                          >
                            {papersBadge}
                          </span>
                          <button
                            type="button"
                            className="subject-chip-remove"
                            onClick={() => toggleSubject(s.code)}
                            title={`Remove ${s.name}`}
                            aria-label={`Remove ${s.name}`}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                </div>
              )}
            </div>

            <p className="form-helper-text">
              * Website admins will <strong>DM you on Discord</strong> to confirm paper enrolments and verify candidate codes.
            </p>

            {/* Quick Papers Selector Bar */}
            <button
              type="button"
              className="paper-selection-summary-btn"
              onClick={() => setActiveModal('papers')}
              title="Click to search, filter and customize all 42+ Cambridge examination subjects and papers"
            >
              <span>
                Enrolling in <span className="accent">{selectedCount} Subjects</span>
                {' '}
                ({subjects
                  .filter((s) => s.selected)
                  .map((s) => {
                    const selPapers = s.selectedPapers || s.papers;
                    const pText =
                      selPapers.length === s.papers.length
                        ? 'All'
                        : selPapers.length === 1
                        ? `${selPapers[0].match(/Paper\s*\d+/i)?.[0] || '1P'} only`
                        : `${selPapers.length}P`;
                    return `${s.code} [${pText}]`;
                  })
                  .join(', ')})
              </span>
              <span className="accent">[ Customize Papers ↗ ]</span>
            </button>

            {/* Submit Buttons */}
            <button
              type="submit"
              className="btn btn--solid"
              id="btn-proceed-email"
            >
              Enroll Papers via Discord & Email
            </button>

            <button
              type="button"
              className="btn btn--ghost"
              id="btn-access-portal"
              onClick={handleAccessClick}
            >
              Access Candidate Portal
            </button>
          </form>

          {/* Sub-links */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <a
              href="#invite"
              className="referral-link"
              id="btn-invite-key"
              style={{ marginTop: 0 }}
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('invite');
              }}
            >
              I've got an invite key
            </a>

            <a
              href="#admin"
              className="referral-link"
              id="btn-view-admin-log"
              style={{ marginTop: 0, color: 'var(--text-dim)' }}
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('admin');
              }}
            >
              [ Admin Registry Log ({enrollments.length}) ]
            </a>
          </div>
        </div>
      </div>

      {/* Legal Footer */}
      <footer role="contentinfo">
        <p className="legal-text">
          Opening a{' '}
          <a
            href="#cambridge"
            className="legal-link"
            onClick={(e) => {
              e.preventDefault();
              setActiveModal('story');
            }}
          >
            cambridge.edu
          </a>{' '}
          account signals that you accept our{' '}
          <a
            href="#privacy-notice"
            className="legal-link"
            onClick={(e) => {
              e.preventDefault();
              setActiveModal('privacy');
            }}
          >
            Privacy Notice
          </a>
          ,{' '}
          <a
            href="#service-contract"
            className="legal-link"
            onClick={(e) => {
              e.preventDefault();
              setActiveModal('terms');
            }}
          >
            Service Contract
          </a>
          , and our official{' '}
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="legal-link"
            style={{ color: '#818cf8', fontWeight: 500 }}
          >
            Discord Server ↗
          </a>
          .
        </p>
      </footer>

      {/* Admin Candidate Registry Modal */}
      {activeModal === 'admin' && (
        <AdminRegistryModal
          enrollments={enrollments}
          onClose={() => setActiveModal(null)}
          onUpdateStatus={handleUpdateStatus}
          onDeleteRecord={handleDeleteRecord}
          onClearAll={handleClearAllRecords}
        />
      )}

      {/* Full Subject Catalog & Papers Selection Modal */}
      {activeModal === 'papers' && (
        <SubjectCatalogModal
          subjects={subjects}
          onToggleSubject={toggleSubject}
          onTogglePaper={togglePaper}
          onSelectOnlyPaper={selectOnlyPaper}
          onSelectAllPapers={selectAllPapers}
          onSelectMultiple={handleSelectMultiple}
          onClose={() => setActiveModal(null)}
          initialSearch={inlineSubjectSearch}
        />
      )}

      {/* Interactive Modal System for Cambridge IGCSE Session Management */}
      {activeModal && activeModal !== 'admin' && activeModal !== 'papers' && (
        <div
          className="terminal-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="terminal-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: 'var(--font-mono)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid var(--line)',
                paddingBottom: '12px',
              }}
            >
              <span
                id="dialog-title"
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--text-dim)',
                }}
              >
                {activeModal === 'portal' && '[ CANDIDATE PORTAL & TIMETABLE ]'}
                {activeModal === 'schedule' && '[ OCT / NOV 2026 KEY DATES TIMETABLE ]'}
                {activeModal === 'invite' && '[ CENTER VERIFICATION KEY ]'}
                {activeModal === 'join' && '[ CANDIDATE REGISTRATION SERIES ]'}
                {activeModal === 'story' && '[ CAMBRIDGE INTERNATIONAL OVERVIEW ]'}
                {activeModal === 'identity' && '[ CANDIDATE BIOMETRIC IDENTITY PROTOCOL ]'}
                {activeModal === 'contact' && '[ CAMBRIDGE ASSESSMENT SUPPORT ]'}
                {activeModal === 'privacy' && '[ DATA PRIVACY NOTICE ]'}
                {activeModal === 'terms' && '[ EXAMINATION SERVICE CONTRACT ]'}
                {activeModal === 'success' && '[ REGISTRATION & ENROLLMENT RECEIPT ]'}
              </span>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 8px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                }}
                aria-label="Close dialog"
              >
                [X]
              </button>
            </div>

            {/* Modal Body: Candidate Portal */}
            {activeModal === 'portal' && (
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '18px' }}>
                  {feedbackMessage || 'Candidate Portal Status'}
                </p>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--line)',
                    padding: '14px',
                    marginBottom: '20px',
                    fontSize: '12px',
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>SERIES: <span style={{ color: '#fff' }}>OCTOBER / NOVEMBER 2026</span></div>
                  <div style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>EXAM BOARD: <span style={{ color: '#fff' }}>CAMBRIDGE ASSESSMENT (CIE)</span></div>
                  <div style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>CANDIDATE EMAIL: <span style={{ color: '#fff' }}>{email || 'Not Provided'}</span></div>
                  <div style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>DISCORD CONTACT: <span style={{ color: '#fff' }}>{discord || 'Not Provided'}</span></div>
                  <div style={{ color: 'var(--text-dim)' }}>ENROLLED SUBJECTS: <span style={{ color: '#fff' }}>{selectedCount} Selected</span></div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn--solid"
                    style={{ padding: '12px 18px', fontSize: '11px', flex: 1 }}
                    onClick={() => setActiveModal('papers')}
                  >
                    Manage Papers
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    style={{ padding: '12px 18px', fontSize: '11px', flex: 1, color: '#fff' }}
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: Invite Key */}
            {activeModal === 'invite' && (
              <form onSubmit={handleInviteSubmit}>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '18px' }}>
                  Enter your Cambridge International Examination Center ID and candidate authorization PIN to unlock rapid direct registration.
                </p>
                <input
                  ref={modalInputRef}
                  type="text"
                  placeholder="CIE-EG999-2026-X"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid var(--line-strong)',
                    padding: '12px 14px',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    letterSpacing: '0.12em',
                    marginBottom: '20px',
                    boxSizing: 'border-box',
                    borderRadius: 0,
                  }}
                  required
                />
                <button
                  type="submit"
                  className="btn btn--solid"
                  style={{ padding: '14px 20px', fontSize: '12px' }}
                >
                  Verify Center Authorization
                </button>
              </form>
            )}

            {/* Modal Body: Join Up Registration */}
            {activeModal === 'join' && (
              <form onSubmit={handleEnrollmentSubmit}>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '16px' }}>
                  Register for the Cambridge IGCSE Oct/Nov exam session. Website owners and admins will DM your Discord account to finalize candidate registration.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="Candidate Full Name (Optional)"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--line-strong)',
                      padding: '12px 14px',
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      borderRadius: 0,
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Personal Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--line-strong)',
                      padding: '12px 14px',
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      borderRadius: 0,
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Discord Username *"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--line-strong)',
                      padding: '12px 14px',
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      borderRadius: 0,
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Center Number [Optional]"
                    value={centerNumber}
                    onChange={(e) => setCenterNumber(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid var(--line-strong)',
                      padding: '12px 14px',
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      borderRadius: 0,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0 }}>
                    * Enrolling in <strong style={{ color: '#ffffff' }}>{selectedCount} Cambridge Subjects</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveModal('papers')}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px dashed var(--line)',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    [ Search & Edit Subjects ({selectedCount}) ↗ ]
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn--solid"
                  style={{ padding: '14px 20px', fontSize: '12px' }}
                >
                  Submit Registration & Notify Admins
                </button>
              </form>
            )}

            {/* Modal Body: Story */}
            {activeModal === 'story' && (
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '12px' }}>
                  Cambridge IGCSE is the world's most popular international qualification for 14 to 16 year olds. Recognized by leading universities and employers worldwide.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  The October / November series offers examination sittings across 70+ subjects, providing candidates global benchmark assessment integrity.
                </p>
                <p>Curriculum design emphasizes deep subject knowledge, conceptual understanding, and higher-order thinking skills.</p>
              </div>
            )}

            {/* Modal Body: Identity */}
            {activeModal === 'identity' && (
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '12px' }}>
                  Every candidate is issued a cryptographic Candidate Number and Statement of Entry with biometric verification required at approved Cambridge test centers.
                </p>
                <p>Examination papers, invigilation guidelines, and candidate desk badges conform strictly to CIE international regulations.</p>
              </div>
            )}

            {/* Modal Body: Contact */}
            {activeModal === 'contact' && (
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '8px' }}>Cambridge Assessment International Education</p>
                <p style={{ marginBottom: '8px' }}>Email: info@cambridgeinternational.org</p>
                <p style={{ marginBottom: '8px' }}>Candidate Helpdesk: +44 1223 553554</p>
                <p>Support Portal: support.cambridge.edu</p>
              </div>
            )}

            {/* Modal Body: Privacy */}
            {activeModal === 'privacy' && (
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '12px' }}>
                  Candidate personal data, examination scripts, and marks are held securely in compliance with UK GDPR and global data privacy standards.
                </p>
                <p>Data is shared exclusively with accredited examination officers and recognized higher education validation portals.</p>
              </div>
            )}

            {/* Modal Body: Terms */}
            {activeModal === 'terms' && (
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '12px' }}>
                  Candidates must comply with the Notice to Candidates and regulations regarding unauthorized items, coursework submission deadlines, and conduct in exam halls.
                </p>
              </div>
            )}

            {/* Modal Body: Schedule / Key Dates */}
            {activeModal === 'schedule' && (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '16px' }}>
                  Official administrative milestones and component sitting windows for the Cambridge IGCSE October / November 2026 examination series.
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    marginBottom: '20px',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '6px',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 12px',
                      border: '1px solid rgba(255,255,255,0.4)',
                      background: 'var(--fill-solid)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ color: '#fff', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>SERIES COMMENCEMENT (T-MINUS TARGET)</span>
                      <span style={{ color: 'var(--text-dim)' }}>OCT 01, 2026</span>
                    </div>
                    <div style={{ color: 'var(--text-dim)', marginTop: '4px', fontSize: '11px' }}>
                      Official start of Cambridge IGCSE written examination papers across all global administrative zones.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--line)',
                      background: 'rgba(255,255,255,0.02)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ color: '#fff', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                      <span>FINAL ENTRY DEADLINE</span>
                      <span style={{ color: 'var(--text-dim)' }}>SEP 21, 2026</span>
                    </div>
                    <div style={{ color: 'var(--text-dim)', marginTop: '4px', fontSize: '11px' }}>
                      Final date for centers and private candidates to submit candidate statements of entry without late stage fees.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--line)',
                      background: 'rgba(255,255,255,0.02)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ color: '#fff', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                      <span>CORE & EXTENDED PAPERS WINDOW</span>
                      <span style={{ color: 'var(--text-dim)' }}>OCT 05 – NOV 12, 2026</span>
                    </div>
                    <div style={{ color: 'var(--text-dim)', marginTop: '4px', fontSize: '11px' }}>
                      Theory, MCQ, and Alternative to Practical papers for Mathematics, Sciences, Languages, and Humanities.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--line)',
                      background: 'rgba(255,255,255,0.02)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ color: '#fff', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                      <span>SERIES CONCLUSION</span>
                      <span style={{ color: 'var(--text-dim)' }}>NOV 18, 2026</span>
                    </div>
                    <div style={{ color: 'var(--text-dim)', marginTop: '4px', fontSize: '11px' }}>
                      All exam scripts securely sealed and dispatched for Cambridge assessment marking.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--line)',
                      background: 'rgba(255,255,255,0.02)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ color: '#fff', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                      <span>RESULTS RELEASE (ONLINE)</span>
                      <span style={{ color: 'var(--text-dim)' }}>JAN 14, 2027</span>
                    </div>
                    <div style={{ color: 'var(--text-dim)', marginTop: '4px', fontSize: '11px' }}>
                      Provisional results issued on Candidate Results Service with official certificates dispatched in March.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn--solid"
                    style={{ padding: '12px 16px', fontSize: '11px', flex: 1 }}
                    onClick={() => {
                      setActiveModal('portal');
                    }}
                  >
                    View My Timetable
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    style={{ padding: '12px 16px', fontSize: '11px', flex: 1, color: '#fff' }}
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: Success & Receipt Feedback */}
            {activeModal === 'success' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <CheckCircle2 size={22} color="#a3e635" />
                  <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>
                    ENROLLMENT REGISTERED & LOGGED
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '16px' }}>
                  {feedbackMessage}
                </p>

                {lastEnrolledRecord && (
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--line-strong)',
                      padding: '14px',
                      marginBottom: '16px',
                      fontSize: '12px',
                      lineHeight: 1.6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>CANDIDATE ID:</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{lastEnrolledRecord.id}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>DISCORD HANDLE (FOR DM):</span>
                      <span style={{ color: '#60a5fa', fontWeight: 600 }}>{lastEnrolledRecord.discord}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>EMAIL ADDRESS:</span>
                      <span style={{ color: '#fff' }}>{lastEnrolledRecord.email}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-dim)' }}>ADMIN STATUS:</span>
                      <span style={{ color: '#fde047', background: 'rgba(241,196,15,0.15)', padding: '2px 6px' }}>
                        {lastEnrolledRecord.status}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '8px' }}>
                      <div style={{ color: 'var(--text-dim)', fontSize: '11px', marginBottom: '6px' }}>
                        ENROLLED SUBJECTS & PAPER COMPONENTS ({lastEnrolledRecord.subjects.length}):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {lastEnrolledRecord.subjects.map((sub) => {
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
                            <div
                              key={sub.code}
                              style={{
                                fontSize: '11px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--line)',
                                padding: '4px 8px',
                                color: '#fff',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <div>
                                <strong style={{ color: '#60a5fa' }}>[{sub.code}]</strong> {sub.name}
                              </div>
                              <span
                                style={{
                                  color: '#a3e635',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  background: 'rgba(163,230,53,0.12)',
                                  padding: '1px 5px',
                                }}
                              >
                                {papersSummary}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Discord Server Join Action */}
                <div
                  style={{
                    background: 'rgba(88,101,242,0.12)',
                    border: '1px solid rgba(88,101,242,0.4)',
                    padding: '12px 14px',
                    marginBottom: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageSquare size={13} color="#818cf8" />
                      <span>Join Cambridge Discord Server</span>
                    </div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '2px' }}>
                      Admins will DM <strong style={{ color: '#60a5fa' }}>{discord || 'your Discord handle'}</strong> in the server.
                    </div>
                  </div>
                  <a
                    href={DISCORD_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="discord-btn-primary"
                    style={{ padding: '8px 14px' }}
                  >
                    <span>Join Server ↗</span>
                  </a>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn--solid"
                    style={{ padding: '12px 18px', fontSize: '11px', flex: 1 }}
                    onClick={() => setActiveModal('admin')}
                  >
                    View Admin Candidate Registry
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    style={{ padding: '12px 18px', fontSize: '11px', flex: 1, color: '#fff' }}
                    onClick={() => setActiveModal(null)}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
