import React from 'react';
import ThinkingDots from './ThinkingDots';

export default function ThinkingState({ text, visible = true }) {
  if (!visible) return null;

  return (
    <div
      style={{
        animation: 'fadeIn 0.3s ease both',
        padding: '24px 0 8px',
      }}
    >
      <p
        className="font-georgia"
        style={{
          fontSize: 16,
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
      <ThinkingDots />
    </div>
  );
}
