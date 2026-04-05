import React, { useState, useEffect, useRef, useCallback } from 'react';
import MoodCard from './MoodCard';
import ThinkingState from './ThinkingState';
import ThinkingState4 from './ThinkingState4';
import ConversationMessage from './ConversationMessage';
import UserResponse from './UserResponse';
import TextInput from './TextInput';
import Wordmark from './Wordmark';
import {
  isThinInput, isRichInput, formatNameForPrompt,
  validateQuestion, inferSocialRisk, qualityFlag,
  cleanExampleItem, cleanExampleReason, validateDirection
} from '../utils';
import * as api from '../api';

const MOOD_CARDS = [
  'Quiet and interior',
  'Loud and full of life',
  'Precise about everything',
  'Warm and a little scattered',
];

const BEAT1_THINKING = {
  'Quiet and interior': 'Thinking about someone who holds things carefully...',
  'Loud and full of life': 'Thinking about someone who fills a room...',
  'Precise about everything': 'Thinking about someone who notices everything...',
  'Warm and a little scattered': 'Thinking about someone who loves deeply...',
};

function getThinking1(selection, order) {
  if (selection.length === 0) return '';
  const first = order[0] || selection[0];
  return BEAT1_THINKING[first] || BEAT1_THINKING['Quiet and interior'];
}

