import Groq from "groq-sdk";
import {
  GiftInput,
  GiftOutput,
  SocialRiskLevel,
} from "./types";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildBeat2QuestionSystemPrompt,
  buildBeat2QuestionUserPrompt,
  buildRiskInferenceSystemPrompt,
  buildRiskInferenceUserPrompt,
  buildRegenerateSystemPrompt,
  buildRegenerateUserPrompt,
} from "./prompt";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

// ─── Beat 2: Generate the Unexpected Question ───

export async function generateBeat2Question(
  recipientName: string,
  moodSignals: string[]
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: buildBeat2QuestionSystemPrompt() },
      { role: "user", content: buildBeat2QuestionUserPrompt(recipientName, moodSignals) },
    ],
    temperature: 0.8,
    max_tokens: 150,
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Groq returned empty response for Beat 2 question.");

  return raw;
}

// ─── Beat 3: Infer Social Risk Level ───

export async function inferSocialRisk(beat3Intent: string): Promise<SocialRiskLevel> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: buildRiskInferenceSystemPrompt() },
      { role: "user", content: buildRiskInferenceUserPrompt(beat3Intent) },
    ],
    temperature: 0.2,
    max_tokens: 10,
  });

  const raw = completion.choices[0]?.message?.content?.trim().toLowerCase();
  if (!raw) throw new Error("Groq returned empty response for risk inference.");

  const valid: SocialRiskLevel[] = ["high", "medium", "low"];
  const level = valid.find((v) => raw.includes(v));
  if (!level) {
    console.warn(`[Thoughtly] Risk inference returned unexpected value: "${raw}", defaulting to "medium".`);
    return "medium";
  }

  return level;
}

// ─── Final Direction Generation (with retry + self-validation) ───

export async function generateGiftDirection(input: GiftInput): Promise<GiftOutput> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(input);

  // Attempt up to 2 times (spec: retry once on malformed JSON)
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await groq.chat.completions.create({
      model: MODEL,
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
      if (attempt === 0) continue;
      throw new Error("Groq returned empty response.");
    }

    let parsed: GiftOutput;
    try {
      parsed = JSON.parse(raw) as GiftOutput;
    } catch {
      if (attempt === 0) {
        console.warn("[Thoughtly] Malformed JSON on attempt 1, retrying...");
        continue;
      }
      throw new Error(`Failed to parse Groq response as JSON after retry: ${raw.slice(0, 200)}`);
    }

    // Structural validation
    if (
      typeof parsed.direction !== "string" ||
      !Array.isArray(parsed.examples) ||
      parsed.examples.length !== 3 ||
      typeof parsed.why_note !== "string"
    ) {
      if (attempt === 0) {
        console.warn("[Thoughtly] Output structure invalid on attempt 1, retrying...");
        continue;
      }
      throw new Error("Groq response does not match expected GiftOutput structure.");
    }

    for (const ex of parsed.examples) {
      if (typeof ex.item !== "string" || typeof ex.reason !== "string") {
        if (attempt === 0) continue;
        throw new Error("Each example must have 'item' and 'reason' as strings.");
      }
    }

    // Self-validation: check if Direction references user's words (spec Section 6)
    if (!passesContentValidation(parsed.direction, input)) {
      if (attempt === 0) {
        console.warn("[Thoughtly] Direction doesn't reference user input, regenerating...");
        continue;
      }
      // On second attempt, accept what we have rather than failing entirely
      console.warn("[Thoughtly] Direction may not strongly reference user input after retry. Proceeding.");
    }

    return parsed;
  }

  throw new Error("Failed to generate valid gift direction after retries.");
}

// ─── Regeneration (Section 5 & 6: "This doesn't feel right") ───

export async function regenerateDirection(
  input: GiftInput,
  originalOutput: GiftOutput,
  feedback: string
): Promise<GiftOutput> {
  const systemPrompt = buildRegenerateSystemPrompt();
  const userPrompt = buildRegenerateUserPrompt(input, originalOutput.direction, feedback);

  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await groq.chat.completions.create({
      model: MODEL,
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
      if (attempt === 0) continue;
      throw new Error("Groq returned empty response for regeneration.");
    }

    let parsed: GiftOutput;
    try {
      parsed = JSON.parse(raw) as GiftOutput;
    } catch {
      if (attempt === 0) continue;
      throw new Error(`Failed to parse regeneration response: ${raw.slice(0, 200)}`);
    }

    if (
      typeof parsed.direction !== "string" ||
      !Array.isArray(parsed.examples) ||
      parsed.examples.length !== 3 ||
      typeof parsed.why_note !== "string"
    ) {
      if (attempt === 0) continue;
      throw new Error("Regeneration response structure invalid.");
    }

    return parsed;
  }

  throw new Error("Failed to regenerate direction after retries.");
}

// ─── Self-Validation Helper ───

/**
 * Checks if the direction contains words/ideas from beat2_response or memory.
 * Extracts significant words (4+ chars) and checks for overlap.
 */
function passesContentValidation(direction: string, input: GiftInput): boolean {
  const directionLower = direction.toLowerCase();

  const sources = [input.beat2_response];
  if (input.memory && input.memory.toLowerCase() !== "none provided") {
    sources.push(input.memory);
  }

  const stopWords = new Set([
    "that", "this", "with", "from", "they", "their", "them", "have", "been",
    "would", "could", "should", "about", "something", "really", "always",
    "never", "very", "just", "like", "when", "what", "where", "which",
  ]);

  for (const source of sources) {
    const words = source
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !stopWords.has(w));

    const matches = words.filter((w) => directionLower.includes(w));
    if (matches.length >= 2) return true;
  }

  return false;
}
