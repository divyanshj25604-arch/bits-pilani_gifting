import React from 'react';

export default function ThinkingDots() {
  return (
    <div
      aria-label="Thoughtly is processing"
      aria-live="polite"
      style={{
        display: 'flex',
        gap: 6,
        marginTop: 14,
        alignItems: 'center',
      }}
    >
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--dot-pulse)',
            display: 'block',
            animation: `dotPulse 1.2s ease-in-out ${i * 0.4}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
