import { useState, useCallback } from 'react';

const INITIAL_STATE = {
  // Surface control
  surface: 'pre', // 'pre' | 'conversation' | 'output'

  // Pre-conversation
  recipientInput: '',

  // Conversation beats
  moodSelection: [],
  moodSelectionOrder: [], // track order for tie-breaking

  beat2Question: '',
  beat2Response: '',
  beat2FollowUpUsed: false,

  beat3Response: '',
  socialRiskLevel: 'medium',

  beat4Response: null,

  // Output
  outputDirection: '',
  outputExamples: [],
  outputWhyNote: '',
  regenerationCount: 0,

  // UI state
  conversationStep: 'beat1', // beat1 | thinking1 | beat2 | thinking2 | beat3 | thinking3 | beat4 | thinking4
  beat2AwaitingFollowup: false,
};

export function useSession() {
  const [state, setState] = useState(INITIAL_STATE);

  const update = useCallback((patch) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { state, update, reset };
}
