import React, { useState, useMemo } from 'react';
import { ExamSubject, ScheduledExamPaper, TimetableDaySchedule, TimetableSummary, CandidateEnrollment } from '../types';
import {
  generateTimetableSummary,
  generateICalendarString,
} from '../data/examSchedule';
import { generateStatementOfEntryPDF } from '../utils/pdfGenerator';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Info,
  CalendarCheck,
  Zap,
  Activity,
  Layers,
  FileText,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface ExamScheduleVisualizerProps {
  subjects: ExamSubject[];
  candidateName?: string;
  onClose?: () => void;
  onOpenSubjectCatalog?: () => void;
  isEmbedded?: boolean;
}

export function ExamScheduleVisualizer({
  subjects,
  candidateName,
  onClose,
  onOpenSubjectCatalog,
  isEmbedded = false,
}: ExamScheduleVisualizerProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline' | 'clashes'>('calendar');
  const [selectedMonth, setSelectedMonth] = useState<'both' | '10' | '11'>('both');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedIcs, setCopiedIcs] = useState(false);

  const timetable = useMemo(() => {
    return generateTimetableSummary(subjects);
  }, [subjects]);

  // Selected day object
  const activeDaySchedule = useMemo(() => {
    if (!selectedDay) {
      return timetable.days[0] || null;
    }
    return timetable.days.find((d) => d.date === selectedDay) || null;
  }, [timetable, selectedDay]);

  const handleDownloadICS = () => {
    const icsContent = generateICalendarString(subjects, candidateName);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cambridge_IGCSE_OctNov2026_Timetable.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopiedIcs(true);
    setTimeout(() => setCopiedIcs(false), 2500);
  };

  const handleDownloadPDF = () => {
    const selectedSubjects = subjects.filter((s) => s.selected);
    const candidateEnrollment: CandidateEnrollment = {
      id: `CIE-${Math.floor(1000 + Math.random() * 9000)}`,
      email: 'candidate@cie-portal.org',
      discord: '@candidate',
      candidateName: candidateName || 'Cambridge Private Candidate',
      centerNumber: 'EG042',
      subjects: selectedSubjects.map((s) => ({
        code: s.code,
        name: s.name,
        tier: s.tier,
        selectedPapers: s.selectedPapers && s.selectedPapers.length > 0 ? s.selectedPapers : [...s.papers],
      })),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      status: 'Enrolled & Verified',
    };
    generateStatementOfEntryPDF(candidateEnrollment, subjects);
  };

  const handleCopyTimetableText = () => {
    let text = `CAMBRIDGE IGCSE OCT/NOV 2026 - CANDIDATE TIMETABLE\n`;
    if (candidateName) text += `Candidate: ${candidateName}\n`;
    text += `Total Papers: ${timetable.totalPapers} | Total Days: ${timetable.totalExamDays}\n`;
    text += `Duration: ${timetable.startDate} to ${timetable.endDate} (${timetable.durationSpanDays} days)\n`;
    text += `Average Spacing: ${timetable.averageGapDays} days between exams\n\n`;

    if (timetable.clashes.length > 0) {
      text += `--- CLASH DIAGNOSTICS ---\n`;
      timetable.clashes.forEach((c) => {
        text += `[${c.type}] ${c.date} (${c.dayOfWeek}): ${c.description}\n`;
      });
      text += `\n`;
    }

    text += `--- EXAMINATION SCHEDULE ---\n`;
    timetable.days.forEach((d) => {
      text += `${d.date} (${d.dayOfWeek}):\n`;
      d.papers.forEach((p) => {
        text += `  • [${p.session} ${p.timeSlot}] [${p.paperCode}] ${p.subjectName} - ${p.paperName} (${p.durationLabel})\n`;
      });
    });

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  if (timetable.totalPapers === 0) {
    return (
      <div
        style={{
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--line)',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <CalendarIcon size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px auto' }} />
        <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '8px' }}>No Subjects Selected for Timetable</h4>
        <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '16px', maxWidth: '420px', margin: '0 auto 16px auto' }}>
          Select your Cambridge Oct/Nov examination subjects to instantly generate an interactive calendar, spacing roadmap, and clash detection analysis.
        </p>
        {onOpenSubjectCatalog && (
          <button
            type="button"
            className="btn btn--solid"
            onClick={onOpenSubjectCatalog}
            style={{ fontSize: '12px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Layers size={14} /> Open Subject Catalog & Choose Papers
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="exam-schedule-visualizer"
      style={{
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-main)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
      }}
    >
      {/* Visualizer Top Bar & Diagnostics Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '10px',
        }}
      >
        {/* Metric 1: Total Papers */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--line)',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--text-dimmer)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Enrolled Papers
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#60a5fa' }}>{timetable.totalPapers}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>papers in {timetable.totalExamDays} days</span>
          </div>
        </div>

        {/* Metric 2: Date Span & Span Days */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--line)',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--text-dimmer)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Exam Window Span
          </span>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
            {timetable.startDate.slice(5)} → {timetable.endDate.slice(5)}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
            {timetable.durationSpanDays} days series window
          </span>
        </div>

        {/* Metric 3: Spacing Gap */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--line)',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--text-dimmer)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Average Spacing Gap
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: timetable.averageGapDays >= 3 ? '#a3e635' : timetable.averageGapDays >= 1.5 ? '#fbbf24' : '#f87171',
              }}
            >
              {timetable.averageGapDays}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>days rest/revision</span>
          </div>
        </div>

        {/* Metric 4: Clash Status Diagnostic */}
        <div
          style={{
            background:
              timetable.directClashesCount > 0
                ? 'rgba(239, 68, 68, 0.12)'
                : timetable.sameDayDoubleCount > 0
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(34, 197, 94, 0.08)',
            border: '1px solid',
            borderColor:
              timetable.directClashesCount > 0
                ? 'rgba(239, 68, 68, 0.4)'
                : timetable.sameDayDoubleCount > 0
                ? 'rgba(245, 158, 11, 0.4)'
                : 'rgba(34, 197, 94, 0.3)',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--text-dimmer)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Clash Diagnostic
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {timetable.directClashesCount > 0 ? (
              <>
                <AlertTriangle size={14} color="#f87171" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171' }}>
                  {timetable.directClashesCount} Direct Session Clash
                </span>
              </>
            ) : timetable.sameDayDoubleCount > 0 ? (
              <>
                <Zap size={14} color="#fbbf24" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>
                  {timetable.sameDayDoubleCount} Double Exam Day
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} color="#4ade80" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#4ade80' }}>
                  No Clashes Detected
                </span>
              </>
            )}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
            {timetable.directClashesCount > 0 ? 'Center supervision required' : 'Optimal spacing distribution'}
          </span>
        </div>
      </div>

      {/* Clash Notification Banner if critical direct clash exists */}
      {timetable.directClashesCount > 0 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
              ATTENTION: Direct Session Timetable Clash Detected
            </div>
            <div style={{ fontSize: '11px', color: '#fca5a5', lineHeight: 1.4 }}>
              {timetable.clashes.find((c) => c.type === 'DIRECT_SESSION_CLASH')?.description}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
              <strong>Cambridge Resolution:</strong> Your registered exam center will arrange back-to-back sitting under full center isolation rules. You will sit both papers on the scheduled date without academic penalty.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setViewMode('clashes')}
            style={{
              background: 'rgba(239, 68, 68, 0.3)',
              border: '1px solid #f87171',
              color: '#fff',
              fontSize: '10px',
              padding: '4px 8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)',
            }}
          >
            View Clash Report →
          </button>
        </div>
      )}

      {/* Control Tabs & Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          borderBottom: '1px solid var(--line)',
          paddingBottom: '10px',
        }}
      >
        {/* View mode toggle tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            style={{
              background: viewMode === 'calendar' ? '#60a5fa' : 'rgba(255, 255, 255, 0.05)',
              color: viewMode === 'calendar' ? '#000' : 'var(--text-dim)',
              border: '1px solid',
              borderColor: viewMode === 'calendar' ? '#60a5fa' : 'var(--line)',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <CalendarIcon size={13} /> Month Calendar View
          </button>

          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            style={{
              background: viewMode === 'timeline' ? '#60a5fa' : 'rgba(255, 255, 255, 0.05)',
              color: viewMode === 'timeline' ? '#000' : 'var(--text-dim)',
              border: '1px solid',
              borderColor: viewMode === 'timeline' ? '#60a5fa' : 'var(--line)',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Activity size={13} /> Spacing Timeline
          </button>

          <button
            type="button"
            onClick={() => setViewMode('clashes')}
            style={{
              background:
                viewMode === 'clashes'
                  ? '#60a5fa'
                  : timetable.directClashesCount > 0
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
              color: viewMode === 'clashes' ? '#000' : timetable.directClashesCount > 0 ? '#f87171' : 'var(--text-dim)',
              border: '1px solid',
              borderColor:
                viewMode === 'clashes'
                  ? '#60a5fa'
                  : timetable.directClashesCount > 0
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'var(--line)',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <AlertTriangle size={13} /> Clash Diagnostic ({timetable.clashes.length})
          </button>
        </div>

        {/* Action buttons (PDF SOE, iCal Sync, Copy, Print) */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleDownloadPDF}
            style={{
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(96, 165, 250, 0.5)',
              color: '#60a5fa',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontFamily: 'var(--font-mono)',
            }}
            title="Download official Cambridge Statement of Entry & Timetable PDF"
          >
            <FileText size={12} />
            <span>Statement of Entry (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadICS}
            style={{
              background: 'rgba(96, 165, 250, 0.12)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              color: '#60a5fa',
              padding: '5px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontFamily: 'var(--font-mono)',
            }}
            title="Download .ics calendar file for Google Calendar, Apple Calendar, or Outlook"
          >
            {copiedIcs ? <Check size={12} /> : <Download size={12} />}
            <span>{copiedIcs ? 'Calendar Exported!' : 'Export to iCal (.ics)'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTimetableText}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--line)',
              color: 'var(--text-dim)',
              padding: '5px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontFamily: 'var(--font-mono)',
            }}
            title="Copy formatted timetable text to clipboard"
          >
            {copiedText ? <Check size={12} color="#a3e635" /> : <Copy size={12} />}
            <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--line)',
              color: 'var(--text-dim)',
              padding: '5px 10px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontFamily: 'var(--font-mono)',
            }}
            title="Print or Save PDF"
          >
            <Printer size={12} /> Print Timetable
          </button>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE MONTH CALENDAR */}
      {viewMode === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Month selector toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setSelectedMonth('both')}
                style={{
                  background: selectedMonth === 'both' ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: '1px solid var(--line)',
                  color: selectedMonth === 'both' ? '#fff' : 'var(--text-dimmer)',
                  fontSize: '10px',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Full Oct & Nov
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonth('10')}
                style={{
                  background: selectedMonth === '10' ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: '1px solid var(--line)',
                  color: selectedMonth === '10' ? '#fff' : 'var(--text-dimmer)',
                  fontSize: '10px',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                October 2026
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonth('11')}
                style={{
                  background: selectedMonth === '11' ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: '1px solid var(--line)',
                  color: selectedMonth === '11' ? '#fff' : 'var(--text-dimmer)',
                  fontSize: '10px',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                November 2026
              </button>
            </div>

            <div style={{ fontSize: '10px', color: 'var(--text-dimmer)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#60a5fa', display: 'inline-block' }} /> AM Session (Morning)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#fbbf24', display: 'inline-block' }} /> PM Session (Afternoon)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#f87171', display: 'inline-block' }} /> Direct Clash
              </span>
            </div>
          </div>

          {/* Calendar Months Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: selectedMonth === 'both' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
              gap: '16px',
            }}
          >
            {/* October 2026 Calendar (Starts Thursday Oct 1, 31 days) */}
            {(selectedMonth === 'both' || selectedMonth === '10') && (
              <MonthGrid
                year={2026}
                month={10}
                monthName="OCTOBER 2026"
                firstDayOffset={4} // Thursday = index 4 (Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6)
                daysInMonth={31}
                timetable={timetable}
                selectedDay={selectedDay}
                onSelectDay={(d) => setSelectedDay(d)}
              />
            )}

            {/* November 2026 Calendar (Starts Sunday Nov 1, 30 days) */}
            {(selectedMonth === 'both' || selectedMonth === '11') && (
              <MonthGrid
                year={2026}
                month={11}
                monthName="NOVEMBER 2026"
                firstDayOffset={0} // Sunday = index 0
                daysInMonth={30}
                timetable={timetable}
                selectedDay={selectedDay}
                onSelectDay={(d) => setSelectedDay(d)}
              />
            )}
          </div>

          {/* Selected Day Inspector Panel */}
          {activeDaySchedule && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--line)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarCheck size={16} color="#60a5fa" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                    {activeDaySchedule.dayOfWeek.toUpperCase()}, {activeDaySchedule.date}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    ({activeDaySchedule.papers.length} {activeDaySchedule.papers.length === 1 ? 'Paper' : 'Papers'} • Total duration: {Math.floor(activeDaySchedule.totalDurationMinutes / 60)}h {activeDaySchedule.totalDurationMinutes % 60}m)
                  </span>
                </div>

                {activeDaySchedule.hasDirectClash && (
                  <span
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #f87171',
                      color: '#f87171',
                      fontSize: '10px',
                      padding: '2px 6px',
                      fontWeight: 700,
                    }}
                  >
                    ⚠️ DIRECT SESSION CLASH
                  </span>
                )}
                {activeDaySchedule.isSameDayDouble && !activeDaySchedule.hasDirectClash && (
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid #fbbf24',
                      color: '#fbbf24',
                      fontSize: '10px',
                      padding: '2px 6px',
                      fontWeight: 700,
                    }}
                  >
                    ⚡ DOUBLE EXAM DAY (AM + PM)
                  </span>
                )}
              </div>

              {/* Papers Breakdown list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeDaySchedule.papers.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: p.session === 'AM' ? 'rgba(96, 165, 250, 0.08)' : 'rgba(251, 191, 36, 0.08)',
                      border: '1px solid',
                      borderColor: p.session === 'AM' ? 'rgba(96, 165, 250, 0.3)' : 'rgba(251, 191, 36, 0.3)',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          background: p.session === 'AM' ? '#60a5fa' : '#fbbf24',
                          color: '#000',
                          fontWeight: 700,
                          padding: '2px 6px',
                        }}
                      >
                        {p.session}
                      </span>
                      <div>
                        <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>
                          <strong style={{ color: '#60a5fa' }}>[{p.paperCode}]</strong> {p.subjectName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {p.paperName} • <span style={{ color: '#a3e635' }}>{p.category}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#fff' }}>
                          <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                          {p.timeSlot}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dimmer)' }}>
                          Duration: {p.durationLabel}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CHRONOLOGICAL SPACING TIMELINE */}
      {viewMode === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            Chronological step-by-step examination roadmap with inter-paper revision spacing:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
            {timetable.days.map((daySchedule, idx) => {
              // Calculate gap from previous day
              let gapDays = 0;
              if (idx > 0) {
                const prevDate = new Date(timetable.days[idx - 1].date).getTime();
                const currDate = new Date(daySchedule.date).getTime();
                gapDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
              }

              return (
                <div key={daySchedule.date} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Spacing Gap Callout */}
                  {idx > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 10px',
                        fontSize: '10px',
                        color: gapDays >= 4 ? '#a3e635' : gapDays === 1 ? '#f87171' : '#fbbf24',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderLeft: '2px dashed',
                        borderColor: gapDays >= 4 ? '#a3e635' : gapDays === 1 ? '#f87171' : '#fbbf24',
                        margin: '2px 0 2px 14px',
                      }}
                    >
                      <span>
                        {gapDays === 1 ? (
                          <>⚡ Back-to-back day! 1 day preparation gap</>
                        ) : (
                          <>☕ {gapDays} days revision & resting window before next paper</>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Day Entry Card */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid',
                      borderColor: daySchedule.hasDirectClash
                        ? 'rgba(239, 68, 68, 0.5)'
                        : daySchedule.isSameDayDouble
                        ? 'rgba(245, 158, 11, 0.4)'
                        : 'var(--line)',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            background: '#ffffff',
                            color: '#000000',
                            fontWeight: 700,
                            padding: '1px 6px',
                          }}
                        >
                          DAY {idx + 1}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                          {daySchedule.dayOfWeek}, {daySchedule.date}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {daySchedule.hasDirectClash && (
                          <span style={{ fontSize: '10px', color: '#f87171', background: 'rgba(239,68,68,0.2)', padding: '1px 5px' }}>
                            ⚠️ DIRECT CLASH
                          </span>
                        )}
                        {daySchedule.isSameDayDouble && (
                          <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(245,158,11,0.2)', padding: '1px 5px' }}>
                            ⚡ DOUBLE EXAM
                          </span>
                        )}
                        <span style={{ fontSize: '10px', color: 'var(--text-dimmer)' }}>
                          {daySchedule.papers.length} {daySchedule.papers.length === 1 ? 'Exam' : 'Exams'}
                        </span>
                      </div>
                    </div>

                    {/* Papers on this day */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {daySchedule.papers.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            padding: '8px 10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '9px',
                                padding: '2px 5px',
                                background: p.session === 'AM' ? 'rgba(96,165,250,0.2)' : 'rgba(251,191,36,0.2)',
                                color: p.session === 'AM' ? '#60a5fa' : '#fbbf24',
                                border: '1px solid',
                                borderColor: p.session === 'AM' ? 'rgba(96,165,250,0.4)' : 'rgba(251,191,36,0.4)',
                                fontWeight: 700,
                              }}
                            >
                              {p.session} SESSION
                            </span>
                            <span style={{ fontSize: '12px', color: '#fff' }}>
                              <strong style={{ color: '#60a5fa' }}>[{p.paperCode}]</strong> {p.subjectName} — {p.paperName}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{p.timeSlot}</span>
                            <span style={{ color: 'var(--text-dimmer)' }}>({p.durationLabel})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: CLASH DIAGNOSTICS & SUPERVISION PROTOCOL */}
      {viewMode === 'clashes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Official Cambridge International Examination timetable clash diagnostic and center guidance:
          </div>

          {timetable.clashes.length === 0 ? (
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <CheckCircle2 size={32} color="#4ade80" style={{ margin: '0 auto 8px auto' }} />
              <h5 style={{ color: '#ffffff', fontSize: '14px', marginBottom: '4px' }}>
                Zero Timetable Clashes Detected
              </h5>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '460px', margin: '0 auto' }}>
                All your selected Cambridge examination papers fall on separate dates or balanced morning/afternoon sessions without overlapping examination windows.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {timetable.clashes.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: c.type === 'DIRECT_SESSION_CLASH' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid',
                    borderColor: c.type === 'DIRECT_SESSION_CLASH' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.3)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: c.type === 'DIRECT_SESSION_CLASH' ? '#f87171' : '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={13} /> {c.type === 'DIRECT_SESSION_CLASH' ? 'CRITICAL DIRECT SESSION CLASH' : 'DOUBLE EXAM DAY NOTICE'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600 }}>
                      {c.dayOfWeek}, {c.date} {c.session ? `(${c.session} Session)` : ''}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#ffffff' }}>
                    {c.description}
                  </div>

                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '8px 10px',
                      borderLeft: '2px solid',
                      borderColor: c.type === 'DIRECT_SESSION_CLASH' ? '#f87171' : '#fbbf24',
                      fontSize: '11px',
                      color: 'var(--text-dim)',
                      lineHeight: 1.4,
                    }}
                  >
                    <strong style={{ color: '#ffffff' }}>Resolution Protocol:</strong> {c.resolutionGuidance}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cambridge Regulations Guide */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--line)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--text-dim)',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={13} color="#60a5fa" /> Cambridge International Examination Center Rules for Clashes
            </div>
            <p style={{ margin: 0, lineHeight: 1.4 }}>
              1. <strong>Full Candidate Security:</strong> If you have two papers in the same session, your exam center invigilator will keep you under full supervision between papers so no test content can be accessed.
            </p>
            <p style={{ margin: 0, lineHeight: 1.4 }}>
              2. <strong>Supervised Rest:</strong> Candidates sitting back-to-back papers are entitled to a supervised rest break of up to 30 minutes between sessions.
            </p>
            <p style={{ margin: 0, lineHeight: 1.4 }}>
              3. <strong>Center Confirmation:</strong> Our website administrators and Cambridge center coordinators will automatically register your timetable accommodation upon enrollment verification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Month Calendar Grid
