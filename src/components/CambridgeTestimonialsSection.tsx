import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AnimatedHeading } from './AnimatedHeading';
import { MessageSquareQuote, Star, Pause, Play, ShieldCheck, Sparkles } from 'lucide-react';

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  avatarBg: string;
  subject: string;
  quote: string;
  stars: number;
  highlightTag?: string;
}

const COLUMN_1_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Zeyad Mansour',
    role: '0580 Extended Math Candidate',
    avatarInitials: 'ZM',
    avatarBg: '#4F46E5',
    subject: 'Paper 4 Question 7 Vector Panic',
    quote: 'Paper 4 Question 7 on vector proofs completely paralyzed me at 11 PM before the exam. Nightmare Support’s step-by-step breakdown restored my confidence and saved my A* target.',
    stars: 5,
    highlightTag: 'Math 0580',
  },
  {
    id: 't2',
    name: 'Dr. Tariq Al-Hassan',
    role: 'Centre Examinations Officer (EG042)',
    avatarInitials: 'TH',
    avatarBg: '#059669',
    subject: 'Chemistry P4 & Physics P4 Clash',
    quote: 'Managing 140 candidates with overlapping 0620/42 and 0625/42 paper clashes was a logistics nightmare. The automated spacing visualizer generated isolation schedules instantly.',
    stars: 5,
    highlightTag: 'Centre Admin',
  },
  {
    id: 't3',
    name: 'Maya Soliman',
    role: 'A-Level Biology (9700) Candidate',
    avatarInitials: 'MS',
    avatarBg: '#7C3AED',
    subject: '6-Hour Exam Day Isolation Window',
    quote: 'Having 6 hours of exams in one day had me terrified of disqualification. Nightmare Support calculated my exact 45-minute mandatory key-time isolation window.',
    stars: 5,
    highlightTag: 'Clash Isolation',
  },
  {
    id: 't4',
    name: 'Omar Khaled',
    role: '0620 Chemistry Extended Candidate',
    avatarInitials: 'OK',
    avatarBg: '#D97706',
    subject: 'Lost Statement of Entry at 2 AM',
    quote: 'I misplaced my paper Statement of Entry hours before Practical Paper 5. The portal export generated a verified PDF with my candidate ID right at my desk.',
    stars: 5,
    highlightTag: 'PDF Statement',
  },
];

const COLUMN_2_TESTIMONIALS: Testimonial[] = [
  {
    id: 't5',
    name: 'Nouran Hosny',
    role: 'IGCSE Fleet Coordinator',
    avatarInitials: 'NH',
    avatarBg: '#DB2777',
    subject: '2026 Economics (0455) Syllabus Shift',
    quote: 'The 2026 syllabus weight updates had our entire study group confused. The Nightmare Counselor broke down the new paper structures in under 3 minutes.',
    stars: 5,
    highlightTag: 'Syllabus 2026',
  },
  {
    id: 't6',
    name: 'Kareem El-Sayed',
    role: '0478 Computer Science Candidate',
    avatarInitials: 'KS',
    avatarBg: '#2563EB',
    subject: 'Paper 2 Pseudocode Trace Tables',
    quote: 'Pseudocode trace tables were tripping me up late at night. The counselor walked me through dry-run logic line-by-line without spoiling the solution.',
    stars: 5,
    highlightTag: 'CS 0478',
  },
  {
    id: 't7',
    name: 'Sarah Vandeberg',
    role: 'Private Cambridge Candidate',
    avatarInitials: 'SV',
    avatarBg: '#0891B2',
    subject: 'Component Code Verification',
    quote: 'Registering as a private candidate without center guidance is terrifying. This platform validated my 0500/12 and 0500/22 component codes seamlessly.',
    stars: 5,
    highlightTag: 'Private Candidate',
  },
  {
    id: 't8',
    name: 'Mr. David Henderson',
    role: 'Senior CIE Invigilator',
    avatarInitials: 'DH',
    avatarBg: '#475569',
    subject: 'Morning Candidate Roll Call',
    quote: 'The instant candidate registry log and CSV export feature cut our morning exam hall registration time by 70%. Essential for center management.',
    stars: 5,
    highlightTag: 'Exam Hall Logistics',
  },
];

