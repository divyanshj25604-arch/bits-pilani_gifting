import React, { useState } from 'react';
import ThemeToggle from './components/ThemeToggle';
import PreConversation from './components/PreConversation';
import ConversationSurface from './components/ConversationSurface';
import OutputSurface from './components/OutputSurface';

export default function App() {
  const [surface, setSurface] = useState('pre'); // pre | conversation | output
  const [recipientInput, setRecipientInput] = useState('');
  const [outputData, setOutputData] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  function handleBegin(name) {
    setRecipientInput(name);
    setTransitioning(true);
    setTimeout(() => {
      setSurface('conversation');
      setTransitioning(false);
    }, 200);
  }

  function handleOutputReady(data) {
    setOutputData(data);
    setTransitioning(true);
    setTimeout(() => {
      setSurface('output');
      setTransitioning(false);
    }, 400);
  }

  function handleStartOver() {
    setTransitioning(true);
    setTimeout(() => {
      setOutputData(null);
      setRecipientInput('');
      setSurface('pre');
      setTransitioning(false);
    }, 200);
  }

  return (
    <div
      style={{
        opacity: transitioning ? 0 : 1,
        transition: 'opacity 0.2s ease',
        minHeight: '100dvh',
        background: 'var(--bg)',
      }}
    >
      <ThemeToggle visible={surface === 'pre'} />

      {surface === 'pre' && (
        <PreConversation onBegin={handleBegin} />
      )}

      {surface === 'conversation' && (
        <ConversationSurface
          recipientInput={recipientInput}
          onOutputReady={handleOutputReady}
        />
      )}

      {surface === 'output' && outputData && (
        <OutputSurface
          data={outputData}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