interface MonthGridProps {
  year: number;
  month: number;
  monthName: string;
  firstDayOffset: number; // Day of week index for day 1 (0=Sun, 1=Mon, ..., 6=Sat)
  daysInMonth: number;
  timetable: TimetableSummary;
  selectedDay: string | null;
  onSelectDay: (dateStr: string) => void;
}

function MonthGrid({
  year,
  month,
  monthName,
  firstDayOffset,
  daysInMonth,
  timetable,
  selectedDay,
  onSelectDay,
}: MonthGridProps) {
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Map dates to schedules
  const scheduleMap = useMemo(() => {
    const map = new Map<string, TimetableDaySchedule>();
    for (const d of timetable.days) {
      map.set(d.date, d);
    }
    return map;
  }, [timetable]);

  const cells = [];
  // Empty offset cells
  for (let i = 0; i < firstDayOffset; i++) {
    cells.push(<div key={`empty-${i}`} style={{ background: 'transparent', minHeight: '64px' }} />);
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    const schedule = scheduleMap.get(dateKey);
    const isSelected = selectedDay === dateKey;

    cells.push(
      <div
        key={dateKey}
        onClick={() => {
          if (schedule) {
            onSelectDay(dateKey);
          }
        }}
        style={{
          minHeight: '64px',
          padding: '4px 6px',
          background: isSelected
            ? 'rgba(96, 165, 250, 0.25)'
            : schedule
            ? schedule.hasDirectClash
              ? 'rgba(239, 68, 68, 0.12)'
              : schedule.isSameDayDouble
              ? 'rgba(245, 158, 11, 0.1)'
              : 'rgba(255, 255, 255, 0.04)'
            : 'rgba(255, 255, 255, 0.01)',
          border: '1px solid',
          borderColor: isSelected
            ? '#60a5fa'
            : schedule
            ? schedule.hasDirectClash
              ? 'rgba(239, 68, 68, 0.5)'
              : schedule.isSameDayDouble
              ? 'rgba(245, 158, 11, 0.4)'
              : 'rgba(255, 255, 255, 0.15)'
            : 'rgba(255, 255, 255, 0.04)',
          cursor: schedule ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: schedule ? 700 : 400,
              color: schedule ? '#ffffff' : 'var(--text-dimmer)',
            }}
          >
            {day}
          </span>

          {schedule && (
            <span
              style={{
                fontSize: '9px',
                padding: '1px 3px',
                background: schedule.hasDirectClash
                  ? '#f87171'
                  : schedule.isSameDayDouble
                  ? '#fbbf24'
                  : '#60a5fa',
                color: '#000000',
                fontWeight: 700,
              }}
            >
              {schedule.hasDirectClash ? 'CLASH' : `${schedule.papers.length}P`}
            </span>
          )}
        </div>

        {/* Paper indicators inside cell */}
        {schedule && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '3px' }}>
            {schedule.papers.map((p) => {
              const paperMatch = p.paperName.match(/Paper\s*\d+/i);
              const shortP = paperMatch ? paperMatch[0] : 'P';
              return (
                <div
                  key={p.id}
                  style={{
                    fontSize: '8px',
                    lineHeight: 1.1,
                    padding: '1px 3px',
                    background: p.session === 'AM' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                    color: p.session === 'AM' ? '#93c5fd' : '#fde047',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    borderLeft: '2px solid',
                    borderLeftColor: p.session === 'AM' ? '#60a5fa' : '#fbbf24',
                  }}
                  title={`[${p.paperCode}] ${p.subjectName} - ${p.paperName} (${p.session})`}
                >
                  {p.subjectCode} {shortP}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="mobile-scrollable-calendar"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid var(--line)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: '300px',
        overflowX: 'auto',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.05em' }}>
        {monthName}
      </div>

      {/* Day of Week Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
        {dayNames.map((d) => (
          <div key={d} style={{ fontSize: '9px', color: 'var(--text-dimmer)', fontWeight: 600 }}>
            {d}
          </div>
        ))}
      </div>

      {/* 7-column Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {cells}
      </div>
    </div>
  );
}
