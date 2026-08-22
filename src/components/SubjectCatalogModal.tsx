import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ExamSubject } from '../types';
import { Search, X, Check, BookOpen, Filter, Sparkles, CheckCircle2, RotateCcw, Layers, Calendar } from 'lucide-react';
import { ExamScheduleVisualizer } from './ExamScheduleVisualizer';

interface SubjectCatalogModalProps {
  subjects: ExamSubject[];
  onToggleSubject: (code: string) => void;
  onTogglePaper: (code: string, paperName: string) => void;
  onSelectOnlyPaper: (code: string, paperName: string) => void;
  onSelectAllPapers: (code: string) => void;
  onSelectMultiple: (codes: string[], select: boolean) => void;
  onClose: () => void;
  initialSearch?: string;
  defaultTab?: 'catalog' | 'timetable';
}

export function SubjectCatalogModal({
  subjects,
  onToggleSubject,
  onTogglePaper,
  onSelectOnlyPaper,
  onSelectAllPapers,
  onSelectMultiple,
  onClose,
  initialSearch = '',
  defaultTab = 'catalog',
}: SubjectCatalogModalProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'timetable'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'catalog') {
      searchInputRef.current?.focus();
    }
  }, [activeTab]);

  // Compute unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(subjects.map((s) => s.category || 'General')));
    return ['All', 'Selected Only', ...cats];
  }, [subjects]);

  // Filtered subjects based on search query and category
  const filteredSubjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return subjects.filter((subject) => {
      // Category filter
      if (selectedCategory === 'Selected Only') {
        if (!subject.selected) return false;
      } else if (selectedCategory !== 'All') {
        if (subject.category !== selectedCategory) return false;
      }

      // Search query filter (matches code, name, category, or paper names)
      if (!query) return true;

      const matchCode = subject.code.toLowerCase().includes(query);
      const matchName = subject.name.toLowerCase().includes(query);
      const matchCategory = (subject.category || '').toLowerCase().includes(query);
      const matchPapers = subject.papers.some((p) => p.toLowerCase().includes(query));
      const matchTier = subject.tier.toLowerCase().includes(query);

      return matchCode || matchName || matchCategory || matchPapers || matchTier;
    });
  }, [subjects, searchQuery, selectedCategory]);

  const selectedCount = subjects.filter((s) => s.selected).length;

  const handleSelectFiltered = () => {
    const codesToSelect = filteredSubjects.map((s) => s.code);
    onSelectMultiple(codesToSelect, true);
  };

  const handleDeselectFiltered = () => {
    const codesToDeselect = filteredSubjects.map((s) => s.code);
    onSelectMultiple(codesToDeselect, false);
  };

  // Preset Bundles
  const handleApplyPreset = (presetName: 'stem' | 'business' | 'humanities' | 'languages') => {
    let targetCodes: string[] = [];
    if (presetName === 'stem') {
      targetCodes = ['0580', '0625', '0620', '0610', '0478'];
    } else if (presetName === 'business') {
      targetCodes = ['0450', '0452', '0455', '0580', '0500'];
    } else if (presetName === 'humanities') {
      targetCodes = ['0470', '0460', '0495', '0500', '0457'];
    } else if (presetName === 'languages') {
      targetCodes = ['0500', '0508', '0520', '0530'];
    }

    onSelectMultiple(targetCodes, true);
  };

  return (
    <div
      className="terminal-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-dialog-title"
      onClick={onClose}
    >
      <div
        className="terminal-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: 'var(--font-mono)',
          maxWidth: '840px',
          width: '94vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(16px, 2.5vw, 28px)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            borderBottom: '1px solid var(--line)',
            paddingBottom: '12px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} color="#60a5fa" />
            <span
              id="catalog-dialog-title"
              style={{
                fontSize: '12px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              CAMBRIDGE OCT/NOV EXAMINATION ENROLMENT
            </span>
          </div>

          {/* Tab Switcher Buttons */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              style={{
                background: activeTab === 'catalog' ? '#60a5fa' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'catalog' ? '#000' : 'var(--text-dim)',
                border: '1px solid',
                borderColor: activeTab === 'catalog' ? '#60a5fa' : 'var(--line)',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Layers size={13} />
              <span>Subjects & Papers ({selectedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timetable')}
              style={{
                background: activeTab === 'timetable' ? '#60a5fa' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'timetable' ? '#000' : 'var(--text-dim)',
                border: '1px solid',
                borderColor: activeTab === 'timetable' ? '#60a5fa' : 'var(--line)',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Calendar size={13} />
              <span>Timetable & Clashes</span>
            </button>

            <button
              type="button"
              onClick={onClose}
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
        </div>

        {activeTab === 'timetable' ? (
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
            <ExamScheduleVisualizer
              subjects={subjects}
              onClose={onClose}
              onOpenSubjectCatalog={() => setActiveTab('catalog')}
              isEmbedded={true}
            />
          </div>
        ) : (
          <>
            {/* Search Bar */}
        <div style={{ marginBottom: '14px' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--line-strong)',
              transition: 'border-color 0.2s ease',
            }}
          >
            <span style={{ paddingLeft: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
              <Search size={16} />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search syllabus by name, code or paper (e.g. 0580, Mathematics, Chemistry Paper 4, Physics, Arabic)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '12px 12px',
                color: '#ffffff',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
              fontSize: '11px',
              color: 'var(--text-dim)',
            }}
          >
            <span>
              Showing <strong style={{ color: '#fff' }}>{filteredSubjects.length}</strong> of {subjects.length} subjects
            </span>
            <span>
              Currently Enrolled: <strong style={{ color: '#60a5fa' }}>{selectedCount} Subjects</strong>
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {categories.map((cat) => {
            const count =
              cat === 'All'
                ? subjects.length
                : cat === 'Selected Only'
                ? selectedCount
                : subjects.filter((s) => s.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: isSelected ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid',
                  borderColor: isSelected ? 'rgba(255, 255, 255, 0.5)' : 'var(--line)',
                  color: isSelected ? '#ffffff' : 'var(--text-dim)',
                  fontSize: '11px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  borderRadius: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Quick Presets & Bulk Select Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '12px',
            fontSize: '11px',
            color: 'var(--text-dim)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-dimmer)' }}>Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('stem')}
              style={{
                background: 'transparent',
                border: '1px dashed var(--line)',
                color: 'var(--text-dim)',
                padding: '2px 7px',
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              + STEM Pack
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('business')}
              style={{
                background: 'transparent',
                border: '1px dashed var(--line)',
                color: 'var(--text-dim)',
                padding: '2px 7px',
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              + Commerce Pack
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('humanities')}
              style={{
                background: 'transparent',
                border: '1px dashed var(--line)',
                color: 'var(--text-dim)',
                padding: '2px 7px',
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              + Humanities Pack
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {filteredSubjects.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleSelectFiltered}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '10px',
                    textDecoration: 'underline',
                  }}
                >
                  Select all shown
                </button>
                <button
                  type="button"
                  onClick={handleDeselectFiltered}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    fontSize: '10px',
                    textDecoration: 'underline',
                  }}
                >
                  Deselect shown
                </button>
              </>
            )}
          </div>
        </div>

        {/* Subjects Scrollable List */}
        <div
          style={{
            flex: 1,
            maxHeight: '48vh',
            minHeight: '240px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingRight: '6px',
            marginBottom: '16px',
          }}
        >
          {filteredSubjects.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-dim)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed var(--line)',
              }}
            >
              <p style={{ fontSize: '13px', color: '#fff', marginBottom: '6px' }}>No subjects match "{searchQuery}"</p>
              <p style={{ fontSize: '11px', color: 'var(--text-dimmer)' }}>
                Try searching by 4-digit code (e.g. 0580, 0620, 0625) or paper name.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                style={{
                  marginTop: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid var(--line)',
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredSubjects.map((sub) => {
              const selectedPapers = sub.selectedPapers || sub.papers;
              const isAllPapersSelected =
                sub.selected &&
                sub.papers.length > 0 &&
                sub.papers.every((p) => selectedPapers.includes(p));

              return (
                <div
                  key={sub.code}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 14px',
                    border: '1px solid',
                    borderColor: sub.selected ? 'rgba(96, 165, 250, 0.45)' : 'var(--line)',
                    background: sub.selected ? 'rgba(30, 41, 59, 0.35)' : 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.15s ease',
                    gap: '10px',
                  }}
                >
                  {/* Subject Header Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            background: sub.selected ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                            color: sub.selected ? '#000000' : '#ffffff',
                            fontWeight: 700,
                            padding: '1px 6px',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {sub.code}
                        </span>
                        <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>{sub.name}</span>
                        {sub.category && (
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-dimmer)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              padding: '1px 5px',
                            }}
                          >
                            {sub.category}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '10px',
                            color: sub.tier === 'Extended' ? '#fbbf24' : 'var(--text-dim)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            padding: '1px 5px',
                          }}
                        >
                          {sub.tier}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => onToggleSubject(sub.code)}
                        style={{
                          fontSize: '11px',
                          letterSpacing: '0.08em',
                          color: sub.selected ? '#ffffff' : 'var(--text-dim)',
                          border: '1px solid',
                          borderColor: sub.selected ? '#60a5fa' : 'var(--line)',
                          background: sub.selected ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          padding: '5px 10px',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {sub.selected ? (
                          <>
                            <Check size={12} color="#60a5fa" /> ENROLLED
                          </>
                        ) : (
                          '+ ENROLL SUBJECT'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Specific Paper Selection Grid / Options */}
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '10px',
                        color: 'var(--text-dim)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Layers size={11} color="#60a5fa" />
                        <span>Select Paper Components:</span>
                        {sub.selected && (
                          <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                            ({selectedPapers.length} of {sub.papers.length} selected
                            {selectedPapers.length === 1 ? ` — ${selectedPapers[0].split(' ')[0]} ${selectedPapers[0].split(' ')[1]} only` : ''}
                            {isAllPapersSelected ? ' — All Papers' : ''})
                          </span>
                        )}
                      </div>

                      {/* Quick "All Papers" selector */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => onSelectAllPapers(sub.code)}
                          style={{
                            background: isAllPapersSelected ? 'rgba(96, 165, 250, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid',
                            borderColor: isAllPapersSelected ? '#60a5fa' : 'rgba(255, 255, 255, 0.15)',
                            color: isAllPapersSelected ? '#ffffff' : 'var(--text-dim)',
                            fontSize: '10px',
                            padding: '2px 8px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                          }}
                          title={`Select all ${sub.papers.length} papers for ${sub.name}`}
                        >
                          {isAllPapersSelected ? '✓ ALL PAPERS SELECTED' : 'SELECT ALL PAPERS'}
                        </button>
                      </div>
                    </div>

                    {/* Paper Buttons with 'Paper X only' shortcuts */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '6px',
                      }}
                    >
                      {sub.papers.map((paperName) => {
                        const isPaperSelected = sub.selected && selectedPapers.includes(paperName);
                        const paperNumberMatch = paperName.match(/Paper\s*\d+/i);
                        const shortPaperName = paperNumberMatch ? paperNumberMatch[0] : paperName;

                        return (
                          <div
                            key={paperName}
                            style={{
                              display: 'flex',
                              alignItems: 'stretch',
                              background: isPaperSelected ? 'rgba(96, 165, 250, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid',
                              borderColor: isPaperSelected ? 'rgba(96, 165, 250, 0.6)' : 'rgba(255, 255, 255, 0.08)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {/* Main paper toggle button */}
                            <button
                              type="button"
                              onClick={() => onTogglePaper(sub.code, paperName)}
                              style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'transparent',
                                border: 'none',
                                color: isPaperSelected ? '#ffffff' : 'var(--text-dim)',
                                padding: '6px 8px',
                                fontSize: '11px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono)',
                              }}
                              title={`Toggle ${paperName}`}
                            >
                              <span
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  border: '1px solid',
                                  borderColor: isPaperSelected ? '#60a5fa' : 'var(--line)',
                                  background: isPaperSelected ? '#60a5fa' : 'transparent',
                                  color: '#000',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  flexShrink: 0,
                                }}
                              >
                                {isPaperSelected ? '✓' : ''}
                              </span>
                              <span style={{ lineHeight: 1.3 }}>{paperName}</span>
                            </button>

                            {/* 'Only' shortcut button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectOnlyPaper(sub.code, paperName);
                              }}
                              style={{
                                background:
                                  sub.selected && selectedPapers.length === 1 && selectedPapers[0] === paperName
                                    ? 'rgba(96, 165, 250, 0.3)'
                                    : 'rgba(255, 255, 255, 0.04)',
                                border: 'none',
                                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                                color:
                                  sub.selected && selectedPapers.length === 1 && selectedPapers[0] === paperName
                                    ? '#60a5fa'
                                    : 'var(--text-dimmer)',
                                padding: '0 8px',
                                fontSize: '10px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontFamily: 'var(--font-mono)',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title={`Select ONLY ${paperName} (e.g. sit ${shortPaperName} only)`}
                            >
                              {shortPaperName} only
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

          {/* Modal Footer Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--line)',
              paddingTop: '14px',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Enrolling in <strong style={{ color: '#ffffff' }}>{selectedCount} Cambridge Subjects</strong> with customized papers
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn--solid"
                style={{ padding: '12px 24px', fontSize: '12px' }}
                onClick={onClose}
              >
                Confirm Enrolment ({selectedCount})
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

