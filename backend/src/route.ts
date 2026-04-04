import { Router, Request, Response } from "express";
import {
  validateBeat1,
  validateBeat2Question,
  validateBeat2Followup,
  validateBeat3Risk,
  validateGiftInput,
  validateRegenerate,
  castToGiftInput,
} from "./validation";
import {
  generateBeat2Question,
  inferSocialRisk,
  generateGiftDirection,
  regenerateDirection,
} from "./groq.service";
import {
  BEAT1_THINKING_COPY,
  BEAT3_THINKING,
  BEAT4_THINKING_SEQUENCE,
  BEAT2_THINKING_THIN,
  BEAT2_THINKING_RICH,
  THIN_INPUT_FOLLOWUP,
  isThinInput,
  isRichInput,
} from "./prompt";
import { GiftOutput, RegenerateRequest } from "./types";

const giftRouter = Router();

// ─── Beat 1: Thinking State ───
// Frontend sends mood_signal selection → returns thinking copy

giftRouter.post("/beat1/think", (req: Request, res: Response): void => {
  const error = validateBeat1(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const moodSignals: string[] = req.body.mood_signal;

  // Combine thinking copy for selected moods (max 2)
  const copies = moodSignals
    .map((signal: string) => BEAT1_THINKING_COPY[signal])
    .filter(Boolean);

  const thinking_copy = copies.length > 0
    ? copies.join(" ")
    : "Thinking about someone special...";

  res.json({ thinking_copy });
});

// ─── Beat 2: Generate Unexpected Question ───

giftRouter.post("/beat2/question", async (req: Request, res: Response): Promise<void> => {
  const error = validateBeat2Question(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  try {
    const question = await generateBeat2Question(
      req.body.recipient_name,
      req.body.mood_signal
    );
    res.json({ question });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate question.";
    console.error("[Thoughtly] Beat 2 question generation failed:", message);
    res.status(500).json({ error: message });
  }
});

// ─── Beat 2: Follow-up Check (thin input detection) ───

giftRouter.post("/beat2/followup", (req: Request, res: Response): void => {
  const error = validateBeat2Followup(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const response: string = req.body.beat2_response;
  const is_thin = isThinInput(response);
  const rich = isRichInput(response);

  res.json({
    is_thin,
    follow_up: is_thin ? THIN_INPUT_FOLLOWUP : null,
    thinking_copy: rich ? BEAT2_THINKING_RICH : BEAT2_THINKING_THIN,
  });
});

// ─── Beat 3: Infer Social Risk Level ───

giftRouter.post("/beat3/risk", async (req: Request, res: Response): Promise<void> => {
  const error = validateBeat3Risk(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  try {
    const social_risk_level = await inferSocialRisk(req.body.beat3_intent);
    res.json({
      social_risk_level,
      thinking_copy: BEAT3_THINKING,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to infer risk level.";
    console.error("[Thoughtly] Beat 3 risk inference failed:", message);
    res.status(500).json({ error: message });
  }
});

// ─── Beat 4: Return Thinking Sequence ───
// No AI call needed — returns the fixed multi-line thinking sequence

giftRouter.get("/beat4/think", (_req: Request, res: Response): void => {
  res.json({
    thinking_sequence: BEAT4_THINKING_SEQUENCE,
  });
});

// ─── Final Output: Generate Gift Direction ───

giftRouter.post("/direction", async (req: Request, res: Response): Promise<void> => {
  const error = validateGiftInput(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const input = castToGiftInput(req.body);

  try {
    const result = await generateGiftDirection(input);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error generating gift direction.";
    console.error("[Thoughtly] Gift direction generation failed:", message);
    res.status(500).json({ error: message });
  }
});

// ─── Regeneration: "This doesn't feel right" ───

giftRouter.post("/regenerate", async (req: Request, res: Response): Promise<void> => {
  const error = validateRegenerate(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const { original_input, original_output, feedback } = req.body as RegenerateRequest;

  try {
    const result = await regenerateDirection(
      original_input,
      original_output as GiftOutput,
      feedback
    );
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to regenerate direction.";
    console.error("[Thoughtly] Regeneration failed:", message);
    res.status(500).json({ error: message });
  }
});

export default giftRouter;
