// ─── Mood Signals (hardcoded per spec) ───

export const MOOD_SIGNALS = [
  "Quiet and interior",
  "Loud and full of life",
  "Precise about everything",
  "Warm and a little scattered",
] as const;

export type MoodSignal = (typeof MOOD_SIGNALS)[number];

// ─── Social Risk ───

export type SocialRiskLevel = "high" | "medium" | "low";

// ─── Beat Request/Response Types ───

/** Beat 1 — frontend sends mood selection, backend returns thinking copy */
export interface Beat1Request {
  mood_signal: string[];
}

export interface Beat1Response {
  thinking_copy: string;
}

/** Beat 2 — generate the unexpected question */
export interface Beat2QuestionRequest {
  recipient_name: string;
  mood_signal: string[];
}

export interface Beat2QuestionResponse {
  question: string;
}

/** Beat 2 — follow-up check for thin input */
export interface Beat2FollowupRequest {
  beat2_response: string;
}

export interface Beat2FollowupResponse {
  is_thin: boolean;
  follow_up: string | null;
  thinking_copy: string;
}

/** Beat 3 — infer social risk level from occasion intent */
export interface Beat3RiskRequest {
  beat3_intent: string;
}

export interface Beat3RiskResponse {
  social_risk_level: SocialRiskLevel;
  thinking_copy: string;
}

// ─── Final Direction Input/Output ───

export interface GiftInput {
  recipient_name: string;
  mood_signal: string[];
  beat2_response: string;
  beat3_intent: string;
  social_risk_level: SocialRiskLevel;
  memory: string;
}

export interface GiftExample {
  item: string;
  reason: string;
}

export interface GiftOutput {
  direction: string;
  examples: [GiftExample, GiftExample, GiftExample];
  why_note: string;
}

// ─── Regeneration ───

export interface RegenerateRequest {
  original_input: GiftInput;
  original_output: GiftOutput;
  feedback: string;
}

export interface RegenerateResponse {
  direction: string;
  examples: [GiftExample, GiftExample, GiftExample];
  why_note: string;
}
