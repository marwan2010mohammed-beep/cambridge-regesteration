import React from 'react';

interface UiverseNavTabsProps {
  selectedCount: number;
  enrollmentsCount: number;
  activeModal: string | null;
  onSelectTab: (modal: 'story' | 'papers' | 'timetable' | 'identity' | 'admin') => void;
  orientation?: 'horizontal' | 'vertical';
  timetableSummary?: {
    directClashesCount?: number;
    totalScheduledPapers?: number;
    totalPapers?: number;
  };
}

export const UiverseNavTabs: React.FC<UiverseNavTabsProps> = ({
  selectedCount,
  enrollmentsCount,
  activeModal,
  onSelectTab,
  orientation = 'horizontal',
  timetableSummary,
}) => {
  // Determine which tab index is active
  const activeTabName = activeModal === 'story'
    ? 'story'
    : activeModal === 'papers'
    ? 'papers'
    : activeModal === 'timetable'
    ? 'timetable'
    : activeModal === 'identity'
    ? 'identity'
    : activeModal === 'admin'
    ? 'admin'
    : 'none';

  return (
    <div
      className={`uiverse-tabs-container ${
        orientation === 'vertical' ? 'uiverse-tabs-container--vertical' : 'uiverse-tabs-container--horizontal'
      }`}
    >
      <div className={`tabs ${orientation === 'vertical' ? 'tabs--vertical' : 'tabs--horizontal'}`}>
        {/* Hidden radio inputs */}
        <input
          type="radio"
          id="tab-radio-1"
          name={`nav-tabs-${orientation}`}
          checked={activeTabName === 'story'}
          onChange={() => onSelectTab('story')}
        />
        <label
          htmlFor="tab-radio-1"
          className="tab"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('story');
          }}
          title="Cambridge International Story & Session Overview"
        >
          <span>Story</span>
        </label>

        <input
          type="radio"
          id="tab-radio-2"
          name={`nav-tabs-${orientation}`}
          checked={activeTabName === 'papers'}
          onChange={() => onSelectTab('papers')}
        />
        <label
          htmlFor="tab-radio-2"
          className="tab"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('papers');
          }}
          title="Search & select Cambridge examination subjects and components"
        >
          <span>Papers</span>
          <span className="notification" title={`${selectedCount} subjects enrolled`}>
            {selectedCount}
          </span>
        </label>

        <input
          type="radio"
          id="tab-radio-3"
          name={`nav-tabs-${orientation}`}
          checked={activeTabName === 'timetable'}
          onChange={() => onSelectTab('timetable')}
        />
        <label
          htmlFor="tab-radio-3"
          className="tab"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('timetable');
          }}
          title="Cambridge Oct/Nov 2026 Examination Schedule & Direct Clash Monitor"
        >
          <span>Timetable</span>
          {timetableSummary && (timetableSummary.directClashesCount ?? 0) > 0 ? (
            <span
              className="notification notification--clash"
              title={`${timetableSummary.directClashesCount} Direct Examination Clashes!`}
            >
              !
            </span>
          ) : timetableSummary && ((timetableSummary.totalScheduledPapers ?? timetableSummary.totalPapers ?? 0) > 0) ? (
            <span
              className="notification notification--subtle"
              title={`${timetableSummary.totalScheduledPapers ?? timetableSummary.totalPapers} component papers scheduled`}
            >
              {timetableSummary.totalScheduledPapers ?? timetableSummary.totalPapers}
            </span>
          ) : null}
        </label>

        <input
          type="radio"
          id="tab-radio-4"
          name={`nav-tabs-${orientation}`}
          checked={activeTabName === 'identity'}
          onChange={() => onSelectTab('identity')}
        />
        <label
          htmlFor="tab-radio-4"
          className="tab"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('identity');
          }}
          title="Cambridge Candidate Identity & Center Security Standards"
        >
          <span>Identity</span>
        </label>

        <input
          type="radio"
          id="tab-radio-5"
          name={`nav-tabs-${orientation}`}
          checked={activeTabName === 'admin'}
          onChange={() => onSelectTab('admin')}
        />
        <label
          htmlFor="tab-radio-5"
          className="tab"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('admin');
          }}
          title="Administrator Candidate Registry Log (Owner PIN Protected)"
        >
          <span>Admin Log</span>
          <span className="notification" title={`${enrollmentsCount} candidate submissions`}>
            {enrollmentsCount}
          </span>
        </label>

        {/* Sliding Glider Background Indicator */}
        <div
          className={`glider ${
            activeTabName === 'story'
              ? 'glider--pos-1'
              : activeTabName === 'papers'
              ? 'glider--pos-2'
              : activeTabName === 'timetable'
              ? 'glider--pos-3'
              : activeTabName === 'identity'
              ? 'glider--pos-4'
              : activeTabName === 'admin'
              ? 'glider--pos-5'
              : 'glider--pos-none'
          }`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};