export default function ConversationSurface({ recipientInput, onOutputReady }) {
  const nameDisplay = formatNameForPrompt(recipientInput);
  const [step, setStep] = useState('beat1'); // beat1 | thinking1 | beat2 | thinking2 | beat3 | thinking3 | beat4 | thinking4
  const [moodSelection, setMoodSelection] = useState([]);
  const [moodOrder, setMoodOrder] = useState([]);
  const [moodConfirmed, setMoodConfirmed] = useState(false);
  const moodTimerRef = useRef(null);

  // Beat 2
  const [beat2Question, setBeat2Question] = useState('');
  const [beat2Value, setBeat2Value] = useState('');
  const [beat2Submitted, setBeat2Submitted] = useState('');
  const [beat2FollowUp, setBeat2FollowUp] = useState(false);
  const [beat2FollowValue, setBeat2FollowValue] = useState('');
  const [beat2Final, setBeat2Final] = useState('');
  const [thinking2Text, setThinking2Text] = useState('Sitting with what you just shared...');

  // Beat 3
  const [beat3Value, setBeat3Value] = useState('');
  const [beat3Submitted, setBeat3Submitted] = useState('');
  const [socialRisk, setSocialRisk] = useState('medium');

  // Beat 4
  const [beat4Value, setBeat4Value] = useState('');
  const [beat4Submitted, setBeat4Submitted] = useState(null);

  // Output API state
  const [apiReady, setApiReady] = useState(false);
  const [outputData, setOutputData] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [step, beat2FollowUp]);

  // ── Beat 1: mood selection with 1.5s debounce ─────────────────────────────
  function handleMoodSelect(card) {
    setMoodSelection(prev => {
      if (prev.includes(card)) {
        const next = prev.filter(c => c !== card);
        setMoodOrder(o => o.filter(c => c !== card));
        return next;
      }
      if (prev.length >= 2) {
        const removed = prev[0];
        setMoodOrder(o => [...o.filter(c => c !== removed), card]);
        return [prev[1], card];
      }
      setMoodOrder(o => [...o, card]);
      return [...prev, card];
    });

    if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
  }

  useEffect(() => {
    if (moodSelection.length === 0 || step !== 'beat1') return;
    if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
    moodTimerRef.current = setTimeout(() => {
      setMoodConfirmed(true);
      setTimeout(() => proceedToThinking1(), 800);
    }, 1500);
    return () => clearTimeout(moodTimerRef.current);
  }, [moodSelection]);

  function proceedToThinking1() {
    setStep('thinking1');
    // Kick off beat2 question API call immediately
    api.beat2Question(recipientInput, moodSelection).then(res => {
      const q = validateQuestion(res.question, moodSelection);
      setBeat2Question(q);
    }).catch(() => {
      setBeat2Question(validateQuestion(null, moodSelection));
    });

    setTimeout(() => setStep('beat2'), 2500);
  }

  // ── Beat 2 submit ─────────────────────────────────────────────────────────
  function handleBeat2Submit() {
    const val = beat2Value.trim();
    if (!val) return;
    setBeat2Submitted(val);

    if (isThinInput(val) && !beat2FollowUp) {
      setBeat2FollowUp(true);
      return;
    }
    const finalResponse = beat2FollowUp ? (beat2FollowValue.trim() || val) : val;
    setBeat2Final(finalResponse);
    const rich = isRichInput(finalResponse);
    setThinking2Text(rich ? 'That tells me something important about them...' : 'Sitting with what you just shared...');
    setStep('thinking2');
    setTimeout(() => setStep('beat3'), 3000);
  }

  function handleBeat2FollowSubmit() {
    const val = beat2FollowValue.trim() || beat2Submitted;
    setBeat2Final(val);
    const rich = isRichInput(val);
    setThinking2Text(rich ? 'That tells me something important about them...' : 'Sitting with what you just shared...');
    setStep('thinking2');
    setTimeout(() => setStep('beat3'), 3000);
  }

  // ── Beat 3 submit ─────────────────────────────────────────────────────────
  function handleBeat3Submit() {
    const val = beat3Value.trim();
    if (!val) return;
    setBeat3Submitted(val);
    const risk = inferSocialRisk(val);
    setSocialRisk(risk);
    setStep('thinking3');
    setTimeout(() => setStep('beat4'), 2000);
  }

  // ── Beat 4 submit / skip ──────────────────────────────────────────────────
  function handleBeat4Submit() {
    const val = beat4Value.trim() || null;
    setBeat4Submitted(val);
    setStep('thinking4');
    // Fire direction API call
    fireDirectionCall(val, socialRisk);
  }

  async function fireDirectionCall(memory, risk) {
    const giftInput = {
      recipient_name: recipientInput,
      mood_signal: moodSelection,
      beat2_response: beat2Final || beat2Submitted || 'nothing provided',
      beat3_intent: beat3Submitted,
      social_risk_level: risk,
      memory: memory || 'none provided',
    };

    try {
      let result = await api.generateDirection(giftInput);
      // Validate direction
      if (!result.direction || result.direction.length < 20 || !validateDirection(result.direction)) {
        result = await api.generateDirection(giftInput); // retry
      }
      // Clean examples
      const examples = (result.examples || []).slice(0, 3).map(ex => ({
        item: cleanExampleItem(ex.item),
        reason: cleanExampleReason(ex.reason),
      }));
      // Quality flag
      qualityFlag(beat2Final, memory, result.direction);

      setOutputData({
        direction: result.direction,
        examples,
        why_note: result.why_note,
        originalInput: giftInput,
      });
      setApiReady(true);
    } catch (err) {
      console.error(err);
      setApiReady(true); // let ThinkingState4 surface error
    }
  }

  function handleThinking4Complete() {
    if (outputData) {
      onOutputReady(outputData);
    }
  }

  // ── Receding check ────────────────────────────────────────────────────────
  const isReceding = (beatStep) => {
    const order = ['beat1', 'thinking1', 'beat2', 'thinking2', 'beat3', 'thinking3', 'beat4', 'thinking4'];
    return order.indexOf(step) > order.indexOf(beatStep);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        position: 'relative',
      }}
    >
      <Wordmark variant="watermark" />

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '80px 24px 60px',
          maxWidth: 520,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* ── Beat 1 ── */}
        <div style={{ opacity: isReceding('beat1') ? 0.3 : 1, transition: 'opacity 0.4s ease', animation: 'fadeIn 0.3s ease both' }}>
          <ConversationMessage
            text={`Before I ask you anything — which of these feels most like ${nameDisplay} right now?`}
            receding={isReceding('beat1')}
          />

          {/* Mood grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            {MOOD_CARDS.map(card => (
              <MoodCard
                key={card}
                label={card}
                selected={moodSelection.includes(card)}
                onSelect={() => step === 'beat1' && handleMoodSelect(card)}
              />
            ))}
          </div>

          {moodConfirmed && (
            <p className="font-georgia" style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-muted)', marginTop: 12, animation: 'fadeIn 0.3s ease both' }}>
              Got it.
            </p>
          )}
        </div>

        {/* ── Thinking 1 ── */}
        {(step === 'thinking1' || isReceding('thinking1')) && (
          <ThinkingState
            text={getThinking1(moodSelection, moodOrder)}
            visible={step === 'thinking1'}
          />
        )}

        {/* ── Beat 2 ── */}
        {(step === 'beat2' || isReceding('beat2') || isReceding('thinking2')) && beat2Question && (
          <div style={{ marginTop: 28, opacity: isReceding('beat2') ? 0.3 : 1, transition: 'opacity 0.4s ease', animation: 'fadeIn 0.25s ease both' }}>
            <ConversationMessage text={beat2Question} receding={isReceding('beat2')} />

            {!isReceding('beat2') && !beat2Submitted && (
              <div style={{ marginTop: 12 }}>
                <TextInput
                  value={beat2Value}
                  onChange={setBeat2Value}
                  onSubmit={handleBeat2Submit}
                  placeholder="Whatever comes to mind first."
                  multiline
                  autoFocus
                />
              </div>
            )}

            {beat2Submitted && <UserResponse text={beat2Submitted} />}

            {beat2FollowUp && !isReceding('beat2') && (
              <div style={{ marginTop: 16, animation: 'fadeIn 0.25s ease both' }}>
                <ConversationMessage text="Say more if you can — even something small helps." />
                <div style={{ marginTop: 12 }}>
                  <TextInput
                    value={beat2FollowValue}
                    onChange={setBeat2FollowValue}
                    onSubmit={handleBeat2FollowSubmit}
                    placeholder="Whatever comes to mind first."
                    multiline
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Thinking 2 ── */}
        {(step === 'thinking2' || isReceding('thinking2')) && (
          <ThinkingState text={thinking2Text} visible={step === 'thinking2'} />
        )}

        {/* ── Beat 3 ── */}
        {(step === 'beat3' || isReceding('beat3') || isReceding('thinking3')) && (
          <div style={{ marginTop: 28, opacity: isReceding('beat3') ? 0.3 : 1, transition: 'opacity 0.4s ease', animation: 'fadeIn 0.25s ease both' }}>
            <ConversationMessage
              text={`What do you want ${nameDisplay} to feel when they open this?`}
              receding={isReceding('beat3')}
            />
            {!isReceding('beat3') && !beat3Submitted && (
              <div style={{ marginTop: 12 }}>
                <TextInput
                  value={beat3Value}
                  onChange={setBeat3Value}
                  onSubmit={handleBeat3Submit}
                  placeholder="There's no wrong answer here."
                  multiline
                  autoFocus
                />
              </div>
            )}
            {beat3Submitted && <UserResponse text={beat3Submitted} />}
          </div>
        )}

        {/* ── Thinking 3 ── */}
        {(step === 'thinking3' || isReceding('thinking3')) && (
          <ThinkingState text="Almost there. One last thing, if you're open to it..." visible={step === 'thinking3'} />
        )}

        {/* ── Beat 4 ── */}
        {(step === 'beat4' || isReceding('beat4') || isReceding('thinking4')) && (
          <div style={{ marginTop: 28, opacity: isReceding('beat4') ? 0.3 : 1, transition: 'opacity 0.4s ease', animation: 'fadeIn 0.25s ease both' }}>
            <p style={{ fontSize: 11, fontFamily: 'Arial', fontWeight: 700, color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Optional
            </p>
            <ConversationMessage
              text={`If there's a moment or conversation with ${nameDisplay} that's been on your mind lately — even something small — I'd love to hear it.`}
              receding={isReceding('beat4')}
            />
            {!isReceding('beat4') && beat4Submitted === null && (
              <div style={{ marginTop: 12 }}>
                <TextInput
                  value={beat4Value}
                  onChange={setBeat4Value}
                  onSubmit={handleBeat4Submit}
                  placeholder="Or skip this — you've already given me a lot."
                  multiline
                  autoFocus
                  alwaysShowSend
                />
              </div>
            )}
            {beat4Submitted !== null && beat4Submitted && <UserResponse text={beat4Submitted} />}
            {beat4Submitted !== null && !beat4Submitted && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Arial', marginTop: 8, opacity: 0.5 }}>Skipped</p>
            )}
          </div>
        )}

        {/* ── Thinking 4 ── */}
        {step === 'thinking4' && (
          <ThinkingState4
            apiReady={apiReady}
            onComplete={handleThinking4Complete}
          />
        )}

        {/* Spacer so content sits in lower viewport */}
        <div style={{ height: 120 }} />
      </div>
    </div>
  );
}
