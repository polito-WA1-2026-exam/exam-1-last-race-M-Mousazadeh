import React from 'react';

/**
 * Countdown displays the seconds remaining during the planning phase.
 * It changes colors depending on time pressure:
 * - >= 30 seconds: green / normal text
 * - < 30 seconds and >= 10 seconds: amber (warning)
 * - < 10 seconds: red (danger)
 * 
 * Props:
 * - seconds: Number (remaining seconds)
 */
export default function Countdown({ seconds }) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine styling based on remaining time
  let color = '#2e7d32'; // Green
  let label = 'Planning Phase';
  let pulseClass = '';

  if (seconds < 10) {
    color = '#c62828'; // Red
    label = 'TIME CRITICAL!';
    pulseClass = 'text-pulse'; // custom animation to draw attention
  } else if (seconds < 30) {
    color = '#f57f17'; // Amber/Orange
    label = 'Time running out';
  }

  return (
    <div
      className="d-flex align-items-center gap-3 px-3 py-2 border rounded bg-white shadow-sm"
      style={{ minWidth: '220px' }}
    >
      <div
        className="fw-bold font-monospace fs-3 px-2 py-1 rounded text-white"
        style={{
          backgroundColor: color,
          minWidth: '70px',
          textAlign: 'center',
          transition: 'background-color 0.5s ease',
        }}
      >
        <span className={pulseClass}>{formatTime(seconds)}</span>
      </div>
      <div>
        <div className="small text-muted uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
          {label}
        </div>
        <div className="text-secondary small">remaining of 1:30</div>
      </div>
    </div>
  );
}
