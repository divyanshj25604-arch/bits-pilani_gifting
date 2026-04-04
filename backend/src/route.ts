import { Router, Request, Response } from "express";
import { validateGiftInput, castToGiftInput } from "./validation";
import { generateGiftDirection } from "./groq.service";

const giftRouter = Router();

/**
 * POST /api/gift/direction
 * Takes structured gift input → returns personalized gift direction via Groq.
 */
giftRouter.post("/direction", async (req: Request, res: Response): Promise<void> => {
  // 1. Validate input
  const error = validateGiftInput(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const input = castToGiftInput(req.body);

  // 2. Call Groq
  try {
    const result = await generateGiftDirection(input);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error generating gift direction.";
    console.error("[Thoughtly] Gift direction generation failed:", message);
    res.status(500).json({ error: message });
  }
});

export default giftRouter;
