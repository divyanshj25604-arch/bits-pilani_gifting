import React from 'react';

export default function Wordmark({ variant = 'large' }) {
  if (variant === 'watermark') {
    return (
      <div
        className="font-georgia"
        style={{
          position: 'fixed',
          top: 16,
          left: 20,
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.03em',
          opacity: 0.7,
          zIndex: 50,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        Thoughtly
      </div>
    );
  }

  return (
    <div
      className="font-georgia"
      style={{
        fontSize: 'clamp(38px, 10vw, 52px)',
        fontWeight: 700,
        color: 'var(--wordmark-color)',
        letterSpacing: '0.05em',
        userSelect: 'none',
        lineHeight: 1.1,
      }}
    >
      Thoughtly
    </div>
  );
}
