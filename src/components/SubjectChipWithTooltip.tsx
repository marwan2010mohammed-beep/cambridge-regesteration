import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, CheckCircle2, Info, X } from 'lucide-react';
import { ExamSubject } from '../types';
import { getSyllabusRequirements } from '../data/subjects';

interface SubjectChipWithTooltipProps {
  subject: ExamSubject;
  onCustomizePapers?: () => void;
  onRemoveSubject?: () => void;
  showRemoveButton?: boolean;
}

export const SubjectChipWithTooltip: React.FC<SubjectChipWithTooltipProps> = ({
  subject,
  onCustomizePapers,
  onRemoveSubject,
  showRemoveButton = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const selPapers = subject.selectedPapers || subject.papers;
  const isAll = selPapers.length === subject.papers.length;
  const papersBadge = isAll
    ? 'All Papers'
    : selPapers.length === 1
    ? `${selPapers[0].match(/Paper\s*\d+/i)?.[0] || selPapers[0]} only`
    : `${selPapers.map((p) => p.match(/Paper\s*\d+/i)?.[0] || p).join(', ')}`;

  const syllabusText = getSyllabusRequirements(subject);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <span
        className="subject-chip"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderColor: isHovered ? '#60a5fa' : undefined,
          boxShadow: isHovered ? '0 0 10px rgba(96, 165, 250, 0.3)' : undefined,
        }}
      >
        <span className="subject-chip-code">[{subject.code}]</span>
        <span>{subject.name.split(' ')[0]}</span>
        
        <span
          onClick={(e) => {
            e.stopPropagation();
            if (onCustomizePapers) onCustomizePapers();
          }}
          style={{
            fontSize: '11px',
            background: isAll ? 'rgba(255,255,255,0.1)' : 'rgba(163,230,53,0.18)',
            color: isAll ? 'var(--text-dim)' : '#a3e635',
            border: '1px solid',
            borderColor: isAll ? 'rgba(255,255,255,0.15)' : 'rgba(163,230,53,0.45)',
            padding: '1px 6px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
          }}
          title="Click to customize papers"
        >
          {papersBadge}
        </span>

        <Info
          size={12}
          color={isHovered ? '#60a5fa' : 'var(--text-dimmer)'}
          style={{ transition: 'color 0.2s ease' }}
        />

        {showRemoveButton && onRemoveSubject && (
          <button
            type="button"
            className="subject-chip-remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveSubject();
            }}
            title={`Remove ${subject.name}`}
            aria-label={`Remove ${subject.name}`}
          >
            ✕
          </button>
        )}
      </span>

      {/* Hover-activated Syllabus Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              width: '280px',
              maxWidth: '90vw',
              padding: '10px 12px',
              background: 'rgba(15, 23, 42, 0.97)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(96, 165, 250, 0.45)',
              borderRadius: '8px',
              boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(96, 165, 250, 0.25)',
              color: '#fff',
              pointerEvents: 'none',
              textAlign: 'left',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '6px',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                paddingBottom: '6px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#60a5fa',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <BookOpen size={13} color="#60a5fa" />
                <span>[{subject.code}] {subject.name}</span>
              </div>
            </div>

            {/* Category & Tier Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px',
                fontSize: '10px',
                color: 'var(--text-dim)',
              }}
            >
              <span
                style={{
                  background: 'rgba(96,165,250,0.15)',
                  color: '#93c5fd',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  border: '1px solid rgba(96,165,250,0.3)',
                  fontWeight: 600,
                }}
              >
                {subject.category || 'Cambridge IGCSE'}
              </span>
              <span>•</span>
              <span style={{ color: '#a3e635' }}>{subject.tier} Tier</span>
            </div>

            {/* Syllabus Description */}
            <div style={{ marginBottom: '8px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#fbbf24',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '2px',
                }}
              >
                Syllabus Requirements:
              </div>
              <p
                style={{
                  fontSize: '11px',
                  color: '#e2e8f0',
                  lineHeight: '1.4',
                  margin: 0,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {syllabusText}
              </p>
            </div>

            {/* Enrolled Papers Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                color: '#a3e635',
                fontFamily: 'var(--font-mono)',
                borderTop: '1px dashed rgba(255,255,255,0.1)',
                marginTop: '4px',
                paddingTop: '4px',
              }}
            >
              <CheckCircle2 size={11} color="#a3e635" />
              <span>Papers: {selPapers.join(', ')}</span>
            </div>

            {/* Pointer Arrow */}
            <div
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '8px',
                height: '8px',
                background: 'rgba(15, 23, 42, 0.97)',
                borderRight: '1px solid rgba(96, 165, 250, 0.45)',
                borderBottom: '1px solid rgba(96, 165, 250, 0.45)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
