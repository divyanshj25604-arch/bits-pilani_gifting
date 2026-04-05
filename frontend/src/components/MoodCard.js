import React from 'react';

export default function MoodCard({ label, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      style={{
        background: selected ? 'var(--card-selected-bg)' : 'var(--card-bg)',
        color: selected ? 'var(--card-selected-text)' : 'var(--text-primary)',
        border: `1px solid ${selected ? 'transparent' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '20px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 15,
        lineHeight: 1.5,
        transition: 'background 0.1s ease, color 0.1s ease',
        width: '100%',
        minHeight: 70,
        minWidth: 44,
        outline: 'none',
      }}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
