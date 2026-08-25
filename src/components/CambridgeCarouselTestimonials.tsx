import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ShieldCheck, Sparkles } from 'lucide-react';

interface CarouselTestimonial {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  avatarBg: string;
  subject: string;
  quote: string;
  stars: number;
}

const CAROUSEL_DATA: CarouselTestimonial[] = [
  {
    id: 'carousel-1',
    name: 'Ahmed El-Ghandour',
    role: 'A-Level Chemistry (9701) Candidate',
    avatarInitials: 'AG',
    avatarBg: '#4F46E5',
    subject: 'Paper 5 Design Question Saved',
    quote: 'Designing gas syringe experiments was a constant source of stress. The instant scenario simulator taught me the precise controlled variables required by the CIE mark schemes.',
    stars: 5,
  },
  {
    id: 'carousel-2',
    name: 'Sarah Williams',
    role: 'IGCSE Lead Exam Officer',
    avatarInitials: 'SW',
    avatarBg: '#059669',
    subject: 'Flawless Isolation Scheduling',
    quote: 'Handling candidate separation rules for AM/PM key-times used to take hours. This system calculated our supervision gaps and room arrangements in seconds.',
    stars: 5,
  },
  {
    id: 'carousel-3',
    name: 'Mariam Aly',
    role: 'Private Candidate (0450 Business Studies)',
    avatarInitials: 'MA',
    avatarBg: '#7C3AED',
    subject: 'Component Code Clarity',
    quote: 'When registering on my own, I was terrified of picking the wrong option code. The structural lookup made component weights clear as crystal.',
    stars: 5,
  },
  {
    id: 'carousel-4',
    name: 'Thomas Müller',
    role: 'IGCSE Physics (0625) Candidate',
    avatarInitials: 'TM',
    avatarBg: '#D97706',
    subject: 'Grade Threshold Confidence Boost',
    quote: 'I was aiming for an A* but feared the high grade thresholds of the June series. Having precise historical curves helped me target exactly where I needed to focus.',
    stars: 5,
  },
];

export function CambridgeCarouselTestimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Auto-play interval for carousel when reduced motion is off
  useEffect(() => {
    if (isReducedMotion) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % CAROUSEL_DATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isReducedMotion]);

  // Handle prefers-reduced-motion media query
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsReducedMotion(true);
    }
    const listener = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const activeTestimonial = CAROUSEL_DATA[activeIndex];

  return (
    <section
      id="carousel-testimonials"
      style={{
        background: '#FAFAFA',
        color: '#09090B',
        padding: '80px 24px',
        borderBottom: '1px solid #E4E4E7',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Responsive Layout container */}
        {isReducedMotion ? (
          /* REDUCED MOTION LAYOUT: Show as plain readable list instead of a rotating/paginating carousel */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <div>
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
                <span>EXAM ROOM TRIAGE ARCHIVE</span>
              </div>
              <h2
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#09090B',
                  letterSpacing: '-0.02em',
                  margin: '0 0 12px',
                  lineHeight: 1.2,
                }}
              >
                What Candidates Are Saying
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: '#71717A',
                  maxWidth: '580px',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Read direct feedback from international learners resolving scheduling overlaps, last-minute formula updates, and component breakdowns.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {CAROUSEL_DATA.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E4E4E7',
                    borderRadius: '14px',
                    padding: '24px',
                    boxShadow: '0 1px 2px rgba(9, 9, 11, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: item.avatarBg,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}
                    >
                      {item.avatarInitials}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#09090B' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#71717A' }}>{item.role}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                      {Array.from({ length: item.stars }).map((_, i) => (
                        <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                      ))}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#09090B', marginBottom: '4px' }}>
                      {item.subject}
                    </div>
                    <p style={{ fontSize: '13px', color: '#71717A', lineHeight: 1.6, margin: 0 }}>
                      "{item.quote}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* STANDARD DYNAMIC CAROUSEL LAYOUT with Side-by-Side Flex, Crossfade AnimatePresence, and Dot Pagination */
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: '40px',
              alignItems: 'center',
            }}
          >
            {/* Left Side: Heading and Lede */}
            <div style={{ flex: '1 1 400px', minWidth: '300px' }}>
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
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  marginBottom: '16px',
                }}
              >
                <Sparkles size={13} color="#4F46E5" />
                <span>EXPERIENCE IN FOCUS</span>
              </div>
              <h2
                style={{
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  fontWeight: 700,
                  color: '#09090B',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  margin: '0 0 16px',
                }}
              >
                Real Outcomes, Managed stress
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: '#71717A',
                  lineHeight: 1.6,
                  margin: '0 0 24px',
                  fontWeight: 400,
                }}
              >
                Direct feedback on how Cambridge students, Private candidates, and Centre Heads use Nightmare Support to streamline exam logistics and ace revision.
              </p>

              {/* Dot Pagination controls - Real buttons with aria-current */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                role="tablist"
                aria-label="Testimonial navigation"
              >
                {CAROUSEL_DATA.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={activeIndex === idx}
                    aria-current={activeIndex === idx ? 'step' : undefined}
                    onClick={() => setActiveIndex(idx)}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: activeIndex === idx ? '#4F46E5' : '#E4E4E7',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(.16,1,.3,1)',
                    }}
                    title={`Go to testimonial ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right Side: Cross-Fading Quote Card */}
            <div style={{ flex: '1 1 500px', minWidth: '300px', position: 'relative', height: '240px' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: '#FFFFFF',
                    border: '1px solid #E4E4E7',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 1px 2px rgba(9, 9, 11, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Stars and Subject */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {Array.from({ length: activeTestimonial.stars }).map((_, i) => (
                          <Star key={i} size={15} fill="#F59E0B" color="#F59E0B" />
                        ))}
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#4F46E5',
                          fontWeight: 600,
                          background: 'rgba(79, 70, 229, 0.05)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(79, 70, 229, 0.1)',
                        }}
                      >
                        Verified Study Group
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#09090B',
                        margin: '4px 0 0',
                      }}
                    >
                      {activeTestimonial.subject}
                    </h3>

                    <p
                      style={{
                        fontSize: '13.5px',
                        color: '#3F3F46',
                        lineHeight: 1.6,
                        margin: 0,
                        fontStyle: 'italic',
                      }}
                    >
                      "{activeTestimonial.quote}"
                    </p>
                  </div>

                  {/* Initial-based Avatar Disc & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: activeTestimonial.avatarBg,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '12px',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)',
                      }}
                    >
                      {activeTestimonial.avatarInitials}
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#09090B', lineHeight: 1.2 }}>
                        {activeTestimonial.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#71717A', marginTop: '2px' }}>
                        {activeTestimonial.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default CambridgeCarouselTestimonials;
