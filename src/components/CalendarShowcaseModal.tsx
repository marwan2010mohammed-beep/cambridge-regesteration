import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { addDays, format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar as CalendarIcon, Clock, Globe, Sparkles, X, Check, ArrowRight, BookOpen, Layers } from 'lucide-react';

interface CalendarShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalendarShowcaseModal({ isOpen, onClose }: CalendarShowcaseModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'range' | 'dropdown' | 'presets' | 'time' | 'booked' | 'cells' | 'weeks' | 'rtl' | 'timezone'>('basic');

  // State for each calendar demo
  const [dateSingle, setDateSingle] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [dateDropdown, setDateDropdown] = useState<Date | undefined>(new Date());
  const [datePreset, setDatePreset] = useState<Date | undefined>(new Date());
  const [dateWithTime, setDateWithTime] = useState<Date | undefined>(new Date());
  const [timeValue, setTimeValue] = useState('10:00');
  const [dateBooked, setDateBooked] = useState<Date | undefined>(new Date());
  const [dateCellSize, setDateCellSize] = useState<Date | undefined>(new Date());
  const [dateWeeks, setDateWeeks] = useState<Date | undefined>(new Date());
  const [dateRtl, setDateRtl] = useState<Date | undefined>(new Date());
  const [isRtl, setIsRtl] = useState(false);
  const [dateTz, setDateTz] = useState<Date | undefined>(new Date());
  const [timeZone, setTimeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Booked exam dates (disabled or highlighted)
  const bookedDates = [
    addDays(new Date(), 2),
    addDays(new Date(), 5),
    addDays(new Date(), 12),
    addDays(new Date(), 15),
  ];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '90vh',
          backgroundColor: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <CalendarIcon size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                shadcn/ui Calendar Component & Layouts
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                A powerful calendar component built on React DayPicker supporting single, range, dropdowns, and timezones.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#cbd5e1',
              transition: 'all 0.2s',
            }}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body with Sidebar and Content */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Sidebar Navigation */}
          <div
            style={{
              width: '260px',
              borderRight: '1px solid #1e293b',
              padding: '16px',
              overflowY: 'auto',
              backgroundColor: '#090d16',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', padding: '8px 12px', letterSpacing: '0.05em' }}>
              Calendar Layouts & Variants
            </div>

            {[
              { id: 'basic', label: 'Basic Calendar', icon: CalendarIcon },
              { id: 'range', label: 'Range Calendar', icon: Layers },
              { id: 'dropdown', label: 'Month & Year Selector', icon: Sparkles },
              { id: 'presets', label: 'Presets', icon: Clock },
              { id: 'time', label: 'Date & Time Picker', icon: Clock },
              { id: 'booked', label: 'Booked / Disabled Dates', icon: BookOpen },
              { id: 'cells', label: 'Custom Cell Size', icon: Sparkles },
              { id: 'weeks', label: 'Week Numbers', icon: CalendarIcon },
              { id: 'rtl', label: 'RTL Support', icon: Globe },
              { id: 'timezone', label: 'TimeZone Integration', icon: Globe },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: isActive ? '#60a5fa' : '#94a3b8',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} color={isActive ? '#60a5fa' : '#64748b'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Preview Area */}
          <div
            style={{
              flex: 1,
              padding: '28px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              backgroundColor: '#0f172a',
            }}
          >
            {/* TAB 1: BASIC */}
            {activeTab === 'basic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>Basic Calendar</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    A basic single date picker calendar component styled with clean borders and subtle accent states.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <Calendar
                      mode="single"
                      selected={dateSingle}
                      onSelect={setDateSingle}
                      className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '240px', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', margin: '0 0 12px 0' }}>Selected Date State</h4>
                    <p style={{ fontSize: '14px', color: '#f8fafc', margin: '0 0 16px 0', fontFamily: 'monospace' }}>
                      {dateSingle ? format(dateSingle, 'PPP') : 'No date selected'}
                    </p>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
                      Usage code:
                      <pre style={{ background: '#090d16', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#38bdf8', marginTop: '6px', overflowX: 'auto' }}>
                        {`const [date, setDate] = React.useState<Date | undefined>(new Date())

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-lg border"
/>`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RANGE */}
            {activeTab === 'range' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>Range Calendar</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    Use the <code style={{ color: '#38bdf8' }}>mode="range"</code> prop to enable range selection.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={1}
                      className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '240px', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', margin: '0 0 12px 0' }}>Selected Date Range</h4>
                    <p style={{ fontSize: '14px', color: '#f8fafc', margin: '0 0 16px 0', fontFamily: 'monospace' }}>
                      {dateRange?.from ? format(dateRange.from, 'PP') : 'Start'} {' → '}
                      {dateRange?.to ? format(dateRange.to, 'PP') : 'End'}
                    </p>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
                      Usage code:
                      <pre style={{ background: '#090d16', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#38bdf8', marginTop: '6px', overflowX: 'auto' }}>
                        {`<Calendar
  mode="range"
  selected={range}
  onSelect={setRange}
  numberOfMonths={1}
  className="rounded-lg border"
/>`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DROPDOWN */}
            {activeTab === 'dropdown' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>Month and Year Selector</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    Use <code style={{ color: '#38bdf8' }}>captionLayout="dropdown"</code> to show month and year dropdowns.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <Calendar
                      mode="single"
                      selected={dateDropdown}
                      onSelect={setDateDropdown}
                      captionLayout="dropdown"
                      startMonth={new Date(2020, 0)}
                      endMonth={new Date(2030, 11)}
                      className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '240px', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', margin: '0 0 12px 0' }}>Caption Layout Dropdown</h4>
                    <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '16px' }}>
                      Allows users to quickly jump across distant months and years without clicking the navigation arrows multiple times.
                    </p>
                    <pre style={{ background: '#090d16', padding: '10px', borderRadius: '8px', fontSize: '11px', color: '#38bdf8', overflowX: 'auto' }}>
                      {`<Calendar
  mode="single"
  captionLayout="dropdown"
  startMonth={new Date(2020, 0)}
  endMonth={new Date(2030, 11)}
/>`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PRESETS */}
            {activeTab === 'presets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>Calendar Presets</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    Combine the calendar with preset quick selection buttons.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Button variant="outline" onClick={() => setDatePreset(new Date())} className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">Today</Button>
                      <Button variant="outline" onClick={() => setDatePreset(addDays(new Date(), 1))} className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">Tomorrow</Button>
                      <Button variant="outline" onClick={() => setDatePreset(addDays(new Date(), 7))} className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700">In 7 Days</Button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={datePreset}
                      onSelect={setDatePreset}
                      className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '240px', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', margin: '0 0 12px 0' }}>Quick Preset Selection</h4>
                    <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                      Selected Date: <strong style={{ color: '#fff' }}>{datePreset ? format(datePreset, 'PPP') : 'None'}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: TIME */}
            {activeTab === 'time' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>Date and Time Picker</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    Pairing calendar date selection with time inputs for precise scheduling.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Calendar
                      mode="single"
                      selected={dateWithTime}
                      onSelect={setDateWithTime}
                      className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#090d16', padding: '10px 14px', borderRadius: '10px', border: '1px solid #334155' }}>
                      <Clock size={16} color="#60a5fa" />
                      <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Select Time:</span>
                      <input
                        type="time"
                        value={timeValue}
                        onChange={(e) => setTimeValue(e.target.value)}
                        style={{ background: '#1e293b', color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '4px 8px', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '240px', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', margin: '0 0 12px 0' }}>Selected Slot</h4>
                    <p style={{ fontSize: '14px', color: '#f8fafc', margin: '0 0 16px 0', fontFamily: 'monospace' }}>
                      {dateWithTime ? format(dateWithTime, 'PPP') : 'No date'} at {timeValue}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: BOOKED DATES */}
            {activeTab === 'booked' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>Booked / Disabled Dates</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    Disable specific booked dates or exam windows using the <code style={{ color: '#38bdf8' }}>disabled</code> prop.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <Calendar
                      mode="single"
                      selected={dateBooked}
                      onSelect={setDateBooked}
                      disabled={bookedDates}
                      className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '240px', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', margin: '0 0 12px 0' }}>Booked Dates Disabled</h4>
                    <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                      Dates marked as booked or exam blackout periods are automatically disabled and unselectable.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: CELL SIZE */}
            {activeTab === 'cells' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>Custom Cell Size</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    Customize cell size using the <code style={{ color: '#38bdf8' }}>[--cell-size:...]</code> CSS variable.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <Calendar
                      mode="single"
                      selected={dateCellSize}
                      onSelect={setDateCellSize}
                      className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-sm [--cell-size:3rem] md:[--cell-size:3.25rem]"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '240px', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', margin: '0 0 12px 0' }}><code style={{ color: '#38bdf8' }}>[--cell-size:3rem]</code></h4>
                    <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                      Makes touch targets larger and more spacious on mobile or tablet displays.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: WEEK NUMBERS */}
            {activeTab === 'weeks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>Week Numbers</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    Use <code style={{ color: '#38bdf8' }}>showWeekNumber</code> to display week numbers along the side.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <Calendar
                      mode="single"
                      selected={dateWeeks}
                      onSelect={setDateWeeks}
                      showWeekNumber
                      className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '240px', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', margin: '0 0 12px 0' }}>ISO Week Numbers</h4>
                    <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                      Essential for scheduling academic terms, quarterly planning, and institutional calendars.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 9: RTL */}
            {activeTab === 'rtl' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>RTL Support</h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                      Supports Right-to-Left languages like Arabic and Persian with logical properties (<code style={{ color: '#38bdf8' }}>dir="rtl"</code>).
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsRtl(!isRtl)}
                    className="border-slate-700 bg-slate-800 text-white"
                  >
                    Toggle RTL: {isRtl ? 'ON' : 'OFF'}
                  </Button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #334155' }} dir={isRtl ? 'rtl' : 'ltr'}>
                    <Calendar
                      mode="single"
                      selected={dateRtl}
                      onSelect={setDateRtl}
                      dir={isRtl ? 'rtl' : 'ltr'}
                      className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '240px', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', margin: '0 0 12px 0' }}>RTL Logical Border Radii</h4>
                    <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                      Uses logical CSS classes like <code style={{ color: '#38bdf8' }}>rounded-s-*</code> and <code style={{ color: '#38bdf8' }}>rounded-e-*</code> for seamless direction switching.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 10: TIMEZONE */}
            {activeTab === 'timezone' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>TimeZone Integration</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    Ensures dates are correctly rendered and selected according to the user's local timezone.
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <Calendar
                      mode="single"
                      selected={dateTz}
                      onSelect={setDateTz}
                      timeZone={timeZone}
                      className="rounded-lg border border-slate-700 bg-slate-900 text-slate-100 shadow-sm"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '240px', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa', margin: 0 }}>Detected TimeZone</h4>
                    <p style={{ fontSize: '13px', color: '#f8fafc', margin: 0, fontFamily: 'monospace', background: '#090d16', padding: '8px 12px', borderRadius: '6px' }}>
                      {timeZone}
                    </p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                      Detected client-side using <code style={{ color: '#38bdf8' }}>Intl.DateTimeFormat().resolvedOptions().timeZone</code> inside a useEffect hook to prevent hydration mismatches.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#090d16',
          }}
        >
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Powered by React DayPicker & date-fns • shadcn/ui Nova Style
          </div>
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
            Done
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
