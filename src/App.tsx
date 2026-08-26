import React, { useState, useEffect, useRef, useMemo, useLayoutEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { CountdownTimer } from './components/CountdownTimer';
import { ALL_OCT_NOV_SUBJECTS } from './data/subjects';
import { ExamSubject, CandidateEnrollment } from './types';
import { generateTimetableSummary } from './data/examSchedule';
import { validateEmail, validateDiscordHandle } from './utils/validation';
import { UiverseButton } from './components/UiverseButton';
import { dispatchDiscordWebhook } from './utils/discordWebhook';
import { dispatchEmailConfirmation } from './utils/emailService';
import { UiverseLoader } from './components/UiverseLoader';
import { UiverseNavTabs } from './components/UiverseNavTabs';
import { DiscordLightButton } from './components/DiscordLightButton';
import { FAQSection } from './components/FAQSection';
import { CambridgeTestimonialsSection } from './components/CambridgeTestimonialsSection';
import { CambridgeCarouselTestimonials } from './components/CambridgeCarouselTestimonials';
import { RolodexText } from './components/RolodexText';
import { ShinyText } from './components/ShinyText';
import { OversizedClippedHeading } from './components/OversizedClippedHeading';
import { MessageSquare, Mail, ShieldAlert, CheckCircle2, Copy, Check, BookOpen, Search, X, Plus, Layers, ExternalLink, ArrowUpRight, Radio, Users, Calendar, AlertTriangle, Clock, FileText, Download, FileCheck, ShieldCheck, Bot, Sparkles } from 'lucide-react';

const AdminRegistryModal = lazy(() => import('./components/AdminRegistryModal'));
const SubjectCatalogModal = lazy(() => import('./components/SubjectCatalogModal'));
const ExamScheduleVisualizer = lazy(() => import('./components/ExamScheduleVisualizer'));
const CambridgeNightmareSupportModal = lazy(() => import('./components/CambridgeNightmareSupportModal'));

export const DISCORD_INVITE_URL = 'https://discord.gg/YD3hR9Sn54';

const INITIAL_ENROLLMENTS: CandidateEnrollment[] = [];

const LOCAL_STORAGE_KEY = 'cambridge_igcse_enrollments_v1';
const LOCAL_STORAGE_SUBJECTS_KEY = 'cambridge_igcse_selected_subjects_v1';

const wizardStepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? -30 : 30,
    opacity: 0,
  }),
};

