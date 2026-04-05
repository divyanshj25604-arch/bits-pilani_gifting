import React, { useRef, useEffect } from 'react';
import SendIcon from './SendIcon';

export default function TextInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  multiline = false,
  autoFocus = false,
  alwaysShowSend = false,
  style = {},
}) {
  const ref = useRef(null);
  const hasContent = value.trim().length > 0;
  const showSend = alwaysShowSend || hasContent;

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
    }
  }, [autoFocus]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (alwaysShowSend || hasContent) onSubmit();
    }
  }

  const inputStyle = {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 16,
    color: 'var(--text-primary)',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--input-underline)',
    outline: 'none',
    width: '100%',
    lineHeight: 1.6,
    padding: '8px 0',
    resize: 'none',
    ...style,
  };

  return (
    <div style={{ display: 'flex', alignItems: multiline ? 'flex-end' : 'center', width: '100%' }}>
      {multiline ? (
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          style={{
            ...inputStyle,
            maxHeight: 120,
            overflowY: value.split('\n').length > 4 ? 'auto' : 'hidden',
          }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
          placeholder={placeholder}
        />
      ) : (
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={inputStyle}
        />
      )}
      <SendIcon onClick={onSubmit} visible={showSend} />
    </div>
  );
}
