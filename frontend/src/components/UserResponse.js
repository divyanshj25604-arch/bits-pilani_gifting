import React from 'react';

export default function UserResponse({ text }) {
  return (
    <p
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: 15,
        lineHeight: 1.6,
        color: 'var(--text-muted)',
        opacity: 0.5,
        marginTop: 8,
        marginBottom: 4,
        fontStyle: 'normal',
      }}
    >
      {text}
    </p>
  );
}
