import { GiftInput } from "./types";

// ─── Beat 1 Validation ───

export function validateBeat1(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Request body must be a JSON object.";
  const input = body as Record<string, unknown>;

  if (!Array.isArray(input.mood_signal) || input.mood_signal.length === 0 || input.mood_signal.length > 2) {
    return "mood_signal must be an array of 1-2 strings.";
  }
  if (!input.mood_signal.every((s: unknown) => typeof s === "string")) {
    return "Every element in mood_signal must be a string.";
  }

  return null;
}

// ─── Beat 2 Question Validation ───

export function validateBeat2Question(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Request body must be a JSON object.";
  const input = body as Record<string, unknown>;

  if (typeof input.recipient_name !== "string" || input.recipient_name.trim().length === 0) {
    return "recipient_name is required and must be a non-empty string.";
  }

  if (!Array.isArray(input.mood_signal) || input.mood_signal.length === 0) {
    return "mood_signal is required and must be a non-empty array of strings.";
  }

  return null;
}

// ─── Beat 2 Follow-up Validation ───

export function validateBeat2Followup(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Request body must be a JSON object.";
  const input = body as Record<string, unknown>;

  if (typeof input.beat2_response !== "string") {
    return "beat2_response is required and must be a string.";
  }

  return null;
}

// ─── Beat 3 Risk Validation ───

export function validateBeat3Risk(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Request body must be a JSON object.";
  const input = body as Record<string, unknown>;

  if (typeof input.beat3_intent !== "string" || input.beat3_intent.trim().length === 0) {
    return "beat3_intent is required and must be a non-empty string.";
  }

  return null;
}

// ─── Final Direction Validation ───

export function validateGiftInput(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object.";
  }

  const input = body as Record<string, unknown>;

  // recipient_name
  if (typeof input.recipient_name !== "string" || input.recipient_name.trim().length === 0) {
    return "recipient_name is required and must be a non-empty string.";
  }

  // mood_signal
  if (!Array.isArray(input.mood_signal) || input.mood_signal.length === 0) {
    return "mood_signal is required and must be a non-empty array of strings.";
  }
  if (!input.mood_signal.every((s: unknown) => typeof s === "string")) {
    return "Every element in mood_signal must be a string.";
  }

  // beat2_response
  if (typeof input.beat2_response !== "string" || input.beat2_response.trim().length === 0) {
    return "beat2_response is required and must be a non-empty string.";
  }

  // beat3_intent
  if (typeof input.beat3_intent !== "string" || input.beat3_intent.trim().length === 0) {
    return "beat3_intent is required and must be a non-empty string.";
  }

  // social_risk_level
  const validRisk = ["high", "medium", "low"];
  if (typeof input.social_risk_level !== "string" || !validRisk.includes(input.social_risk_level)) {
    return `social_risk_level must be one of: ${validRisk.join(", ")}.`;
  }

  // memory
  if (typeof input.memory !== "string") {
    return "memory is required and must be a string (use 'none provided' if empty).";
  }

  return null;
}

// ─── Regenerate Validation ───

export function validateRegenerate(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Request body must be a JSON object.";
  const input = body as Record<string, unknown>;

  if (!input.original_input || typeof input.original_input !== "object") {
    return "original_input is required.";
  }

  if (!input.original_output || typeof input.original_output !== "object") {
    return "original_output is required.";
  }

  if (typeof input.feedback !== "string" || input.feedback.trim().length === 0) {
    return "feedback is required and must be a non-empty string.";
  }

  // Validate nested original_input
  const nestedError = validateGiftInput(input.original_input);
  if (nestedError) return `original_input: ${nestedError}`;

  return null;
}

/**
 * Casts a validated body to GiftInput.
 */
export function castToGiftInput(body: unknown): GiftInput {
  return body as GiftInput;
}
