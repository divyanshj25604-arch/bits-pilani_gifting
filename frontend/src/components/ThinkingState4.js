import React, { useState, useEffect } from 'react';
import ThinkingDots from './ThinkingDots';

const LINES = [
  'Pulling together everything you shared...',
  'Finding what makes this gift yours to give...',
  'Almost ready.',
];

export default function ThinkingState4({ onComplete, apiReady }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [timerDone, setTimerDone] = useState(false);
  const [visible, setVisible] = useState(true);
  const [slowWarning, setSlowWarning] = useState(false);
  const [verySlowError, setVerySlowError] = useState(false);

  // Cycle through lines
  useEffect(() => {
    if (lineIndex < 2) {
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setLineIndex(i => i + 1);
          setVisible(true);
        }, 200);
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [lineIndex]);

  // 5 second minimum
  useEffect(() => {
    const t = setTimeout(() => setTimerDone(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // 30s slow warning
  useEffect(() => {
    const t = setTimeout(() => setSlowWarning(true), 30000);
    return () => clearTimeout(t);
  }, []);

  // 60s error
  useEffect(() => {
    const t = setTimeout(() => setVerySlowError(true), 60000);
    return () => clearTimeout(t);
  }, []);

  // Proceed when both ready
  useEffect(() => {
    if (timerDone && apiReady) {
      const t = setTimeout(() => onComplete(), 300);
      return () => clearTimeout(t);
    }
  }, [timerDone, apiReady, onComplete]);

  if (verySlowError) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <p className="font-georgia" style={{ fontSize: 16, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 24 }}>
          Something went wrong. Let's try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 50,
            padding: '12px 32px',
            fontSize: 14,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 0 16px' }}>
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease',
          minHeight: 60,
        }}
      >
        <p
          className="font-georgia"
          style={{
            fontSize: 18,
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          {LINES[lineIndex]}
        </p>
      </div>
      <ThinkingDots />
      {slowWarning && !verySlowError && (
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Arial', lineHeight: 1.5 }}>
          This is taking a little longer than usual. Still working...
        </p>
      )}
    </div>
  );
}
