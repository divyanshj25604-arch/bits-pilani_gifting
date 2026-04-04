export interface GiftInput {
  recipient_name: string;
  mood_signal: string[];
  beat2_response: string;
  beat3_intent: string;
  social_risk_level: "high" | "medium" | "low";
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
