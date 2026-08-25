import React, { useState, useMemo } from 'react';
import { AnimatedHeading } from './AnimatedHeading';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Calendar,
  FileText,
  AlertCircle,
  BookOpen
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: 'Registration' | 'Timetables' | 'Support' | 'General';
  question: string;
  answer: string;
  badge?: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'clashes-resolution',
    category: 'Timetables',
    question: 'How do direct examination timetable clashes get identified and resolved?',
    answer:
      'Our intelligent clash detection engine automatically cross-references your selected Cambridge syllabus components against the official Oct/Nov 2026 timetable. If two papers overlap in the same examination window (e.g., Morning AM vs Afternoon PM session), the system flags the collision instantly and generates official supervisor isolation & supervision protocol guidelines to ensure candidate compliance.',
    badge: 'Automated Diagnostic',
  },
  {
    id: 'registration-deadline',
    category: 'Registration',
    question: 'What is the absolute deadline for Cambridge Oct/Nov 2026 examination entries?',
    answer:
      'Standard candidate entry submissions close in mid-August 2026. Late entry fee surcharges take effect starting September 1, 2026. Completing your preliminary subject registration via this candidate portal locks in baseline examination entry rates and secures your pre-approved seat on the center roster before late surcharges are enforced.',
    badge: 'Crucial Deadline',
  },
  {
    id: 'statement-of-entry',
    category: 'Support',
    question: 'How and when do I receive my official Statement of Entry (SOE) document?',
    answer:
      'Once your paper selections and candidate identity details are verified by an exam administrator, an official PDF Statement of Entry is generated. The SOE details your unique Candidate Number (4 digits), Center Number, and exact exam room schedule. You can download your PDF SOE directly from the Candidate Portal or receive a copy via Discord DM.',
    badge: 'Official Document',
  },
  {
    id: 'modify-subject-papers',
    category: 'Registration',
    question: 'Can I add, drop, or switch syllabus paper options after submitting my enrollment?',
    answer:
      'Yes! You can return to this portal at any time before the entry freeze, enter your registered email address, and access the "Manage Papers" section to switch tiers (e.g., Core vs Extended), update option codes, or add additional subjects without losing your existing candidate record.',
    badge: 'Flexible Enrolment',
  },
  {
    id: 'missed-exam-policy',
    category: 'General',
    question: 'What happens if I miss a scheduled Cambridge exam paper due to illness or emergency?',
    answer:
      'Cambridge Assessment International Education requires formal medical certification or emergency documentation submitted through your exam center coordinator within 7 calendar days of the missed component. Qualified candidates may apply for Special Consideration (Grade Adjustment) if minimum component completion criteria are satisfied.',
    badge: 'Cambridge Regulations',
  },
  {
    id: 'discord-notifications',
    category: 'Support',
    question: 'How does the automated Discord DM & email verification system work?',
    answer:
      'Upon submitting your subject selections, our backend webhooks dispatch confirmation alerts directly to your provided Discord handle (@username) and personal email address. Center administrators use this verified channel to broadcast timetable change notices, venue seat numbers, and emergency alerts.',
    badge: 'Real-time Webhook',
  },
  {
    id: 'private-candidate-eligibility',
    category: 'General',
    question: 'Are private candidates allowed to enroll for practical and oral examination components?',
    answer:
      'Private candidate eligibility varies by subject code. While written theory components (Papers 1, 2, 3, 4) are fully available, practical laboratory papers (Paper 5) or speaking tests may require alternative written alternative options (e.g., Paper 6 Alternative to Practical) depending on center laboratory facilities. Check our Subject Catalog for specific tier details.',
    badge: 'Syllabus Guidance',
  },
];

interface FAQSectionProps {
  onOpenNightmareSupport?: () => void;
  onOpenSubjectCatalog?: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  onOpenNightmareSupport,
  onOpenSubjectCatalog,
}) => {
  const [openId, setOpenId] = useState<string | null>('clashes-resolution');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.badge && item.badge.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const categories = ['All', 'Registration', 'Timetables', 'Support', 'General'];

  return (
    <section
      id="faq-section"
      aria-labelledby="faq-section-heading"
      style={{
        marginTop: '36px',
        marginBottom: '24px',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '24px 20px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: 'rgba(96, 165, 250, 0.15)',
                border: '1px solid rgba(96, 165, 250, 0.35)',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HelpCircle size={20} color="#60a5fa" />
            </div>
            <div>
              <AnimatedHeading
                text="FREQUENTLY ASKED QUESTIONS"
                as="h2"
                className="text-base sm:text-lg font-bold text-white tracking-wider"
              />
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0, marginTop: '2px' }}>
                Direct guidance for Cambridge Oct/Nov 2026 candidates & center administrators
              </p>
            </div>
          </div>

          <span
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '4px 10px',
              borderRadius: '20px',
            }}
          >
            {FAQ_DATA.length} Verified Answers
          </span>
        </div>

        {/* Search & Category Filter Controls */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: '12px',
          }}
        >
          {/* Quick Search Input */}
          <div
            style={{
              position: 'relative',
              flex: '1 1 240px',
              minWidth: '220px',
            }}
          >
            <Search
              size={15}
              color="var(--text-dim)"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            <input
              type="text"
              placeholder="Search questions or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px 12px 10px 36px',
                fontSize: '13px',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                minHeight: '44px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    background: isActive ? '#60a5fa' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#000000' : 'var(--text-dim)',
                    border: '1px solid',
                    borderColor: isActive ? '#60a5fa' : 'var(--line)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    minHeight: '40px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Questions Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                style={{
                  background: isOpen ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.45)',
                  border: '1px solid',
                  borderColor: isOpen ? 'rgba(96, 165, 250, 0.45)' : 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-sora)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: isOpen ? '#60a5fa' : '#ffffff',
                        lineHeight: 1.4,
                      }}
                    >
                      {faq.question}
                    </span>
                    {faq.badge && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(163, 230, 53, 0.15)',
                          color: '#a3e635',
                          border: '1px solid rgba(163, 230, 53, 0.3)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {faq.badge}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      background: isOpen ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '50%',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isOpen ? <ChevronUp size={16} color="#60a5fa" /> : <ChevronDown size={16} color="var(--text-dim)" />}
                  </div>
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 16px 16px 16px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      marginTop: '4px',
                      paddingTop: '12px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#cbd5e1',
                        lineHeight: 1.65,
                        margin: 0,
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                      }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-dim)',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px dashed var(--line)',
            }}
          >
            No matching FAQ questions found for "{searchQuery}". Try selecting another category or clear your search term.
          </div>
        )}
      </div>

      {/* Footer Support Prompt */}
      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <Sparkles size={15} color="#a3e635" />
          <span>Need specialized syllabus counseling or clash advice?</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onOpenSubjectCatalog && (
            <button
              type="button"
              onClick={onOpenSubjectCatalog}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                color: '#ffffff',
                padding: '8px 14px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <BookOpen size={14} color="#60a5fa" />
              <span>Browse Subject Catalog</span>
            </button>
          )}

          {onOpenNightmareSupport && (
            <button
              type="button"
              onClick={onOpenNightmareSupport}
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                border: '1px solid rgba(147, 197, 253, 0.4)',
                borderRadius: '6px',
                color: '#ffffff',
                padding: '8px 14px',
                fontSize: '12px',
                fontFamily: 'var(--font-sora)',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <MessageSquare size={14} color="#ffffff" />
              <span>Ask Nightmare AI Counselor</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
