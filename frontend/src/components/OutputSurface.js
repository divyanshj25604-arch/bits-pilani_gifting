import React, { useState, useRef, useEffect } from 'react';
import Wordmark from './Wordmark';
import { cleanExampleItem, cleanExampleReason, validateDirection } from '../utils';
import * as api from '../api';

export default function OutputSurface({ data, onStartOver }) {
  const { direction: initialDirection, examples: initialExamples, why_note: initialWhyNote, originalInput } = data;

  const [direction, setDirection] = useState(initialDirection);
  const [examples] = useState(initialExamples);
  const [whyNote] = useState(initialWhyNote);

  const [showDirection, setShowDirection] = useState(false);
  const [showChevron, setShowChevron] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy the note');

  const [regenCount, setRegenCount] = useState(0);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenValue, setRegenValue] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);
  const [dirFading, setDirFading] = useState(false);

  const regenInputRef = useRef(null);

  useEffect(() => {
    // Direction appears 500ms after mount
    const t1 = setTimeout(() => setShowDirection(true), 500);
    // Chevron appears 2s after direction
    const t2 = setTimeout(() => setShowChevron(true), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (regenOpen && regenInputRef.current) {
      regenInputRef.current.focus();
    }
  }, [regenOpen]);

  function handleCopy() {
    if (!whyNote) return;
    navigator.clipboard?.writeText(whyNote).catch(() => {});
    setCopyLabel('Copied');
    setTimeout(() => setCopyLabel('Copy the note'), 2000);
  }

  async function handleRegen() {
    if (!regenValue.trim()) return;
    setRegenLoading(true);
    setRegenOpen(false);
    try {
      const res = await api.regenerateDirection(originalInput, {
        direction,
        examples,
        why_note: whyNote,
      }, regenValue.trim());

      // Fade out old direction
      setDirFading(true);
      await new Promise(r => setTimeout(r, 220));
      setDirection(res.direction || direction);
      setDirFading(false);
      setRegenCount(c => c + 1);
      setRegenValue('');
    } catch (err) {
      console.error(err);
    }
    setRegenLoading(false);
  }

  // Strip why_note to max 2 sentences
  function trimWhyNote(text) {
    if (!text) return text;
    const parts = text.split(/(?<=[.!?])\s+/);
    return parts.slice(0, 2).join(' ');
  }

  const cleanedWhyNote = trimWhyNote(whyNote);

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        position: 'relative',
        animation: 'fadeIn 0.4s ease both',
      }}
    >
      <Wordmark variant="watermark" />

      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          padding: '80px 24px 60px',
        }}
      >
        {/* ── Direction ── */}
        <div
          style={{
            opacity: showDirection ? (dirFading ? 0 : 1) : 0,
            transform: showDirection ? 'none' : 'translateY(8px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            marginBottom: 48,
          }}
        >
          <p
            className="font-georgia"
            style={{
              fontSize: 'clamp(17px, 4vw, 20px)',
              lineHeight: 1.7,
              color: 'var(--text-primary)',
              fontWeight: 400,
            }}
          >
            {direction}
          </p>

          {showChevron && (
            <div
              style={{
                marginTop: 24,
                animation: 'chevronPulse 2s ease-in-out infinite',
                opacity: 0.4,
                textAlign: 'left',
              }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          )}
        </div>

        {/* ── Examples ── */}
        <div style={{ marginBottom: 48 }}>
          {examples.map((ex, i) => (
            <div key={i} style={{ marginBottom: i < examples.length - 1 ? 28 : 0 }}>
              <p style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
                marginBottom: 4,
              }}>
                {cleanExampleItem(ex.item)}
              </p>
              <p style={{
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: 14,
                color: 'var(--text-muted)',
                lineHeight: 1.6,
              }}>
                {cleanExampleReason(ex.reason)}
              </p>
            </div>
          ))}
        </div>

        {/* ── Why Note ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ borderTop: '1px solid var(--rule-color)', marginBottom: 12 }} />
          <p style={{
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontWeight: 700,
            fontSize: 11,
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 16,
          }}>
            Something you could say or write
          </p>
          <p
            className="font-georgia"
            style={{
              fontSize: 16,
              fontStyle: 'italic',
              lineHeight: 1.7,
              color: 'var(--text-primary)',
              padding: '20px 0 32px',
            }}
          >
            {cleanedWhyNote}
          </p>
        </div>

        {/* ── Regen feedback input ── */}
        {regenOpen && (
          <div style={{ marginBottom: 24, animation: 'fadeIn 0.2s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--input-underline)' }}>
              <input
                ref={regenInputRef}
                type="text"
                value={regenValue}
                onChange={e => setRegenValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegen()}
                placeholder="What feels off?"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'Arial',
                  fontSize: 15,
                  color: 'var(--text-primary)',
                  padding: '8px 0',
                  lineHeight: 1.6,
                }}
              />
              <button
                onClick={handleRegen}
                aria-label="Submit"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: regenValue.trim() ? 'pointer' : 'default',
                  padding: 8,
                  opacity: regenValue.trim() ? 1 : 0.3,
                  minWidth: 44,
                  minHeight: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1={22} y1={2} x2={11} y2={13} />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {regenLoading && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Arial', fontStyle: 'italic', marginBottom: 16 }}>
            Rethinking...
          </p>
        )}

        {/* ── Action row ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          {/* Start over */}
          <button
            onClick={onStartOver}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Arial',
              fontSize: 14,
              color: 'var(--text-muted)',
              padding: '10px 0',
              minHeight: 44,
              minWidth: 44,
            }}
          >
            Start over.
          </button>

          {/* This doesn't feel right */}
          {regenCount < 2 && (
            <button
              onClick={() => setRegenOpen(o => !o)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Arial',
                fontSize: 13,
                color: 'var(--text-muted)',
                padding: '10px 0',
                minHeight: 44,
                minWidth: 44,
              }}
            >
              This doesn't feel right
            </button>
          )}

          {/* Copy the note */}
          <button
            onClick={handleCopy}
            style={{
              background: 'var(--accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 50,
              padding: '12px 22px',
              fontFamily: 'Arial',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              minHeight: 44,
              minWidth: 44,
              transition: 'opacity 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {copyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
