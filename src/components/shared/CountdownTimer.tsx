'use client';

import { useState, useEffect } from 'react';
import { getTimeRemaining } from '@/lib/utils';

interface CountdownTimerProps {
  endDate: string | null;
  label: string;
  size?: 'sm' | 'lg';
}

export default function CountdownTimer({ endDate, label, size = 'lg' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="text-center">
        <p className="text-dark-400 uppercase tracking-widest text-xs mb-2">{label}</p>
        <div className="glass-card inline-block px-6 py-3">
          <p className="text-red-400 font-semibold text-sm">⏰ Time has ended</p>
        </div>
      </div>
    );
  }

  const isSmall = size === 'sm';

  return (
    <div className="text-center">
      <p className="text-dark-400 uppercase tracking-widest text-xs mb-3">{label}</p>
      <div className="flex items-center justify-center gap-2 md:gap-3">
        {[
          { value: timeLeft.days, label: 'Days' },
          { value: timeLeft.hours, label: 'Hours' },
          { value: timeLeft.minutes, label: 'Mins' },
          { value: timeLeft.seconds, label: 'Secs' },
        ].map((unit) => (
          <div key={unit.label} className="countdown-unit" style={isSmall ? { padding: '0.5rem', minWidth: '3.5rem' } : {}}>
            <div className="countdown-number" style={isSmall ? { fontSize: '1.5rem' } : {}}>
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className="countdown-label">{unit.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