const COLUMN_3_TESTIMONIALS: Testimonial[] = [
  {
    id: 't9',
    name: 'Laila Rashad',
    role: '0500 English First Language',
    avatarInitials: 'LR',
    avatarBg: '#E11D48',
    subject: 'Paper 1 Text Analysis Structure',
    quote: 'English First Language Text B evaluation felt subjective until I got mark-scheme structural breakdowns from the Nightmare Support assistant.',
    stars: 5,
    highlightTag: 'English 0500',
  },
  {
    id: 't10',
    name: 'Hassan Mostafa',
    role: '0625 Physics Candidate',
    avatarInitials: 'HM',
    avatarBg: '#0D9488',
    subject: 'Formula Sheet Memory Gap',
    quote: 'Forgot specific thermal capacity constants right before revision. The AI desk answered instantly with official CIE units and formula derivations.',
    stars: 5,
    highlightTag: 'Physics 0625',
  },
  {
    id: 't11',
    name: 'Eman Abdelrahman',
    role: 'Parent of IGCSE Candidate',
    avatarInitials: 'EA',
    avatarBg: '#9333EA',
    subject: 'Grade Threshold & Option Code Peace of Mind',
    quote: 'Understanding option codes like AX and CY was overwhelming. The support system explained option code weighting clearly, giving us total peace of mind.',
    stars: 5,
    highlightTag: 'Option Codes',
  },
  {
    id: 't12',
    name: 'Youssef Farouk',
    role: '0580 & 0620 Candidate',
    avatarInitials: 'YF',
    avatarBg: '#2563EB',
    subject: 'Timetable Clash Spacing Analysis',
    quote: 'Had Paper 2 Chemistry immediately followed by Math Paper 4. The timetable visualizer showed me exact break intervals so I could pace my stamina.',
    stars: 5,
    highlightTag: 'Pacing & Timetable',
  },
];