function WizardStepContentWrapper({
  currentStep,
  direction,
  children,
}: {
  currentStep: number;
  direction: number;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [parentHeight, setParentHeight] = useState<number>(0);

  useLayoutEffect(() => {
    if (containerRef.current) {
      setParentHeight(containerRef.current.offsetHeight);
    }
  }, [currentStep, children]);

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: parentHeight || 'auto' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          ref={containerRef}
          custom={direction}
          variants={wizardStepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [stepDirection, setStepDirection] = useState<number>(1);
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
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  // Live input touch / interaction state for validation styling
  const [emailTouched, setEmailTouched] = useState(false);
  const [discordTouched, setDiscordTouched] = useState(false);

  // Loading animation state with Uiverse.io bouncing circles loader
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('Processing Candidate Registration...');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Real-time live checks for Email and Discord username
  const emailValidation = useMemo(() => validateEmail(email), [email]);
  const discordValidation = useMemo(() => validateDiscordHandle(discord), [discord]);
  const selectedCount = useMemo(() => subjects.filter((s) => s.selected).length, [subjects]);

  // Submit button is enabled only when all live validation checks pass
  const isFormValid = emailValidation.isValid && discordValidation.isValid && selectedCount > 0;

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
        const parsed = JSON.parse(saved) as CandidateEnrollment[];
        // Auto-purge any previously saved test candidate records
        return parsed.filter(
          (rec) =>
            rec.email !== 'alex.candidate@cambridge-prep.edu' &&
            rec.email !== 'layla.mansoor@alazhar-school.org' &&
            rec.candidateName !== 'Alex Carter' &&
            rec.candidateName !== 'Layla Mansoor'
        );
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

  // Pre-approved Candidate Roster State
  const [preApprovedRoster, setPreApprovedRoster] = useState<{ email: string; discord: string; candidateName?: string }[]>(() => {
    try {
      const saved = localStorage.getItem('cambridge_igcse_pre_approved_roster_v1');
      if (saved) {
        const parsed = JSON.parse(saved) as { email: string; discord: string; candidateName?: string }[];
        // Filter out previously saved test candidates so only actual admin and valid custom rosters remain
        const filtered = parsed.filter(
          (item) =>
            item.email.toLowerCase() === 'john.doe@example.com' ||
            (item.email.toLowerCase() !== 'candidate@example.com' &&
              item.email.toLowerCase() !== 'student1@school.edu' &&
              item.email.toLowerCase() !== 'student2@school.edu')
        );
        if (filtered.length > 0) {
          return filtered;
        }
      }
    } catch {
      // Fallback
    }
    return [
      { email: 'john.doe@example.com', discord: '@johndoe', candidateName: 'John Doe' },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('cambridge_igcse_pre_approved_roster_v1', JSON.stringify(preApprovedRoster));
    } catch {
      // Ignored
    }
  }, [preApprovedRoster]);

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
      document.documentElement.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
      document.documentElement.classList.remove('menu-open');
    }
    return () => {
      document.body.classList.remove('menu-open');
      document.documentElement.classList.remove('menu-open');
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

  // Scroll-triggered animations observer
  useEffect(() => {
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .header-anim');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    animatedElements.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      animatedElements.forEach((el) => {
        observer.unobserve(el);
      });
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const selectedSubjectsList = subjects
    .filter((s) => s.selected)
    .map((s) => ({ code: s.code, name: s.name, tier: s.tier }));

  const executeSubmission = (finalEmail: string, bypassTypoWarning: boolean = false) => {
    const targetEmail = finalEmail.trim().toLowerCase();
    const targetDiscord = discordValidation.normalized || (discord.trim().startsWith('@') ? discord.trim() : `@${discord.trim()}`);

    // Check if duplicate enrollment exists
    const hasDuplicate = enrollments.some(
      (rec) => rec.email.toLowerCase() === targetEmail.toLowerCase() || rec.discord.toLowerCase() === targetDiscord.toLowerCase()
    );

    if (hasDuplicate) {
      setFeedbackMessage('An enrollment has already been submitted for this email address or Discord handle. Duplicate enrollments are not allowed.');
      setActiveModal('error');
      return;
    }

    const selected = subjects.filter((s) => s.selected);
    if (selected.length === 0) {
      setFeedbackMessage('Please select at least 1 Cambridge IGCSE paper component to enroll.');
      setActiveModal('error');
      return;
    }

    const newRecord: CandidateEnrollment = {
      id: `CIE-${Math.floor(1000 + Math.random() * 9000)}`,
      email: targetEmail,
      discord: targetDiscord,
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

    setIsProcessingAction(true);
    setProcessingLabel('Enrolling Candidate & Updating Cambridge Center Registry...');
    setActiveModal('loading');

    setTimeout(async () => {
      setEnrollments((prev) => [newRecord, ...prev]);
      
      // Fire notifications asynchronously
      dispatchDiscordWebhook(newRecord).catch(console.error);
      dispatchEmailConfirmation(newRecord).catch(console.error);

      setLastEnrolledRecord(newRecord);
      setFeedbackMessage(`Candidate enrollment logged! Website admins have received your submission and will DM ${newRecord.discord} on Discord shortly.`);
      setIsProcessingAction(false);
      setActiveModal('success');

      // Trigger lightweight celebratory confetti effect
      try {
        const { default: confetti } = await import('canvas-confetti');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#ffffff', '#22c55e', '#f59e0b'],
          disableForReducedMotion: true,
        });
      } catch (e) {
        console.warn('Failed to fire confetti effect:', e);
      }

      // Immediately clear all personal information, input fields, and subject/paper selections
      setEmail('');
      setDiscord('');
      setEmailTouched(false);
      setDiscordTouched(false);
      setCandidateName('');
      setCenterNumber('');
      setInlineSubjectSearch('');
      setIsInlineDropdownOpen(false);
      setSubjects((prev) =>
        prev.map((sub) => ({
          ...sub,
          selected: false,
          selectedPapers: [],
        }))
      );
      setWizardStep(1);
    }, 1200);
  };

  const handleEnrollmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setDiscordTouched(true);

    if (!emailValidation.isValid) {
      setFeedbackMessage(emailValidation.error || 'Please enter a valid candidate email address.');
      setActiveModal('error');
      return;
    }
    if (!discordValidation.isValid) {
      setFeedbackMessage(discordValidation.error || 'Please enter a valid Discord handle (e.g. @username).');
      setActiveModal('error');
      return;
    }
    if (selectedSubjectsList.length === 0) {
      setFeedbackMessage('Please select at least 1 Cambridge IGCSE paper component from the search bar or catalog to enroll.');
      setActiveModal('error');
      return;
    }

    // Intercept if domain typo warning exists before final submission
    if (emailValidation.warning && emailValidation.suggestion) {
      setActiveModal('email-warning');
      return;
    }

    executeSubmission(emailValidation.normalized || email);
  };

  const handleAccessClick = () => {
    setIsProcessingAction(true);
    setProcessingLabel(
      email
        ? `Retrieving Cambridge Examination Record & Timetable for ${email}...`
        : 'Loading Cambridge Oct/Nov Candidate Session Portal...'
    );
    setActiveModal('loading');

    setTimeout(() => {
      setIsProcessingAction(false);
      if (email) {
        setFeedbackMessage(`Loading Cambridge International examination timetable & statement of entry for ${email}...`);
      } else {
        setFeedbackMessage('Please provide your registered school/candidate email address to access the Cambridge Oct/Nov session portal.');
      }
      setActiveModal('portal');
    }, 600);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    setIsProcessingAction(true);
    setProcessingLabel(`Authenticating Center Authorization Key [${inviteCode.toUpperCase()}]...`);
    setActiveModal('loading');

    setTimeout(() => {
      setIsProcessingAction(false);
      setFeedbackMessage(`Center Verification Key [${inviteCode.toUpperCase()}] authenticated for the Cambridge Oct/Nov examination series.`);
      setActiveModal('success');
    }, 650);
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

  const timetableSummary = useMemo(() => {
    return generateTimetableSummary(subjects);
  }, [subjects]);

  return (
    <section className="hero" id="top">
      {/* Background Media & Cinematic Scrim */}
      <div className="hero__media" aria-hidden="true">
        <video
          id="hero-bg-video"
          className="hero__video"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/hero-poster.webp"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260806_133255_956f653f-5d80-4b06-abd5-0f46c98b60fa.mp4"
            type="video/mp4"
          />
        </video>
        <div className="scrim" />
      </div>

      {/* Navigation Header */}
      <nav role="banner" className="header-anim">
        <a href="#top" className="logo flex items-center gap-1.5" id="brand-logo" aria-label="Cambridge International">
          CAMBRIDGE <span className="purple-glow-pulse font-extrabold tracking-wide">NIGHTMARE</span>
        </a>

        <div className="nav-cluster">
          {/* Uiverse.io Capsule Sliding Navigation Tabs */}
          <UiverseNavTabs
            selectedCount={selectedCount}
            enrollmentsCount={enrollments.length}
            activeModal={activeModal}
            timetableSummary={timetableSummary}
            onSelectTab={(modal) => setActiveModal(modal)}
            orientation="horizontal"
          />

          <UiverseButton
            as="a"
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="discord"
            size="sm"
            id="nav-discord-link"
            icon={<MessageSquare size={13} />}
            title="Join Official Cambridge IGCSE Discord Server (discord.gg/YD3hR9Sn54)"
          >
            Discord Server ↗
          </UiverseButton>

          <UiverseButton
            as="a"
            href="#join"
            variant="default"
            size="sm"
            id="nav-join-desktop"
            onClick={(e) => {
              e.preventDefault();
              setActiveModal('join');
            }}
          >
            Join Up
          </UiverseButton>

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
        <div className="mobile-menu__nav" style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
          <div className="mobile-menu__item" style={{ '--i': 0, width: '100%', display: 'flex', justifyContent: 'center' } as React.CSSProperties}>
            <UiverseNavTabs
              selectedCount={selectedCount}
              enrollmentsCount={enrollments.length}
              activeModal={activeModal}
              timetableSummary={timetableSummary}
              onSelectTab={(modal) => {
                setMenuOpen(false);
                setActiveModal(modal);
              }}
              orientation="vertical"
            />
          </div>
          <div className="mobile-menu__item" style={{ '--i': 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' } as React.CSSProperties}>
            <UiverseButton
              type="button"
              variant="default"
              size="md"
              fullWidth
              id="mobile-nightmare-btn"
              icon={<Bot size={16} color="#93c5fd" />}
              onClick={() => {
                setMenuOpen(false);
                setActiveModal('nightmare');
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%)',
                borderColor: 'rgba(96, 165, 250, 0.6)',
              }}
            >
              Cambridge Nightmare Support
            </UiverseButton>
            <UiverseButton
              as="a"
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="discord"
              size="md"
              fullWidth
              icon={<MessageSquare size={16} />}
            >
              Discord Server ↗
            </UiverseButton>
            <UiverseButton
              as="a"
              href="#join"
              variant="default"
              size="md"
              fullWidth
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setActiveModal('join');
              }}
            >
              Join Up / Candidate Registration
            </UiverseButton>
          </div>
        </div>
      </div>

      {/* Right-Aligned Hero Registration Panel */}
      <div className="hero__body" role="main">
        <div className="panel">
          <div className="chip" id="registration-chip">
            <ShinyText text="[ Oct / Nov Registration ]" color="#94a3b8" shineColor="#60a5fa" speed={3} />
          </div>

          <div id="main-heading">
            <OversizedClippedHeading
              text="CAMBRIDGE IGCSE 2026"
              as="h1"
              accentColor="#3b82f6"
            />
          </div>

          <p className="tagline">
            We Deliver{' '}
            <RolodexText
              words={['Solutions', 'Answers', 'Clarity', 'Support', 'Confidence']}
              textClassName="text-blue-400 font-semibold"
            />{' '}
            for your Oct/Nov examinations.
          </p>

          <CountdownTimer onOpenSchedule={() => setActiveModal('schedule')} />

          {/* Registration & Paper Enrollment Form with Email + Discord Username */}
          <form
            className="form-container"
            id="registration-form"
            noValidate
            onSubmit={handleEnrollmentSubmit}
          >

            {/* ANIMATED STEPPER PROGRESS INDICATORS */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'clamp(24px, 4vw, 32px)', padding: '0' }}>
              {[1, 2, 3].map((step, idx) => {
                const isCompleted = wizardStep > step;
                const isActive = wizardStep === step;
                const isNotLast = idx < 2;

                const changeStep = (target: 1 | 2 | 3) => {
                  if (target === wizardStep) return;
                  setStepDirection(target > wizardStep ? 1 : -1);
                  setWizardStep(target);
                };

                return (
                  <React.Fragment key={step}>
                    <button
                      type="button"
                      onClick={() => changeStep(step as 1 | 2 | 3)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        cursor: 'pointer',
                        userSelect: 'none',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        width: 'clamp(65px, 24vw, 85px)',
                        gap: 'clamp(6px, 1.5vw, 10px)'
                      }}
                      title={`Go to step ${step}`}
                    >
                      <div style={{ position: 'relative' }}>
                        <motion.div
                          animate={{
                            scale: isActive ? 1.08 : 1,
                            backgroundColor: isCompleted ? '#2563eb' : isActive ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            borderColor: isCompleted ? '#60a5fa' : isActive ? '#60a5fa' : 'rgba(255, 255, 255, 0.15)',
                            color: isCompleted ? '#ffffff' : isActive ? '#60a5fa' : 'var(--text-dim)',
                          }}
                          transition={{ duration: 0.3 }}
                          style={{
                            width: 'clamp(36px, 10vw, 42px)',
                            height: 'clamp(36px, 10vw, 42px)',
                            borderRadius: '50%',
                            border: '2px solid',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 'clamp(12px, 3.5vw, 14px)',
                            position: 'relative',
                            zIndex: 2,
                            boxShadow: isActive ? '0 0 16px rgba(96, 165, 250, 0.35)' : 'none',
                          }}
                        >
                          {isCompleted ? (
                            <Check size={18} color="#ffffff" strokeWidth={3} />
                          ) : step === 1 ? (
                            <Users size={17} />
                          ) : step === 2 ? (
                            <Layers size={17} />
                          ) : (
                            <FileCheck size={17} />
                          )}
                        </motion.div>

                        {isActive && (
                          <motion.div
                            layoutId="active-step-glow"
                            style={{
                              position: 'absolute',
                              inset: '-4px',
                              borderRadius: '50%',
                              background: 'rgba(96, 165, 250, 0.35)',
                              filter: 'blur(6px)',
                              zIndex: 1,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        )}
                      </div>
                      <span style={{ 
                        fontSize: 'clamp(9.5px, 2.5vw, 11.5px)', 
                        color: isActive ? '#60a5fa' : 'var(--text-dim)', 
                        textAlign: 'center', 
                        lineHeight: 1.25,
                        fontWeight: isActive ? 500 : 400
                      }}>
                        {step === 1 ? 'Enter your details' : step === 2 ? 'Select subjects' : 'Review & confirm'}
                      </span>
                    </button>

                    {isNotLast && (
                      <div style={{ position: 'relative', flex: 1, height: '2px', margin: 'clamp(18px, 5vw, 20px) 4px 0 4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                        <motion.div
                          style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #2563eb, #60a5fa)', transformOrigin: 'left' }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: wizardStep > step ? 1 : 0 }}
                          transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#fff', fontWeight: 600 }}>
                {wizardStep === 1 ? '1. Personal Details' : wizardStep === 2 ? '2. Subject Selection' : '3. Review & Confirm'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>
                {wizardStep === 1 && 'Enter your verified Cambridge portal credentials'}
                {wizardStep === 2 && 'Select your examination syllabuses and papers'}
                {wizardStep === 3 && 'Verify your timetable and finalize enrolment'}
              </p>
            </div>

            <WizardStepContentWrapper currentStep={wizardStep} direction={stepDirection}>
              {wizardStep === 1 && (
                <div className="wizard-step flex flex-col items-center">
                  <div className="text-xs bg-indigo-500/20 text-indigo-400 font-medium px-3 py-1 rounded-full mb-2 border border-indigo-500/30">
                    Candidate Portal
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 text-center">Verify Credentials</h3>
                  <p className="text-xs text-slate-400 mb-6 text-center">
                    Enter your active personal email and Discord handle for exam confirmation.
                  </p>

            {/* Email Field with Live Check */}
            <div className="w-full mb-4">
              <label htmlFor="candidate-email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Personal Email
              </label>
              <div className="flex items-center h-11 pl-3 pr-2 bg-slate-900/80 border border-slate-700 rounded-full focus-within:ring-2 focus-within:ring-indigo-500 transition-all overflow-hidden relative">
                <span className="flex items-center mr-2 text-slate-400" aria-hidden="true">
                  <Mail size={16} color={email ? (emailValidation.isValid ? '#4ade80' : '#f87171') : 'var(--text-dim)'} />
                </span>
                <input
                  type="email"
                  id="candidate-email"
                  className="h-full w-full outline-none bg-transparent text-sm text-white placeholder-slate-500"
                  placeholder="candidate@example.com"
                  aria-label="Personal Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!emailTouched) setEmailTouched(true);
                  }}
                  onBlur={() => setEmailTouched(true)}
                  autoComplete="email"
                  required
                />
                {email && (
                  <span className="flex items-center ml-2">
                    {emailValidation.isValid ? (
                      <CheckCircle2 size={16} color="#4ade80" />
                    ) : (
                      <AlertTriangle size={16} color="#f87171" />
                    )}
                  </span>
                )}
              </div>

              {/* Email Live Feedback Message */}
              {email && emailValidation.isValid && !emailValidation.warning && (
                <div className="form-validation-feedback is-valid mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 size={12} color="#4ade80" />
                  <span>
                    Valid candidate email ({emailValidation.normalized})
                    {emailValidation.isPopularProvider && (
                      <span
                        style={{
                          marginLeft: '8px',
                          color: '#60a5fa',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(96, 165, 250, 0.15)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(96, 165, 250, 0.3)',
                        }}
                      >
                        ✓ Verified
                      </span>
                    )}
                  </span>
                </div>
              )}

              {email && emailValidation.isValid && emailValidation.warning && emailValidation.suggestion && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px 14px',
                    background: 'rgba(234, 179, 8, 0.15)',
                    border: '1px solid rgba(234, 179, 8, 0.45)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fde047', flex: '1 1 200px' }}>
                    <AlertTriangle size={16} color="#fde047" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 500 }}>{emailValidation.warning}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmail(emailValidation.suggestion!)}
                    style={{
                      background: '#fde047',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: '36px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <Sparkles size={14} color="#000" />
                    <span>Auto-Fix Email ({emailValidation.suggestion})</span>
                  </button>
                </div>
              )}

              {(email || emailTouched) && !emailValidation.isValid && (
                <div className="form-validation-feedback is-invalid mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertTriangle size={11} />
                  <span>{emailValidation.error}</span>
                </div>
              )}
            </div>

            {/* Discord Username Field with Live Check & Server Link */}
            <div className="w-full mb-6">
              <label htmlFor="candidate-discord" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Discord Username
              </label>
              <div className="flex items-center h-11 pl-3 pr-2 bg-slate-900/80 border border-slate-700 rounded-full focus-within:ring-2 focus-within:ring-indigo-500 transition-all overflow-hidden relative">
                <span className="flex items-center mr-2 text-slate-400" aria-hidden="true">
                  <MessageSquare size={16} color={discord ? (discordValidation.isValid ? '#4ade80' : '#f87171') : 'var(--text-dim)'} />
                </span>
                <input
                  type="text"
                  id="candidate-discord"
                  className="h-full w-full outline-none bg-transparent text-sm text-white placeholder-slate-500"
                  placeholder="@candidate or username"
                  aria-label="Discord Username"
                  value={discord}
                  onChange={(e) => {
                    setDiscord(e.target.value);
                    if (!discordTouched) setDiscordTouched(true);
                  }}
                  onBlur={() => setDiscordTouched(true)}
                  autoComplete="off"
                  required
                />
                {discord && (
                  <span className="flex items-center ml-2">
                    {discordValidation.isValid ? (
                      <CheckCircle2 size={16} color="#4ade80" />
                    ) : (
                      <AlertTriangle size={16} color="#f87171" />
                    )}
                  </span>
                )}
              </div>

              {/* Discord Live Feedback Message */}
              {discord && discordValidation.isValid && (
                <div className="form-validation-feedback is-valid mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 size={11} />
                  <span>Valid Discord handle: <strong style={{ color: '#4ade80' }}>{discordValidation.normalized}</strong> (Admins will DM this)</span>
                </div>
              )}
              {(discord || discordTouched) && !discordValidation.isValid && (
                <div className="form-validation-feedback is-invalid mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertTriangle size={11} />
                  <span>{discordValidation.error}</span>
                </div>
              )}
              {!discord && !discordTouched && (
                <div className="form-validation-feedback is-hint mt-1.5 text-xs text-slate-400">
                  <span>Admins will DM your Discord username to confirm paper components.</span>
                </div>
              )}
            </div>

                <div className="w-full" style={{ marginTop: '14px', marginBottom: '10px' }}>
                  <UiverseButton
                    type="button"
                    variant="default"
                    size="lg"
                    fullWidth
                    id="btn-proceed-email"
                    onClick={() => {
                      setEmailTouched(true);
                      setDiscordTouched(true);
                      if (emailValidation.isValid && discordValidation.isValid) {
                        setStepDirection(1);
                        setWizardStep(2);
                      }
                    }}
                  >
                    Continue to Subject Selection →
                  </UiverseButton>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="wizard-step">
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
                            <div style={{ fontSize: '12px', color: 'var(--text-dimmer)' }}>
                              {sub.category} • {sub.tier}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: '12px',
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
                            gap: '8px',
                            flexWrap: 'wrap',
                            paddingTop: '6px',
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
                              fontSize: '12px',
                              padding: '6px 12px',
                              minHeight: '36px',
                              display: 'inline-flex',
                              alignItems: 'center',
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
                                  fontSize: '12px',
                                  padding: '6px 10px',
                                  minHeight: '36px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
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
                      fontSize: '12px',
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
                              fontSize: '12px',
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

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <UiverseButton
                    type="button"
                    variant="ghost"
                    size="lg"
                    onClick={() => {
                      setStepDirection(-1);
                      setWizardStep(1);
                    }}
                  >
                    ← Back
                  </UiverseButton>
                  <UiverseButton
                    type="button"
                    variant="default"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      if (selectedCount > 0) {
                        setStepDirection(1);
                        setWizardStep(3);
                      } else {
                        alert('Please select at least 1 subject to continue.');
                      }
                    }}
                  >
                    Review Timetable →
                  </UiverseButton>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="wizard-step">
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

            {/* Interactive Timetable & Clash Preview Banner */}
            {selectedCount > 0 && (
              <div
                style={{
                  background:
                    timetableSummary.directClashesCount > 0
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid',
                  borderColor:
                    timetableSummary.directClashesCount > 0
                      ? 'rgba(239, 68, 68, 0.45)'
                      : 'var(--line)',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar
                    size={15}
                    color={
                      timetableSummary.directClashesCount > 0
                        ? '#f87171'
                        : timetableSummary.sameDayDoublesCount > 0
                        ? '#fbbf24'
                        : '#60a5fa'
                    }
                  />
                  <div>
                    <span style={{ color: '#fff', fontWeight: 600 }}>Oct/Nov 2026 Timetable:</span>{' '}
                    <span style={{ color: 'var(--text-dim)' }}>
                      {timetableSummary.totalScheduledPapers} Papers across {timetableSummary.totalExamDays} Days
                    </span>
                    {timetableSummary.directClashesCount > 0 ? (
                      <span
                        style={{
                          color: '#f87171',
                          fontWeight: 700,
                          marginLeft: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        ⚠️ {timetableSummary.directClashesCount} Direct Clash Detected!
                      </span>
                    ) : timetableSummary.sameDayDoublesCount > 0 ? (
                      <span
                        style={{
                          color: '#fbbf24',
                          fontWeight: 600,
                          marginLeft: '6px',
                        }}
                      >
                        ⚡ Double Exam Day ({timetableSummary.sameDayDoublesCount})
                      </span>
                    ) : (
                      <span
                        style={{
                          color: '#4ade80',
                          marginLeft: '6px',
                        }}
                      >
                        ✓ Clean Spacing ({timetableSummary.averageGapDays}d avg gap)
                      </span>
                    )}
                  </div>
                </div>

                <UiverseButton
                  type="button"
                  onClick={() => setActiveModal('timetable')}
                  variant={timetableSummary.directClashesCount > 0 ? 'danger' : 'cyan'}
                  size="xs"
                  title="Open interactive calendar, chronological timeline & clash diagnostic"
                >
                  [ View Schedule & Calendar ↗ ]
                </UiverseButton>
              </div>
            )}

            {/* Live Registration Verification Checklist */}
            <div className="form-live-checklist" id="registration-requirements-checklist">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  paddingBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ShieldCheck size={12} color={isFormValid ? '#4ade80' : '#60a5fa'} />
                  <span>REGISTRATION REQUIREMENTS CHECK</span>
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: isFormValid ? '#4ade80' : 'var(--text-dimmer)',
                    fontWeight: 700,
                  }}
                >
                  {isFormValid ? '✓ READY TO ENROLL' : `${(emailValidation.isValid ? 1 : 0) + (discordValidation.isValid ? 1 : 0) + (selectedCount > 0 ? 1 : 0)} / 3 COMPLETE`}
                </span>
              </div>

              {/* Requirement 1: Candidate Email */}
              <div
                className={`form-live-checklist-item ${
                  emailValidation.isValid
                    ? 'is-passed'
                    : email && emailTouched
                    ? 'is-error'
                    : 'is-pending'
                }`}
              >
                {emailValidation.isValid ? (
                  <CheckCircle2 size={12} color="#4ade80" />
                ) : email && emailTouched ? (
                  <AlertTriangle size={12} color="#f87171" />
                ) : (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}
                  />
                )}
                <span>
                  Candidate Email:{' '}
                  {emailValidation.isValid ? (
                    <strong style={{ color: '#4ade80' }}>Verified ({emailValidation.normalized})</strong>
                  ) : email ? (
                    <span style={{ color: '#f87171' }}>Invalid format</span>
                  ) : (
                    'Required (valid email address)'
                  )}
                </span>
              </div>

              {/* Requirement 2: Discord Username */}
              <div
                className={`form-live-checklist-item ${
                  discordValidation.isValid
                    ? 'is-passed'
                    : discord && discordTouched
                    ? 'is-error'
                    : 'is-pending'
                }`}
              >
                {discordValidation.isValid ? (
                  <CheckCircle2 size={12} color="#4ade80" />
                ) : discord && discordTouched ? (
                  <AlertTriangle size={12} color="#f87171" />
                ) : (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}
                  />
                )}
                <span>
                  Discord Handle:{' '}
                  {discordValidation.isValid ? (
                    <strong style={{ color: '#4ade80' }}>Verified ({discordValidation.normalized})</strong>
                  ) : discord ? (
                    <span style={{ color: '#f87171' }}>Invalid handle format</span>
                  ) : (
                    'Required (@username or handle for admin DM)'
                  )}
                </span>
              </div>

              {/* Requirement 3: Cambridge Subjects */}
              <div
                className={`form-live-checklist-item ${
                  selectedCount > 0 ? 'is-passed' : 'is-pending'
                }`}
              >
                {selectedCount > 0 ? (
                  <CheckCircle2 size={12} color="#4ade80" />
                ) : (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      flexShrink: 0,
                    }}
                  />
                )}
                <span>
                  Cambridge Subjects:{' '}
                  {selectedCount > 0 ? (
                    <strong style={{ color: '#4ade80' }}>
                      {selectedCount} Subject{selectedCount > 1 ? 's' : ''} Enrolled
                    </strong>
                  ) : (
                    'Select at least 1 subject component'
                  )}
                </span>
              </div>
            </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexDirection: 'column' }}>
                  <UiverseButton
                    type="submit"
                    variant="default"
                    size="lg"
                    fullWidth
                    id="btn-proceed-email"
                    title="Submit candidate registration to Cambridge examination administrators"
                  >
                    ✓ Enroll Papers via Discord & Email
                  </UiverseButton>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <UiverseButton
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setStepDirection(-1);
                        setWizardStep(2);
                      }}
                      style={{ flex: 1 }}
                    >
                      ← Edit Subjects
                    </UiverseButton>
                    <UiverseButton
                      type="button"
                      variant="ghost"
                      size="md"
                      id="btn-access-portal"
                      onClick={handleAccessClick}
                      style={{ flex: 1 }}
                    >
                      Access Candidate Portal
                    </UiverseButton>
                  </div>
                </div>
              </div>
            )}
            </WizardStepContentWrapper>

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

      {/* Left-Side Floating Discord Server Badge & Hub */}
      <aside className="discord-side-card" aria-label="Official Discord Community">
        <div className="discord-side-badge">
          <ShinyText text="[ IGCSE DISCORD HUB ]" color="#60a5fa" shineColor="#ffffff" speed={2.5} />
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

        {/* Uiverse.io Light Button by kamehame-ha */}
        <DiscordLightButton
          url={DISCORD_INVITE_URL}
          id="hero-discord-light-btn"
          title="Click to immediately join official Cambridge IGCSE Discord Server"
        />

        <div className="discord-side-actions">
          <UiverseButton
            as="a"
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="discord"
            size="xs"
            fullWidth
            icon={<MessageSquare size={12} />}
            iconRight={<ArrowUpRight size={12} />}
            title="Open official Discord server (discord.gg/YD3hR9Sn54)"
          >
            Direct Invite ↗
          </UiverseButton>
          <UiverseButton
            type="button"
            onClick={handleCopyDiscordLink}
            variant="ghost"
            size="xs"
            icon={copiedDiscord ? <Check size={12} color="#a3e635" /> : <Copy size={12} />}
            title="Copy Discord invite URL to clipboard"
          >
            {copiedDiscord ? 'Copied' : 'Copy'}
          </UiverseButton>
        </div>
      </aside>

      {/* Interactive FAQ Section */}
      <FAQSection
        onOpenNightmareSupport={() => setActiveModal('nightmare')}
        onOpenSubjectCatalog={() => setActiveModal('papers')}
      />

      {/* Cambridge Nightmare Testimonials Vertical Drift Section */}
      <CambridgeTestimonialsSection />

      {/* Cambridge Carousel Testimonials dot pagination section */}
      <CambridgeCarouselTestimonials />

      {/* Site Footer */}
      <footer role="contentinfo" className="site-footer">
        <div className="site-footer__content">
          <div className="site-footer__links">
            <a
              href="#about"
              className="site-footer__link"
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('story');
              }}
            >
              About Us
            </a>
            <a
              href="#terms"
              className="site-footer__link"
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('terms');
              }}
            >
              Terms of Service
            </a>
            <a
              href="#privacy"
              className="site-footer__link"
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('privacy');
              }}
            >
              Privacy Policy
            </a>
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer__link site-footer__link--highlight"
            >
              Discord Community ↗
            </a>
          </div>
          <div className="site-footer__bottom">
            <p className="site-footer__copyright">
              &copy; {new Date().getFullYear()} Cambridge Nightmare Support.
            </p>
            <p className="site-footer__disclaimer">
              Not affiliated with, endorsed, or approved by Cambridge Assessment International Education.
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Candidate Registry Modal */}
      {activeModal === 'admin' && (
        <Suspense fallback={null}>
          <AdminRegistryModal
            enrollments={enrollments}
            subjects={subjects}
            onClose={() => setActiveModal(null)}
            onUpdateStatus={handleUpdateStatus}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAllRecords}
            preApprovedRoster={preApprovedRoster}
            onUpdatePreApprovedRoster={setPreApprovedRoster}
          />
        </Suspense>
      )}

      {/* Full Subject Catalog & Papers Selection Modal */}
      {activeModal === 'papers' && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {/* Full Exam Schedule & Timetable Visualizer Modal */}
      {activeModal === 'timetable' && (
        <div
          className="terminal-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="timetable-dialog-title"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="terminal-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: 'var(--font-mono)',
              maxWidth: '920px',
              width: '95vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 'clamp(16px, 2.5vw, 24px)',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--line)',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="#60a5fa" />
                <span
                  id="timetable-dialog-title"
                  style={{
                    fontSize: '12px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    fontWeight: 600,
                  }}
                >
                  CAMBRIDGE IGCSE OCT/NOV 2026 TIMETABLE & CLASH DETECTOR
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontFamily: 'var(--font-mono)',
                }}
                aria-label="Close timetable dialog"
              >
                [X]
              </button>
            </div>

            <Suspense fallback={null}>
              <ExamScheduleVisualizer
                subjects={subjects}
                candidateName={candidateName}
                onClose={() => setActiveModal(null)}
                onOpenSubjectCatalog={() => setActiveModal('papers')}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* Interactive Modal System for Cambridge IGCSE Session Management */}
      {activeModal && activeModal !== 'admin' && activeModal !== 'papers' && activeModal !== 'timetable' && activeModal !== 'nightmare' && (
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
                {activeModal === 'loading' && '[ PROCESSING REQUEST ]'}
                {activeModal === 'invite' && '[ CENTER VERIFICATION KEY ]'}
                {activeModal === 'join' && '[ CANDIDATE REGISTRATION SERIES ]'}
                {activeModal === 'story' && '[ CAMBRIDGE INTERNATIONAL OVERVIEW ]'}
                {activeModal === 'identity' && '[ CANDIDATE BIOMETRIC IDENTITY PROTOCOL ]'}
                {activeModal === 'contact' && '[ CAMBRIDGE ASSESSMENT SUPPORT ]'}
                {activeModal === 'privacy' && '[ DATA PRIVACY NOTICE ]'}
                {activeModal === 'terms' && '[ EXAMINATION SERVICE CONTRACT ]'}
                {activeModal === 'success' && '[ REGISTRATION & ENROLLMENT RECEIPT ]'}
                {activeModal === 'error' && '[ VALIDATION REQUIRED ]'}
                {activeModal === 'email-warning' && '[ EMAIL DOMAIN VALIDATION ]'}
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

            {/* Modal Body: Loading State */}
            {activeModal === 'loading' && (
              <div style={{ padding: '24px 12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <UiverseLoader label={processingLabel} size="md" />
              </div>
            )}

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
                  <UiverseButton
                    type="button"
                    variant="default"
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={() => setActiveModal('papers')}
                  >
                    Manage Papers
                  </UiverseButton>
                  <UiverseButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </UiverseButton>
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
                <UiverseButton
                  type="submit"
                  variant="default"
                  size="md"
                  fullWidth
                >
                  Verify Center Authorization
                </UiverseButton>
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

                  {/* Email Input with Live Check */}
                  <div>
                    <input
                      type="email"
                      placeholder="Personal Email * (e.g. candidate@example.com)"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (!emailTouched) setEmailTouched(true);
                      }}
                      onBlur={() => setEmailTouched(true)}
                      required
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: '1px solid',
                        borderColor: email
                          ? emailValidation.isValid
                            ? '#4ade80'
                            : '#f87171'
                          : 'var(--line-strong)',
                        padding: '12px 14px',
                        color: '#ffffff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        borderRadius: 0,
                        boxSizing: 'border-box',
                      }}
                    />
                    {email && emailValidation.isValid && !emailValidation.warning && (
                      <div className="form-validation-feedback is-valid" style={{ marginTop: '6px' }}>
                        <CheckCircle2 size={12} color="#4ade80" />
                        <span>
                          Valid candidate email ({emailValidation.normalized})
                          {emailValidation.isPopularProvider && (
                            <span
                              style={{
                                marginLeft: '8px',
                                color: '#60a5fa',
                                fontSize: '11px',
                                fontFamily: 'var(--font-mono)',
                                background: 'rgba(96, 165, 250, 0.15)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(96, 165, 250, 0.3)',
                              }}
                            >
                              ✓ Provider Verified
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {email && emailValidation.isValid && emailValidation.warning && emailValidation.suggestion && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '10px 14px',
                          background: 'rgba(234, 179, 8, 0.15)',
                          border: '1px solid rgba(234, 179, 8, 0.45)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fde047', flex: '1 1 200px' }}>
                          <AlertTriangle size={16} color="#fde047" style={{ flexShrink: 0 }} />
                          <span style={{ fontWeight: 500 }}>{emailValidation.warning}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEmail(emailValidation.suggestion!)}
                          style={{
                            background: '#fde047',
                            color: '#000000',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            minHeight: '36px',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                          }}
                        >
                          <Sparkles size={14} color="#000" />
                          <span>Auto-Fix Email ({emailValidation.suggestion})</span>
                        </button>
                      </div>
                    )}
                    {(email || emailTouched) && !emailValidation.isValid && (
                      <div className="form-validation-feedback is-invalid" style={{ marginTop: '4px' }}>
                        <AlertTriangle size={11} />
                        <span>{emailValidation.error}</span>
                      </div>
                    )}
                  </div>

                  {/* Discord Input with Live Check */}
                  <div>
                    <input
                      type="text"
                      placeholder="Discord Username * (e.g. @candidate or handle)"
                      value={discord}
                      onChange={(e) => {
                        setDiscord(e.target.value);
                        if (!discordTouched) setDiscordTouched(true);
                      }}
                      onBlur={() => setDiscordTouched(true)}
                      required
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: '1px solid',
                        borderColor: discord
                          ? discordValidation.isValid
                            ? '#4ade80'
                            : '#f87171'
                          : 'var(--line-strong)',
                        padding: '12px 14px',
                        color: '#ffffff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        borderRadius: 0,
                        boxSizing: 'border-box',
                      }}
                    />
                    {discord && discordValidation.isValid && (
                      <div className="form-validation-feedback is-valid" style={{ marginTop: '4px' }}>
                        <CheckCircle2 size={11} />
                        <span>Valid Discord handle: <strong style={{ color: '#4ade80' }}>{discordValidation.normalized}</strong></span>
                      </div>
                    )}
                    {(discord || discordTouched) && !discordValidation.isValid && (
                      <div className="form-validation-feedback is-invalid" style={{ marginTop: '4px' }}>
                        <AlertTriangle size={11} />
                        <span>{discordValidation.error}</span>
                      </div>
                    )}
                  </div>

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
                  <UiverseButton
                    type="button"
                    variant="cyan"
                    size="xs"
                    onClick={() => setActiveModal('papers')}
                  >
                    [ Search & Edit Subjects ({selectedCount}) ↗ ]
                  </UiverseButton>
                </div>

                <UiverseButton
                  type="submit"
                  variant="default"
                  size="md"
                  fullWidth
                  title="Submit registration"
                >
                  ✓ Submit Registration & Notify Admins
                </UiverseButton>
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
                  <UiverseButton
                    type="button"
                    variant="default"
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setActiveModal('portal');
                    }}
                  >
                    View My Timetable
                  </UiverseButton>
                  <UiverseButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={() => setActiveModal(null)}
                  >
                    Close
                  </UiverseButton>
                </div>
              </div>
            )}

            {/* Modal Body: Email Typo Warning */}
            {activeModal === 'email-warning' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <AlertTriangle size={22} color="#fde047" />
                  <span style={{ fontSize: '14px', color: '#fde047', fontWeight: 700, fontFamily: 'var(--font-sora)' }}>
                    EMAIL DOMAIN TYPO WARNING
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '20px' }}>
                  Your email address domain (<strong>{emailValidation.domain}</strong>) appears to have a typo.
                  <br /><br />
                  Did you mean <strong style={{ color: '#4ade80' }}>{emailValidation.suggestion}</strong>?
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid var(--line)',
                      color: '#ffffff',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      minHeight: '44px',
                    }}
                  >
                    Edit Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const corrected = emailValidation.suggestion!;
                      setEmail(corrected);
                      setActiveModal(null);
                      setTimeout(() => {
                        executeSubmission(corrected, true);
                      }, 100);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: '1px solid #34d399',
                      color: '#ffffff',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      minHeight: '44px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Sparkles size={14} color="#fff" />
                    <span>Auto-Fix & Submit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      setTimeout(() => {
                        executeSubmission(email, true);
                      }, 100);
                    }}
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#fde047',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                      minHeight: '44px',
                    }}
                  >
                    Submit as {email}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: Error Feedback */}
            {activeModal === 'error' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <AlertTriangle size={22} color="#f87171" />
                  <span style={{ fontSize: '14px', color: '#f87171', fontWeight: 600 }}>
                    VALIDATION ERROR
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
                  {feedbackMessage}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <UiverseButton
                    type="button"
                    variant="default"
                    size="md"
                    fullWidth
                    onClick={() => setActiveModal(null)}
                  >
                    Got it, let me fix that
                  </UiverseButton>
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

                {/* Official PDF Statement of Entry / Receipt Download Section */}
                {lastEnrolledRecord && (
                  <div
                    style={{
                      background: 'rgba(37, 99, 235, 0.12)',
                      border: '1px solid rgba(96, 165, 250, 0.45)',
                      padding: '14px 16px',
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: '1 1 240px' }}>
                      <div
                        style={{
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <FileText size={16} color="#60a5fa" />
                        <span>Official Cambridge Statement of Entry (PDF)</span>
                      </div>
                      <div
                        style={{
                          color: 'var(--text-dim)',
                          fontSize: '11px',
                          marginTop: '4px',
                          lineHeight: 1.4,
                        }}
                      >
                        Official A4 PDF document containing your Candidate ID (<strong style={{ color: '#fff' }}>{lastEnrolledRecord.id}</strong>), Centre Number (<strong style={{ color: '#fff' }}>EG042</strong>), component papers, examination dates, key times, spacing analysis & CIE examination hall rules.
                      </div>
                    </div>

                    {isGeneratingPDF ? (
                      <div style={{ padding: '8px 0' }}>
                        <UiverseLoader label="Compiling Statement of Entry PDF..." size="sm" />
                      </div>
                    ) : (
                      <UiverseButton
                        type="button"
                        variant={pdfDownloaded ? 'emerald' : 'cyan'}
                        size="sm"
                        onClick={() => {
                          setIsGeneratingPDF(true);
                          setTimeout(async () => {
                            const { generateStatementOfEntryPDF } = await import('./utils/pdfGenerator');
                            generateStatementOfEntryPDF(lastEnrolledRecord, subjects);
                            setPdfDownloaded(true);
                            setIsGeneratingPDF(false);
                          }, 750);
                        }}
                        icon={pdfDownloaded ? <FileCheck size={15} /> : <Download size={15} />}
                        title="Download official Cambridge Statement of Entry PDF for your records"
                      >
                        {pdfDownloaded ? 'PDF Downloaded (Download Again)' : 'Download Statement of Entry (PDF)'}
                      </UiverseButton>
                    )}
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
                  <UiverseButton
                    as="a"
                    href={DISCORD_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="discord"
                    size="xs"
                  >
                    Join Server ↗
                  </UiverseButton>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <UiverseButton
                    type="button"
                    variant="cyan"
                    size="sm"
                    style={{ flex: '1 1 200px' }}
                    onClick={() => setActiveModal('timetable')}
                    icon={<Calendar size={14} />}
                  >
                    View Exam Timetable & Spacing
                  </UiverseButton>
                  <UiverseButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    style={{ flex: '1 1 140px' }}
                    onClick={() => setActiveModal('admin')}
                  >
                    Admin Registry Log
                  </UiverseButton>
                  <UiverseButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    style={{ flex: '0 0 70px' }}
                    onClick={() => setActiveModal(null)}
                  >
                    Done
                  </UiverseButton>
                </div>
              </div>
            )}

            {/* Modal Body: Candidate Portal Lookup */}
            {activeModal === 'portal' && (
              <div>
                {(() => {
                  const matchedRecord = enrollments.find(
                    (rec) => rec.email.toLowerCase() === email.trim().toLowerCase()
                  );

                  if (matchedRecord) {
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                          <CheckCircle2 size={18} color="#4ade80" />
                          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600, letterSpacing: '0.05em' }}>
                            CANDIDATE ENTRY RECORD FOUND
                          </span>
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '16px' }}>
                          Welcome, <strong>{matchedRecord.candidateName || 'Cambridge Candidate'}</strong>. Your official statement of entry is verified and logged under Center Number <strong>EG042</strong>.
                        </p>

                        <div
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--line-strong)',
                            padding: '12px 14px',
                            marginBottom: '16px',
                            fontSize: '12px',
                            lineHeight: 1.6,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-dim)' }}>Candidate ID:</span>
                            <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{matchedRecord.id}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-dim)' }}>Registered Email:</span>
                            <span style={{ color: '#fff' }}>{matchedRecord.email}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-dim)' }}>Discord (for admin DM):</span>
                            <span style={{ color: '#60a5fa', fontWeight: 500 }}>{matchedRecord.discord}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-dim)' }}>Admission Status:</span>
                            <span style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.12)', padding: '1px 5px', fontSize: '11px' }}>
                              {matchedRecord.status}
                            </span>
                          </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ color: 'var(--text-dim)', fontSize: '11px', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.04em' }}>
                            YOUR SELECTED PAPERS ({matchedRecord.subjects.length}):
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {matchedRecord.subjects.map((sub) => {
                              const papersText = sub.selectedPapers && sub.selectedPapers.length > 0
                                ? sub.selectedPapers.map(p => p.match(/Paper\s*\d+/i)?.[0] || p).join(', ')
                                : 'All Papers';
                              return (
                                <div
                                  key={sub.code}
                                  style={{
                                    fontSize: '11px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid var(--line)',
                                    padding: '5px 8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    color: '#fff',
                                  }}
                                >
                                  <span>
                                    <strong style={{ color: '#60a5fa' }}>[{sub.code}]</strong> {sub.name}
                                  </span>
                                  <span style={{ color: '#a3e635', fontSize: '10px', background: 'rgba(163,230,53,0.1)', padding: '1px 4px' }}>
                                    {papersText}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div
                          style={{
                            background: 'rgba(37, 99, 235, 0.08)',
                            border: '1px solid rgba(96, 165, 250, 0.3)',
                            padding: '12px',
                            marginBottom: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div style={{ flex: '1 1 200px' }}>
                            <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>Official Statement of Entry (PDF)</div>
                            <div style={{ color: 'var(--text-dim)', fontSize: '10px', marginTop: '2px' }}>Download your comprehensive scheduling receipt.</div>
                          </div>
                          {isGeneratingPDF ? (
                            <UiverseLoader label="Compiling..." size="sm" />
                          ) : (
                            <UiverseButton
                              type="button"
                              variant={pdfDownloaded ? 'emerald' : 'cyan'}
                              size="xs"
                              onClick={() => {
                                setIsGeneratingPDF(true);
                                setTimeout(async () => {
                                  const { generateStatementOfEntryPDF } = await import('./utils/pdfGenerator');
                                  generateStatementOfEntryPDF(matchedRecord, subjects);
                                  setPdfDownloaded(true);
                                  setIsGeneratingPDF(false);
                                }, 600);
                              }}
                              icon={pdfDownloaded ? <FileCheck size={12} /> : <Download size={12} />}
                            >
                              Download PDF
                            </UiverseButton>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <UiverseButton
                            type="button"
                            variant="cyan"
                            size="sm"
                            style={{ flex: 1 }}
                            onClick={() => setActiveModal('timetable')}
                            icon={<Calendar size={13} />}
                          >
                            View Live Timetable & Clashes
                          </UiverseButton>
                          <UiverseButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveModal(null)}
                          >
                            Done
                          </UiverseButton>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <AlertTriangle size={18} color="#f87171" />
                        <span style={{ fontSize: '13px', color: '#f87171', fontWeight: 600, letterSpacing: '0.05em' }}>
                          NO REGISTERED ENTRY FOUND
                        </span>
                      </div>

                      <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '16px' }}>
                        We could not locate any active Cambridge Oct/Nov candidate registration for the email address:{' '}
                        <strong style={{ color: '#fff', wordBreak: 'break-all' }}>{email || 'None provided'}</strong>.
                      </p>

                      <div
                        style={{
                          background: 'rgba(239, 68, 68, 0.05)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          padding: '12px',
                          marginBottom: '20px',
                          fontSize: '11px',
                          color: 'var(--text-dim)',
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#f87171', marginBottom: '4px' }}>How to Resolve:</div>
                        <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <li>Verify that the email entered on the main page is correct.</li>
                          <li>Ensure your email is on the <strong>Pre-Approved Candidate Roster</strong>.</li>
                          <li>Complete your subject selections and click <strong>Enroll Papers via Discord & Email</strong> to submit your first registration.</li>
                        </ul>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <UiverseButton
                          type="button"
                          variant="cyan"
                          size="sm"
                          style={{ flex: 1 }}
                          onClick={() => {
                            setActiveModal(null);
                            // Auto focus the email field to help the user
                            const emailInput = document.getElementById('candidate-email') as HTMLInputElement;
                            emailInput?.focus();
                          }}
                        >
                          Correct Email / Register Now
                        </UiverseButton>
                        <UiverseButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveModal(null)}
                        >
                          Close
                        </UiverseButton>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cambridge Nightmare Support Multi-Turn Chatbot Modal */}
      {activeModal === 'nightmare' && (
        <Suspense fallback={null}>
          <CambridgeNightmareSupportModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            candidateContext={{
              selectedSubjects: subjects.filter((s) => s.selected).map((s) => `${s.code} ${s.name} (${s.tier})`),
              email: email || undefined,
              discord: discord || undefined,
              candidateName: candidateName || undefined,
              clashesCount: timetableSummary.directClashesCount,
            }}
          />
        </Suspense>
      )}

      {/* Floating Cambridge Nightmare Support AI Desk Button */}
      <div
        className="floating-nightmare-container"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 890,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
        }}
      >
        <button
          type="button"
          id="floating-nightmare-support-btn"
          onClick={() => setActiveModal('nightmare')}
          className="floating-nightmare-btn"
          style={{
            background: 'linear-gradient(135deg, #090e24 0%, #1e3a8a 50%, #2563eb 100%)',
            border: '1px solid rgba(147, 197, 253, 0.45)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.35)',
            borderRadius: '50px',
            padding: '10px 18px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sora)',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.02em',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          title="Cambridge Nightmare Support — AI Exam & Syllabus Crisis Counselor"
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={18} color="#93c5fd" />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#4ade80',
                border: '1.5px solid #090e24',
              }}
            />
          </div>
          <span>Cambridge Nightmare Support</span>
        </button>
      </div>
    </section>
  );
}
