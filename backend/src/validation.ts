import { GiftInput } from "./types";

/**
 * Validates the incoming gift request payload.
 * Returns an error string if invalid, or null if valid.
 */
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

/**
 * Casts a validated body to GiftInput.
 */
export function castToGiftInput(body: unknown): GiftInput {
  return body as GiftInput;
}