export function CambridgeTestimonialsSection() {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  return (
    <section
      id="testimonials-section"
      style={{
        background: '#FAFAFA',
        color: '#09090B',
        padding: '72px 24px 80px',
        borderTop: '1px solid #E4E4E7',
        borderBottom: '1px solid #E4E4E7',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(79, 70, 229, 0.08)',
              border: '1px solid rgba(79, 70, 229, 0.2)',
              color: '#4F46E5',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.03em',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={14} color="#4F46E5" />
            <span>VERIFIED CAMBRIDGE CANDIDATE & CENTRE FEEDBACK</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <AnimatedHeading
              text="WHAT PEOPLE SAY AT CAMBRIDGE NIGHTMARE"
              as="h2"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#09090B] justify-center"
              showUnderline={true}
              underlineColor="#4F46E5"
            />
          </div>

          <p
            style={{
              fontSize: '14px',
              color: '#71717A',
              maxWidth: '640px',
              margin: '16px auto 0',
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            Real Cambridge IGCSE candidates, private students, and center invigilators resolving paper 4 panics, timetable clashes, and key-time isolations.
          </p>

          {/* Reduced Motion Toggle Control */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setIsReducedMotion((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFFFFF',
                border: '1px solid #E4E4E7',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#71717A',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(9, 9, 11, 0.04)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              title="Toggle vertical drift animation or static grid view"
            >
              {isReducedMotion ? (
                <>
                  <Play size={13} color="#4F46E5" />
                  <span>Enable Motion Drift</span>
                </>
              ) : (
                <>
                  <Pause size={13} color="#71717A" />
                  <span>Pause Motion (Reduced Motion View)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Testimonials Body */}
        {isReducedMotion ? (
          /* REDUCED MOTION STATIC GRID FALLBACK */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '20px',
            }}
          >
            {[...COLUMN_1_TESTIMONIALS, ...COLUMN_2_TESTIMONIALS, ...COLUMN_3_TESTIMONIALS].map(
              (item) => (
                <TestimonialCard key={item.id} testimonial={item} />
              )
            )}
          </div>
        ) : (
          /* DYNAMIC VERTICAL DRIFT DRIFTING MARQUEE */
          <div
            className="testimonials-grid-wrapper vertical-fade-mask"
            style={{
              height: '620px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(1, 1fr)',
                gap: '20px',
                height: '100%',
              }}
              className="md:grid-cols-2 lg:grid-cols-3"
            >
              {/* LANE 1: Drifts UP (Always visible) */}
              <div style={{ overflow: 'hidden', height: '100%' }}>
                <div
                  className="testimonial-lane-up"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    ['--drift-duration' as any]: '36s',
                  }}
                >
                  {[...COLUMN_1_TESTIMONIALS, ...COLUMN_1_TESTIMONIALS].map((item, idx) => (
                    <TestimonialCard key={`c1-${item.id}-${idx}`} testimonial={item} />
                  ))}
                </div>
              </div>

              {/* LANE 2: Drifts DOWN (Reversed, hidden on mobile < 768px) */}
              <div
                style={{ overflow: 'hidden', height: '100%' }}
                className="hidden md:block"
              >
                <div
                  className="testimonial-lane-down"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    ['--drift-duration' as any]: '40s',
                  }}
                >
                  {[...COLUMN_2_TESTIMONIALS, ...COLUMN_2_TESTIMONIALS].map((item, idx) => (
                    <TestimonialCard key={`c2-${item.id}-${idx}`} testimonial={item} />
                  ))}
                </div>
              </div>

              {/* LANE 3: Drifts UP (Hidden on mobile & tablet < 1024px) */}
              <div
                style={{ overflow: 'hidden', height: '100%' }}
                className="hidden lg:block"
              >
                <div
                  className="testimonial-lane-up"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    ['--drift-duration' as any]: '34s',
                  }}
                >
                  {[...COLUMN_3_TESTIMONIALS, ...COLUMN_3_TESTIMONIALS].map((item, idx) => (
                    <TestimonialCard key={`c3-${item.id}-${idx}`} testimonial={item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Banner Badge */}
        <div
          style={{
            marginTop: '48px',
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: '1px solid #E4E4E7',
              boxShadow: '0 1px 2px rgba(9, 9, 11, 0.04)',
            }}
          >
            <Sparkles size={16} color="#4F46E5" />
            <span style={{ fontSize: '13px', color: '#09090B', fontWeight: 600 }}>
              Need instant Cambridge exam triage?
            </span>
            <span style={{ fontSize: '13px', color: '#71717A', fontWeight: 400 }}>
              Use the floating counselor desk anytime.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E4E4E7',
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0 1px 2px rgba(9, 9, 11, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="hover:border-[#4F46E5]/40 hover:shadow-md"
    >
      {/* Top Header: Initial Avatar & Role */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Initial-Based Avatar Disc */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: testimonial.avatarBg,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.04em',
              flexShrink: 0,
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.25)',
            }}
          >
            {testimonial.avatarInitials}
          </div>

          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#09090B',
                lineHeight: 1.2,
              }}
            >
              {testimonial.name}
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 400,
                color: '#71717A',
                marginTop: '2px',
              }}
            >
              {testimonial.role}
            </div>
          </div>
        </div>

        {/* Highlight Tag */}
        {testimonial.highlightTag && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#4F46E5',
              background: 'rgba(79, 70, 229, 0.08)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(79, 70, 229, 0.15)',
            }}
          >
            {testimonial.highlightTag}
          </span>
        )}
      </div>

      {/* Star Rating & Subject Title */}
      <div>
        <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
          {Array.from({ length: testimonial.stars }).map((_, i) => (
            <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
          ))}
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#09090B',
            lineHeight: 1.4,
          }}
        >
          {testimonial.subject}
        </div>
      </div>

      {/* Quote Content */}
      <p
        style={{
          fontSize: '13px',
          fontWeight: 400,
          color: '#3F3F46',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        "{testimonial.quote}"
      </p>
    </div>
  );
}

export default CambridgeTestimonialsSection;
