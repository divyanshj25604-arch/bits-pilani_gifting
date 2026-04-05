import React from 'react';

export default function ConversationMessage({ text, receding = false, style = {} }) {
  return (
    <p
      className="font-georgia"
      style={{
        fontSize: receding ? 15 : 17,
        lineHeight: 1.6,
        color: receding ? 'var(--text-muted)' : 'var(--text-primary)',
        opacity: receding ? 0.5 : 1,
        transition: 'opacity 0.4s ease, font-size 0.4s ease',
        marginBottom: 4,
        animation: receding ? 'none' : 'fadeIn 0.25s ease both',
        ...style,
      }}
    >
      {text}
    </p>
  );
}
