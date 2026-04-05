import React, { useState, useRef, useEffect } from 'react';
import Wordmark from './Wordmark';

export default function PreConversation({ onBegin }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const hasContent = value.trim().length > 0;

  useEffect(() => {
    // Auto-focus on mount
    if (inputRef.current) inputRef.current.focus();
  }, []);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onBegin(trimmed);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && hasContent) handleSubmit();
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
        background: 'var(--bg)',
        position: 'relative',
      }}
    >
      {/* Content block — centered slightly above middle */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          marginTop: '-8vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.5s ease both',
        }}
      >
        {/* Wordmark */}
        <div style={{ marginBottom: 28 }}>
          <Wordmark variant="large" />
        </div>

        {/* Opening statement */}
        <p
          className="font-georgia"
          style={{
            fontSize: 18,
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          Tell me who you're gifting for.
        </p>

        {/* Input */}
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="A name, or just who they are to you."
            style={{
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: 16,
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--input-underline)',
              outline: 'none',
              width: '100%',
              padding: '10px 0',
              lineHeight: 1.6,
            }}
          />
        </div>
      </div>

      {/* CTA button — rises from bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '0 24px 40px',
          pointerEvents: hasContent ? 'auto' : 'none',
          animation: hasContent ? 'buttonRise 0.2s ease both' : 'none',
          opacity: hasContent ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      >
        <button
          onClick={handleSubmit}
          disabled={!hasContent}
          style={{
            width: '100%',
            maxWidth: 480,
            display: 'block',
            margin: '0 auto',
            background: 'var(--accent)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 50,
            padding: '16px 0',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 700,
            fontSize: 16,
            cursor: hasContent ? 'pointer' : 'default',
            opacity: hasContent ? 1 : 0.5,
            transition: 'opacity 0.15s ease',
            minHeight: 54,
          }}
        >
          Let's begin.
        </button>
      </div>
    </div>
  );
}
