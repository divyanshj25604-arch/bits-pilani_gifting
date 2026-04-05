import React from 'react';

export default function SendIcon({ onClick, visible = true, style = {} }) {
  return (
    <button
      onClick={onClick}
      aria-label="Submit"
      tabIndex={visible ? 0 : -1}
      style={{
        background: 'none',
        border: 'none',
        cursor: visible ? 'pointer' : 'default',
        padding: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.15s ease',
        pointerEvents: visible ? 'auto' : 'none',
        flexShrink: 0,
        minWidth: 44,
        minHeight: 44,
        ...style,
      }}
    >
      <svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1={22} y1={2} x2={11} y2={13} />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    </button>
  );
}
