import React, { useState } from 'react';
import { CandidateEnrollment, ExamSubject } from '../types';
import {
  downloadExport,
  generateExportSummary,
  type ExportFormat,
  type BulkExportOptions,
} from '../utils/bulkExportGenerator';
import { UiverseButton } from './UiverseButton';
import {
  Download,
  FileJson,
  FileText,
  Table2,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';

interface BulkExportModalProps {
  enrollments: CandidateEnrollment[];
  onClose: () => void;
  subjects?: ExamSubject[];
}

export function BulkExportModal({
  enrollments,
  onClose,
  subjects,
}: BulkExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'sent'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const exportSummary = generateExportSummary(enrollments);

  const handleExport = () => {
    setIsExporting(true);
    const options: BulkExportOptions = {
      format: selectedFormat,
      filterStatus,
      includeStatus: true,
      includeTimestamp: true,
    };

    setTimeout(() => {
      downloadExport(enrollments, options);
      setIsExporting(false);
    }, 300);
  };

  const getFilteredCount = () => {
    switch (filterStatus) {
      case 'verified':
        return exportSummary.verified;
      case 'sent':
        return exportSummary.dmSent;
      case 'pending':
        return exportSummary.pending;
      default:
        return exportSummary.totalCandidates;
    }
  };

  const formatDescriptions: Record<ExportFormat, { label: string; description: string; icon: React.ReactNode }> = {
    csv: {
      label: 'CSV (Spreadsheet)',
      description: 'Standard comma-separated values for Excel, Google Sheets, or Cambridge entry systems',
      icon: <Table2 size={18} />,
    },
    json: {
      label: 'JSON (Structured)',
      description: 'Structured JSON format with Cambridge metadata for system integration',
      icon: <FileJson size={18} />,
    },
    xlsx: {
      label: 'XLSX (Excel)',
      description: 'Tab-separated values compatible with Microsoft Excel and Office applications',
      icon: <FileText size={18} />,
    },
    'cambridge-standard': {
      label: 'Cambridge Standard (Text)',
      description: 'Official Cambridge formatted manifest document for entry submission',
      icon: <FileText size={18} />,
    },
  };

  return (
    <div
      className="terminal-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      onClick={onClose}
    >
      <div
        className="terminal-modal terminal-modal--wide"
        onClick={(e) => e.stopPropagation()}
        style={{
          fontFamily: 'var(--font-mono)',
          maxWidth: '760px',
          width: '95%',
        }}
      >
        {/* Header */}
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
            <Download size={18} color="#60a5fa" />
            <span
              id="export-dialog-title"
              style={{
                fontSize: '12px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#ffffff',
                fontWeight: 600,
              }}
            >
              [ BULK EXPORT • CAMBRIDGE ENTRY SUBMISSION ]
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--line)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '8px 12px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
            }}
            aria-label="Close export dialog"
          >
            [X]
          </button>
        </div>

        {/* Summary Statistics */}
        <div
          style={{
            background: 'rgba(96, 165, 250, 0.1)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
            fontSize: '11px',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>TOTAL CANDIDATES:</div>
            <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: '14px' }}>
              {exportSummary.totalCandidates}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>VERIFIED:</div>
            <div style={{ color: '#4ade80', fontWeight: 600, fontSize: '14px' }}>
              {exportSummary.verified}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>DM SENT:</div>
            <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: '14px' }}>
              {exportSummary.dmSent}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>PENDING:</div>
            <div style={{ color: '#fde047', fontWeight: 600, fontSize: '14px' }}>
              {exportSummary.pending}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>SUBJECTS ENROLLED:</div>
            <div style={{ color: '#a3e635', fontWeight: 600, fontSize: '14px' }}>
              {exportSummary.totalSubjectsEnrolled}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>UNIQUE SUBJECTS:</div>
            <div style={{ color: '#818cf8', fontWeight: 600, fontSize: '14px' }}>
              {exportSummary.uniqueSubjects}
            </div>
          </div>
        </div>

        {/* Export Format Selection */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: '8px',
            }}
          >
            SELECT EXPORT FORMAT:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(Object.keys(formatDescriptions) as ExportFormat[]).map((fmt) => {
              const desc = formatDescriptions[fmt];
              const isSelected = selectedFormat === fmt;
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  style={{
                    background: isSelected ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isSelected ? 'rgba(96, 165, 250, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#ffffff',
                    padding: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ color: isSelected ? '#60a5fa' : 'var(--text-dim)' }}>
                    {desc.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>
                      {desc.label}
                      {isSelected && (
                        <span style={{ marginLeft: '8px', color: '#4ade80' }}>
                          <CheckCircle2 size={12} style={{ display: 'inline' }} /> SELECTED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      {desc.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Selection */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: '8px',
            }}
          >
            FILTER BY VERIFICATION STATUS:
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['all', 'verified', 'sent', 'pending'] as const).map((status) => {
              const labels: Record<typeof status, string> = {
                all: `All Candidates (${exportSummary.totalCandidates})`,
                verified: `Verified (${exportSummary.verified})`,
                sent: `DM Sent (${exportSummary.dmSent})`,
                pending: `Pending (${exportSummary.pending})`,
              };

              const isSelected = filterStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  style={{
                    background: isSelected ? 'rgba(163, 230, 53, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isSelected ? 'rgba(163, 230, 53, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: isSelected ? '#a3e635' : 'var(--text-dim)',
                    padding: '6px 12px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isSelected && <CheckCircle2 size={11} style={{ display: 'inline', marginRight: '4px' }} />}
                  {labels[status]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div
          style={{
            background: 'rgba(88, 101, 242, 0.1)',
            border: '1px solid rgba(88, 101, 242, 0.3)',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '11px',
            color: 'var(--text-dim)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: '#60a5fa' }}>Export Details:</strong> The selected format will include candidate IDs, names, emails, Discord handles, center numbers, enrolled subjects, paper components, registration dates, and verification status. All data is formatted according to Cambridge International entry submission standards.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--text-dim)',
              padding: '8px 16px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <X size={13} />
            CANCEL
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            style={{
              background: '#60a5fa',
              border: 'none',
              color: '#ffffff',
              padding: '8px 20px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              cursor: isExporting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
          >
            <Download size={13} />
            {isExporting ? 'EXPORTING...' : `EXPORT ${getFilteredCount()} CANDIDATES`}
          </button>
        </div>
      </div>
    </div>
  );
}
