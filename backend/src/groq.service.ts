import Groq from "groq-sdk";
import { GiftInput, GiftOutput } from "./types";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Calls Groq with the structured gift input and returns the parsed GiftOutput.
 * Uses json_object response format for reliable JSON output.
 */
export async function generateGiftDirection(input: GiftInput): Promise<GiftOutput> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 1024,
  });

  const raw = completion.choices[0]?.message?.content;

  if (!raw) {
    throw new Error("Groq returned empty response.");
  }

  let parsed: GiftOutput;
  try {
    parsed = JSON.parse(raw) as GiftOutput;
  } catch {
    throw new Error(`Failed to parse Groq response as JSON: ${raw.slice(0, 200)}`);
  }

  // Basic structural validation of the output
  if (
    typeof parsed.direction !== "string" ||
    !Array.isArray(parsed.examples) ||
    parsed.examples.length !== 3 ||
    typeof parsed.why_note !== "string"
  ) {
    throw new Error("Groq response does not match expected GiftOutput structure.");
  }

  for (const ex of parsed.examples) {
    if (typeof ex.item !== "string" || typeof ex.reason !== "string") {
      throw new Error("Each example must have 'item' and 'reason' as strings.");
    }
  }

  return parsed;
}
