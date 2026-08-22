import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  onOpenSchedule?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
}

// Cambridge IGCSE Oct/Nov 2026 Exam Series commences October 1, 2026 09:00:00 UTC
const TARGET_EXAM_DATE = new Date('2026-10-01T09:00:00Z').getTime();

export function CountdownTimer({ onOpenSchedule }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() => calculateTimeLeft());

  function calculateTimeLeft(): TimeRemaining {
    const now = new Date().getTime();
    const difference = TARGET_EXAM_DATE - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isLive: false };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatUnit = (val: number) => String(val).padStart(2, '0');

  return (
    <div
      className="session-timer"
      id="cambridge-countdown-timer"
      onClick={onOpenSchedule}
      role="region"
      aria-label="Cambridge IGCSE Oct/Nov Examination countdown timer"
      title="Click to view full Oct/Nov 2026 exam key dates schedule"
    >
      <div className="session-timer__header">
        <div className="session-timer__badge">
          <span className="session-timer__dot" aria-hidden="true" />
          <span>[ SESSION T-MINUS ]</span>
        </div>
        <span className="session-timer__target-label">OCT 01, 2026 • 09:00 UTC</span>
      </div>

      <div className="session-timer__grid">
        <div className="session-timer__unit">
          <span className="session-timer__value">{formatUnit(timeLeft.days)}</span>
          <span className="session-timer__label">DAYS</span>
        </div>
        <div className="session-timer__divider" aria-hidden="true">:</div>
        <div className="session-timer__unit">
          <span className="session-timer__value">{formatUnit(timeLeft.hours)}</span>
          <span className="session-timer__label">HRS</span>
        </div>
        <div className="session-timer__divider" aria-hidden="true">:</div>
        <div className="session-timer__unit">
          <span className="session-timer__value">{formatUnit(timeLeft.minutes)}</span>
          <span className="session-timer__label">MIN</span>
        </div>
        <div className="session-timer__divider" aria-hidden="true">:</div>
        <div className="session-timer__unit">
          <span className="session-timer__value">{formatUnit(timeLeft.seconds)}</span>
          <span className="session-timer__label">SEC</span>
        </div>
      </div>
    </div>
  );
}
