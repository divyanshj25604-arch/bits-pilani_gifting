# Thoughtly — Backend & AI Engine

> **Internal Technical Reference — MVP v1.0**
>
> AI-powered backend that helps people trust their own gifting judgment.
> Built with Node.js, Express, TypeScript, and Groq (Llama 3.3 70B Versatile).

---

## Table of Contents

1. [What This Backend Does](#1-what-this-backend-does)
2. [Tech Stack](#2-tech-stack)
3. [Setup & Running](#3-setup--running)
4. [Architecture Overview](#4-architecture-overview)
5. [File-by-File Breakdown](#5-file-by-file-breakdown)
6. [The Conversation Flow (Beats 1–4)](#6-the-conversation-flow-beats-14)
7. [API Reference — All Endpoints](#7-api-reference--all-endpoints)
8. [Prompt Engineering — How the AI Thinks](#8-prompt-engineering--how-the-ai-thinks)
9. [The Anchor Framework](#9-the-anchor-framework)
10. [Thin Input Detection & Follow-Up Logic](#10-thin-input-detection--follow-up-logic)
11. [Social Risk Inference](#11-social-risk-inference)
12. [Output Self-Validation](#12-output-self-validation)
13. [Retry & Error Handling](#13-retry--error-handling)
14. [Regeneration Flow ("This doesn't feel right")](#14-regeneration-flow-this-doesnt-feel-right)
15. [Thinking State Copy — Full Reference](#15-thinking-state-copy--full-reference)
16. [What Good Output Looks Like](#16-what-good-output-looks-like)
17. [What Bad Output Looks Like (Fail Conditions)](#17-what-bad-output-looks-like-fail-conditions)
18. [Frontend Integration Guide](#18-frontend-integration-guide)
19. [MVP Hard Limits — What NOT to Build](#19-mvp-hard-limits--what-not-to-build)

---

## 1. What This Backend Does

Thoughtly is not a product recommendation engine. It is a **confidence engine for gifting**.

The backend powers a 4-beat conversation between a user (the "giver") and an AI companion. The user shares details about their relationship with the gift recipient. The AI uses those details to generate a **gift direction** — not a product link, not a category, but a specific, emotionally grounded reasoning that the giver feels they arrived at themselves.

**The one test everything is measured against:**

> When a user finishes using Thoughtly, they should feel: *"I came up with this. The product just helped me see what I already knew."*
> If they feel *"the AI told me what to get"* — the product has failed.

---

## 2. Tech Stack

| Component | Technology | Why |
|---|---|---|
| Runtime | Node.js | Standard, fast cold start |
| Framework | Express 5 | Minimal, familiar, async-native |
| Language | TypeScript (strict mode) | Type safety across the entire request/response chain |
| LLM Provider | Groq | Ultra-low latency inference, critical for conversational UX |
| LLM Model | `llama-3.3-70b-versatile` | Best balance of quality and speed on Groq |
| Config | dotenv | Simple env-based secrets |
| Dev Tooling | nodemon + ts-node | Hot reload during development |

### Dependencies

**Production:**
- `express` — HTTP server
- `groq-sdk` — Official Groq client
- `cors` — Cross-origin support for frontend
- `dotenv` — Environment variable loading

**Development:**
- `typescript` — Compiler
- `ts-node` — Direct TS execution
- `nodemon` — File watcher + auto-restart
- `@types/node`, `@types/express`, `@types/cors` — Type definitions

---

## 3. Setup & Running

### Prerequisites

- Node.js 18+
- A Groq API key (get one at [console.groq.com](https://console.groq.com))

### Installation

```bash
cd backend
npm install
```

### Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=gsk_your_key_here
PORT=3000
```

A `.env.example` file is provided as a template.

### Running

```bash
# Development — hot reload on file changes
npm run dev

# Production build
npm run build    # Compiles TypeScript → dist/
npm start        # Runs compiled JavaScript
```

### Verify It Works

```bash
curl http://localhost:3000/health
# → {"status":"ok","service":"thoughtly-backend"}
```

---

## 4. Architecture Overview

```
backend/
├── src/
│   ├── server.ts          # Express app — middleware, health check, route mounting
│   ├── route.ts           # All 7 API endpoints (beats + direction + regenerate)
│   ├── groq.service.ts    # All Groq API calls (4 functions)
│   ├── prompt.ts          # All prompts, thinking states, thin input logic
│   ├── validation.ts      # Input validation for every endpoint (6 validators)
│   └── types.ts           # TypeScript interfaces for all requests/responses
├── .env                   # Secrets (not committed)
├── .env.example           # Template for .env
├── .gitignore             # Ignores node_modules, dist, .env
├── package.json           # Scripts: dev, build, start
└── tsconfig.json          # Strict TypeScript config
```

### Data Flow

```
Frontend                              Backend
────────                              ───────

User selects mood cards ──────────►  POST /api/gift/beat1/think
                          ◄──────── { thinking_copy }

                          ──────────►  POST /api/gift/beat2/question
                          ◄──────── { question }

User answers question ────────────►  POST /api/gift/beat2/followup
                          ◄──────── { is_thin, follow_up, thinking_copy }

User states occasion intent ──────►  POST /api/gift/beat3/risk
                          ◄──────── { social_risk_level, thinking_copy }

                          ──────────►  GET /api/gift/beat4/think
                          ◄──────── { thinking_sequence }

Frontend compiles all context ────►  POST /api/gift/direction
                          ◄──────── { direction, examples[3], why_note }

(Optional) User says "doesn't      POST /api/gift/regenerate
feel right" ──────────────────────►
                          ◄──────── { direction, examples[3], why_note }
```

### Key Design Decisions

- **Stateless sessions** — No database, no user accounts, no persistent memory. Every session starts fresh. Context is accumulated on the frontend and compiled into the final `/direction` call.
- **AI calls only where needed** — Beat 1 thinking copy is a lookup, not an AI call. Beat 2 follow-up detection is rule-based, not AI. Only Beat 2 question, Beat 3 risk, and the final direction/regeneration calls use Groq.
- **Frontend accumulates context** — The backend does not store session state. The frontend holds all data from Beats 1–4 and sends the complete picture in the `/direction` request.

---

## 5. File-by-File Breakdown

### `server.ts` — Application Entry Point

Sets up the Express app with:
- **CORS middleware** — allows cross-origin requests from the frontend
- **JSON body parser** — parses `application/json` request bodies
- **Health check** — `GET /health` returns `{ status: "ok", service: "thoughtly-backend" }`
- **Route mounting** — all gift endpoints mounted under `/api/gift`
- **Server start** — listens on `PORT` from env (default 3000)

### `types.ts` — TypeScript Interfaces

Defines strict types for every request and response in the system:

| Type | Purpose |
|---|---|
| `MOOD_SIGNALS` | The 4 hardcoded mood cards (const array) |
| `MoodSignal` | Union type of the 4 valid mood strings |
| `SocialRiskLevel` | `"high" \| "medium" \| "low"` |
| `Beat1Request` / `Beat1Response` | Mood selection → thinking copy |
| `Beat2QuestionRequest` / `Beat2QuestionResponse` | Name + mood → generated question |
| `Beat2FollowupRequest` / `Beat2FollowupResponse` | User's answer → thin detection + thinking copy |
| `Beat3RiskRequest` / `Beat3RiskResponse` | Occasion intent → inferred risk + thinking copy |
| `GiftInput` | All accumulated context for final direction generation |
| `GiftOutput` | The 3-key output: direction, examples[3], why_note |
| `GiftExample` | `{ item: string, reason: string }` |
| `RegenerateRequest` | Original input + output + feedback text |
| `RegenerateResponse` | Revised direction (same shape as GiftOutput) |

### `validation.ts` — Input Validation

Six validation functions, one per endpoint type. Each returns `string | null` — null means valid, string is the error message.

| Function | Validates | Key Rules |
|---|---|---|
| `validateBeat1` | mood_signal | Array of 1–2 strings |
| `validateBeat2Question` | recipient_name, mood_signal | Non-empty name, non-empty mood array |
| `validateBeat2Followup` | beat2_response | Must be a string (can be empty — thin input is handled separately) |
| `validateBeat3Risk` | beat3_intent | Non-empty string |
| `validateGiftInput` | All 6 fields | Full validation of the compiled context |
| `validateRegenerate` | original_input, original_output, feedback | Nested validation of original_input via `validateGiftInput` |

Also exports `castToGiftInput(body)` — a type assertion helper used after validation.

### `prompt.ts` — Prompts, Thinking States, and Detection Logic

This is the largest and most important file. It contains:

**Thinking State Copy (hardcoded per spec):**
- `BEAT1_THINKING_COPY` — a `Record<string, string>` mapping each mood signal to its thinking copy
- `BEAT2_THINKING_THIN` / `BEAT2_THINKING_RICH` — conditional thinking copy based on response length
- `BEAT3_THINKING` — fixed copy
- `BEAT4_THINKING_SEQUENCE` — array of 3 strings, displayed sequentially over 4–5 seconds

**Prompt Builders (functions that return the prompt string):**
- `buildBeat2QuestionSystemPrompt()` — instructs the model to generate one perceptive question
- `buildBeat2QuestionUserPrompt(name, moods)` — injects recipient name and mood signals
- `buildRiskInferenceSystemPrompt()` — instructs the model to classify risk as high/medium/low
- `buildRiskInferenceUserPrompt(intent)` — injects the giver's occasion intent
- `buildSystemPrompt()` — the main Thoughtly system prompt (exact spec language from Section 4)
- `buildUserPrompt(input)` — compiles all 6 fields into the user prompt
- `buildRegenerateSystemPrompt()` — instructs revision based on feedback
- `buildRegenerateUserPrompt(input, originalDirection, feedback)` — injects original context + feedback

**Thin Input Detection (rule-based, no AI):**
- `isThinInput(response)` — returns `true` if response is under 15 words OR contains a known non-answer
- `isRichInput(response)` — returns `true` if response is over 40 words
- `NON_ANSWERS` — list of phrases like "idk", "not sure", "nothing comes to mind"
- `THIN_INPUT_FOLLOWUP` — the fixed follow-up text: `"Say more if you can — even something small helps."`

### `groq.service.ts` — Groq API Integration

Four async functions, each calling the Groq API:

| Function | Groq Call | Temperature | Max Tokens | Response Format |
|---|---|---|---|---|
| `generateBeat2Question()` | Single completion | 0.8 (creative) | 150 | Plain text |
| `inferSocialRisk()` | Single completion | 0.2 (deterministic) | 10 | Plain text (one word) |
| `generateGiftDirection()` | Up to 2 attempts | 0.7 | 1024 | `json_object` |
| `regenerateDirection()` | Up to 2 attempts | 0.7 | 1024 | `json_object` |

Key behaviors:
- **Retry logic** — `generateGiftDirection` and `regenerateDirection` retry once on malformed JSON, invalid structure, or failed self-validation
- **Self-validation** — Before returning, checks if the Direction contains significant words from the user's Beat 2 response or memory (see Section 12)
- **Graceful fallback** — Risk inference defaults to `"medium"` if the model returns an unexpected value

### `route.ts` — API Endpoints

Seven endpoints, all under the `/api/gift` prefix:

| Method | Path | AI Call? | Purpose |
|---|---|---|---|
| POST | `/beat1/think` | No | Returns thinking copy for selected mood(s) |
| POST | `/beat2/question` | **Yes** | Generates the unexpected question |
| POST | `/beat2/followup` | No | Detects thin input, returns follow-up if needed |
| POST | `/beat3/risk` | **Yes** | Infers social risk level from occasion intent |
| GET | `/beat4/think` | No | Returns the 3-line thinking sequence |
| POST | `/direction` | **Yes** | Generates the final gift direction |
| POST | `/regenerate` | **Yes** | Revises direction based on "what feels off" feedback |

---

## 6. The Conversation Flow (Beats 1–4)

The product is a 4-beat conversation. Each beat collects a piece of context. After all 4 beats, the backend generates the final output in a single call.

### Beat 1 — Mood Recognition

**What happens:** The frontend shows 4 hardcoded mood/vibe cards. The user picks 1 or 2.

**The 4 cards (hardcoded, never AI-generated):**
1. "Quiet and interior"
2. "Loud and full of life"
3. "Precise about everything"
4. "Warm and a little scattered"

**Backend's role:** Returns a thinking state copy string based on the selected card(s). No AI call.

**Frontend timing:** Display the thinking copy for a minimum of 2.5 seconds, even if the response arrives instantly.

### Beat 2 — The Unexpected Question

**What happens:** The AI generates one question that feels like it came from a perceptive friend. This is the hardest part of the product.

**Quality bar:** If the question could appear in any generic gifting app → it fails. It must feel specific to this mood/relationship.

**Two sub-calls:**
1. `POST /beat2/question` — generates the question
2. After the user answers → `POST /beat2/followup` — checks if the answer is thin

**Thin input handling:**
- If thin → return a follow-up: "Say more if you can — even something small helps."
- Only one follow-up ever. If still thin → move forward. Never make the user feel inadequate.

### Beat 3 — Occasion Intent

**Prompt (fixed, not AI-generated):** "What do you want [name] to feel when they open this?"

**Backend's role:** Takes the user's response and uses Groq to infer the social risk level (`high` / `medium` / `low`). This determines how specific vs. directional the output will be.

### Beat 4 — Optional Memory

**Prompt (fixed):** "If there's a moment or conversation with [name] that's been on your mind lately — even something small — I'd love to hear it."

**Skip behavior:** If the user skips → move to output generation with Beats 1–3 context only. Do NOT degrade output quality. The AI must work with what it has.

**Why this matters:** Even a one-sentence memory gives the AI a specific reference to build from. When provided, this gets prioritized over everything else.

---

## 7. API Reference — All Endpoints

### `GET /health`

Health check. No auth required.

**Response:**
```json
{ "status": "ok", "service": "thoughtly-backend" }
```

---

### `POST /api/gift/beat1/think`

Returns the thinking state copy for the user's mood selection. No AI call — this is a lookup.

**Request:**
```json
{
  "mood_signal": ["Quiet and interior"]
}
```

**Validation rules:**
- `mood_signal` — required, array of 1–2 strings

**Response:**
```json
{
  "thinking_copy": "Thinking about someone who holds things carefully..."
}
```

**Thinking copy by mood:**

| Mood Signal | Thinking Copy |
|---|---|
| Quiet and interior | "Thinking about someone who holds things carefully..." |
| Loud and full of life | "Thinking about someone who fills a room..." |
| Precise about everything | "Thinking about someone who notices everything..." |
| Warm and a little scattered | "Thinking about someone who loves deeply and loses their keys..." |

If two moods are selected, the copies are concatenated with a space.

---

### `POST /api/gift/beat2/question`

Generates the "unexpected question" — the most important AI call in the product.

**Request:**
```json
{
  "recipient_name": "Anya",
  "mood_signal": ["Quiet and interior"]
}
```

**Validation rules:**
- `recipient_name` — required, non-empty string
- `mood_signal` — required, non-empty array of strings

**Response:**
```json
{
  "question": "What's something she does that nobody else notices?"
}
```

**AI configuration:**
- Temperature: `0.8` (higher creativity for unique questions)
- Max tokens: `150`
- No JSON mode — returns plain text

---

### `POST /api/gift/beat2/followup`

Checks if the user's response to the Beat 2 question is "thin" (too short or a non-answer). No AI call — this is rule-based.

**Request:**
```json
{
  "beat2_response": "idk"
}
```

**Validation rules:**
- `beat2_response` — required, must be a string

**Response (thin input):**
```json
{
  "is_thin": true,
  "follow_up": "Say more if you can — even something small helps.",
  "thinking_copy": "Sitting with what you just shared..."
}
```

**Response (rich input, 40+ words):**
```json
{
  "is_thin": false,
  "follow_up": null,
  "thinking_copy": "That tells me something important about them..."
}
```

**Response (normal input, 15–40 words):**
```json
{
  "is_thin": false,
  "follow_up": null,
  "thinking_copy": "Sitting with what you just shared..."
}
```

**Detection logic:**
- Thin if: word count < 15 OR response contains a known non-answer phrase
- Rich if: word count > 40
- Known non-answers: "i don't know", "idk", "not sure", "no idea", "dunno", "nothing", "can't think", "nothing comes to mind", etc.

---

### `POST /api/gift/beat3/risk`

Takes the user's occasion intent and uses Groq to infer the social risk level.

**Request:**
```json
{
  "beat3_intent": "I want her to feel like this birthday means something"
}
```

**Validation rules:**
- `beat3_intent` — required, non-empty string

**Response:**
```json
{
  "social_risk_level": "high",
  "thinking_copy": "Almost there. One last thing, if you're open to it..."
}
```

**Risk classification rules (briefed to the AI):**

| Level | Signals |
|---|---|
| `high` | Birthday, anniversary, milestone. Words like "special", "important", "celebrate", "remember forever" |
| `medium` | Festival, group occasion, thank you. Moderate emotional weight |
| `low` | Informal, spontaneous, "just because", casual. Low stakes |

**AI configuration:**
- Temperature: `0.2` (deterministic — this is a classification, not generation)
- Max tokens: `10`
- Fallback: if the model returns something unexpected, defaults to `"medium"`

---

### `GET /api/gift/beat4/think`

Returns the fixed, multi-line thinking sequence for Beat 4. No request body. No AI call.

**Response:**
```json
{
  "thinking_sequence": [
    "Pulling together everything you shared...",
    "Finding what makes this gift yours to give...",
    "Almost ready."
  ]
}
```

**Frontend timing:** Display these sequentially over 4–5 seconds total. This is the most important thinking state. The user must feel that something real was made, not retrieved.

---

### `POST /api/gift/direction`

The main event. Takes all accumulated context from Beats 1–4 and generates the final gift direction.

**Request:**
```json
{
  "recipient_name": "Anya",
  "mood_signal": ["Quiet and interior"],
  "beat2_response": "She keeps talking about how she misses our road trips from college, especially the one to Jaipur where we got lost and found that tiny bookstore.",
  "beat3_intent": "I want her to feel like I still remember those days",
  "social_risk_level": "high",
  "memory": "She bought a hand-painted bookmark from that Jaipur bookstore and still uses it"
}
```

**Validation rules:**
- `recipient_name` — required, non-empty string
- `mood_signal` — required, non-empty array of strings
- `beat2_response` — required, non-empty string
- `beat3_intent` — required, non-empty string
- `social_risk_level` — required, must be `"high"`, `"medium"`, or `"low"`
- `memory` — required, string (use `"none provided"` if skipped)

**Response:**
```json
{
  "direction": "She's holding onto those college road trips not because she misses travelling — she misses the version of your friendship that was spontaneous and unplanned. The Jaipur bookstore, the hand-painted bookmark she still uses — these are artifacts of a time when things happened by accident and felt perfect. Your gift should recreate that feeling: something found, not chosen from a catalogue. Something that says 'I was somewhere and this made me think of that afternoon we got lost.'",
  "examples": [
    {
      "item": "A hand-bound travel journal from a local artisan",
      "reason": "Echoes the handmade quality of the bookmark she treasures, and gives her somewhere to carry new memories."
    },
    {
      "item": "A vintage map print of Jaipur's old city",
      "reason": "Makes the shared memory physical — something she can frame and see every day."
    },
    {
      "item": "A curated box of teas or spices from a Rajasthani shop",
      "reason": "Something discovered, not mass-produced — matches the serendipity of finding that bookstore."
    }
  ],
  "why_note": "I was thinking about that afternoon in Jaipur — the bookstore we found by accident, the bookmark you still use. This felt like the right way to say I remember all of it."
}
```

**AI configuration:**
- Temperature: `0.7`
- Max tokens: `1024`
- Response format: `json_object` (Groq structured output)
- Up to 2 attempts (retry once on failure)
- Self-validation before returning (see Section 12)

---

### `POST /api/gift/regenerate`

Used when the user clicks "This doesn't feel right" on the output screen.

**Request:**
```json
{
  "original_input": {
    "recipient_name": "Anya",
    "mood_signal": ["Quiet and interior"],
    "beat2_response": "She keeps talking about road trips...",
    "beat3_intent": "I want her to feel remembered",
    "social_risk_level": "high",
    "memory": "The Jaipur bookstore bookmark"
  },
  "original_output": {
    "direction": "...(the direction that felt wrong)...",
    "examples": [
      { "item": "...", "reason": "..." },
      { "item": "...", "reason": "..." },
      { "item": "...", "reason": "..." }
    ],
    "why_note": "..."
  },
  "feedback": "It feels too formal, we have a casual relationship"
}
```

**Validation rules:**
- `original_input` — required, validated with same rules as `/direction`
- `original_output` — required, must be an object
- `feedback` — required, non-empty string

**Response:** Same shape as `/direction`. The AI is instructed to revise the Direction based on the feedback, keeping examples and why_note unless the feedback suggests they are also wrong.

---

## 8. Prompt Engineering — How the AI Thinks

### System Prompt (Final Direction)

The system prompt is the exact language from the product spec, Section 4. Key identity framing:

> *"You are Thoughtly — a gifting companion that helps people trust their own judgment about what to give. Your job is not to recommend products. Your job is to surface what the giver already knows about their relationship."*

The prompt explicitly tells the model:
- You are **not** a search engine
- You are **not** a recommendation engine
- **Never** use category language ("something for self-care", "an experience gift")
- **Never** suggest more than 3 items
- **Every** output must be specific to **this** relationship
- If the output could apply to any caring relationship → **you have failed**

### System Prompt (Beat 2 Question)

Tuned for creativity. The key quality bar:

> *"The question must feel like it came from a perceptive friend who was already listening. Not a survey. Not a form field."*

Example calibrations are provided per mood signal so the model understands the expected depth.

### System Prompt (Risk Inference)

Minimal and classification-focused. Only returns one word. Temperature is set to 0.2 for consistency.

### System Prompt (Regeneration)

Instructs the model to revise the Direction specifically, keeping examples and why_note stable unless the feedback says otherwise.

### User Prompt Template

After all 4 beats, the frontend compiles context and the backend builds:

```
The giver is buying a gift for: [name]
Mood signal selected: [mood card(s)]
Their response to the unexpected question: [Beat 2 response]
What they want the recipient to feel: [Beat 3 response]
Social risk level (inferred): [high / medium / low]
Memory or moment shared (optional): [Beat 4 response, or "none provided"]
```

---

## 9. The Anchor Framework

Everything the AI does is in service of finding **one** anchor. The system prompt briefs the model on all four:

| Anchor Type | Definition | When It Surfaces |
|---|---|---|
| **Explicit Request** | The recipient mentioned wanting something specific | Beat 2 response mentions "she said she wanted..." |
| **Relational Specificity** | An inside joke, shared memory, something only these two understand | Beat 4 memory is provided |
| **Giver-Centric** | Something the giver loves and wants to share | Beat 2 response is about the giver's perspective |
| **High Sacrifice** | The effort of finding something specific signals care | Beat 3 intent shows high stakes, Beat 2 is thin |

The AI picks the **strongest** available anchor. If a memory is provided (Beat 4), it almost always becomes The Anchor — it is the most relationally specific signal.

---

## 10. Thin Input Detection & Follow-Up Logic

**Location:** `prompt.ts` — `isThinInput()` and `isRichInput()` functions

This is entirely **rule-based** — no AI call. The logic:

```
IF word count < 15 → thin
IF response contains known non-answer → thin
IF word count > 40 → rich
ELSE → normal
```

**Known non-answer phrases:**
- "i don't know", "idk", "not sure", "no idea", "dunno"
- "nothing", "can't think", "cant think"
- "i'm not sure", "im not sure", "nothing comes to mind"

**Follow-up behavior:**
- ONE follow-up only: "Say more if you can — even something small helps."
- If still thin after follow-up → accept and move forward
- Never issue a second follow-up. Never make the user feel inadequate.

**Thinking copy response:**
- Thin/normal input → "Sitting with what you just shared..."
- Rich input (40+ words) → "That tells me something important about them..."

---

## 11. Social Risk Inference

**Location:** `groq.service.ts` — `inferSocialRisk()` function

The AI classifies the giver's occasion intent into one of three levels. This classification drives the **tone** of the final output:

| Risk Level | Tone | AI Behavior |
|---|---|---|
| `high` | Specific and reassuring | More concrete examples, emotionally grounded direction |
| `medium` | Balanced and confident | Moderate specificity, relatable reasoning |
| `low` | Lighter and permissive | Flexible suggestions, lower-stakes language |

**Fallback:** If Groq returns something unexpected (not high/medium/low), defaults to `"medium"` with a console warning.

---

## 12. Output Self-Validation

**Location:** `groq.service.ts` — `passesContentValidation()` function

Before returning the gift direction, the backend checks if the Direction text actually references the user's input. This prevents generic outputs.

**How it works:**
1. Extract significant words (4+ characters) from `beat2_response` and `memory`
2. Filter out stop words (common filler: "that", "this", "with", "about", etc.)
3. Check how many of those significant words appear in the Direction
4. If **2 or more** significant words match → validation passes
5. If not → retry (on first attempt) or accept with warning (on second attempt)

**Example:**
- User said: "She keeps talking about **road trips** from **college**, especially the one to **Jaipur** where we found that tiny **bookstore**"
- Significant words: `["keeps", "talking", "road", "trips", "college", "especially", "jaipur", "found", "tiny", "bookstore"]`
- Direction must contain at least 2 of these

---

## 13. Retry & Error Handling

### Retry Logic (Direction & Regeneration)

Both `generateGiftDirection()` and `regenerateDirection()` implement a **retry-once** pattern:

```
Attempt 1:
  → Call Groq
  → If empty response → retry
  → If malformed JSON → log warning, retry
  → If invalid structure → log warning, retry
  → If fails self-validation → log warning, retry

Attempt 2:
  → Call Groq
  → If any failure → throw error (surface to frontend)
  → If fails self-validation → accept with warning (better than failure)
```

### Error Response Format

All error responses follow the same shape:

```json
{
  "error": "Human-readable error message"
}
```

| Scenario | HTTP Status | Error Message |
|---|---|---|
| Invalid request body | 400 | Specific validation error (which field, what's wrong) |
| Groq returns empty | 500 | "Groq returned empty response." |
| Malformed JSON after retry | 500 | "Failed to parse Groq response as JSON after retry: [first 200 chars]" |
| Invalid structure after retry | 500 | "Groq response does not match expected GiftOutput structure." |
| Groq API error | 500 | Error message from Groq SDK |

**Frontend behavior on 500:** Show "Something went wrong. Let's try again." and restart the final thinking state (Beat 4).

---

## 14. Regeneration Flow ("This doesn't feel right")

This handles the post-output "This doesn't feel right" interaction from the spec.

**Trigger:** User clicks a quiet text link below the Direction. Frontend opens a text prompt: "What feels off?"

**How it works:**
1. Frontend sends `original_input` (same data as the `/direction` call), `original_output` (the output that felt wrong), and `feedback` (what the user typed)
2. Backend builds a regeneration prompt that includes:
   - All original context (name, mood, beat2, beat3, memory)
   - The Direction that felt wrong (quoted)
   - The user's feedback (quoted)
3. AI is instructed: revise the Direction. Keep examples and why_note unless the feedback suggests they are wrong too.
4. Returns the same `{ direction, examples, why_note }` structure

**Important:** This does NOT restart the full flow. The user is not asked to answer beats again.

---

## 15. Thinking State Copy — Full Reference

Thinking states are UX-critical. They make the AI feel like it is genuinely processing, not just fetching.

| Beat | Copy | Source | Timing |
|---|---|---|---|
| Beat 1 | "Thinking about someone who holds things carefully..." (varies by mood) | Hardcoded lookup | Min 2.5s display |
| Beat 1 (2 moods) | Both copies concatenated | Hardcoded lookup | Min 2.5s display |
| Beat 2 (thin/normal) | "Sitting with what you just shared..." | Hardcoded | Standard |
| Beat 2 (rich, 40+ words) | "That tells me something important about them..." | Hardcoded | Standard |
| Beat 3 | "Almost there. One last thing, if you're open to it..." | Hardcoded | Standard |
| Beat 4 (line 1) | "Pulling together everything you shared..." | Hardcoded | |
| Beat 4 (line 2) | "Finding what makes this gift yours to give..." | Hardcoded | 4–5s total |
| Beat 4 (line 3) | "Almost ready." | Hardcoded | |

---

## 16. What Good Output Looks Like

**Direction:**
- References something the user actually said (a place, a name, a habit, a memory)
- 3–5 sentences
- Warm, specific, relational language
- The giver reads it and thinks "yes, that's exactly it"

**Examples:**
- Feel like footnotes to the Direction, not separate suggestions
- Each one has a 1-sentence reason that traces back to the Direction
- No random or generic items

**Why Note:**
- Contains the specific anchor (the memory, the inside reference, the thing the giver shared)
- Sounds like something a real person could copy-paste into a card
- NOT: "I got this because I know you so well" (generic)
- YES: "I was thinking about that afternoon in Jaipur — the bookstore we found by accident" (specific)

**The Rejection Test:** Read the Direction out loud. If it sounds like it could appear in a gifting app ad → it fails. If it sounds like something a very perceptive friend said after listening carefully → it is right.

---

## 17. What Bad Output Looks Like (Fail Conditions)

The output is rejected if:

- **Generic** — could apply to any caring relationship
- **Category language** — "something for self-care", "an experience gift", "something practical"
- **No user reference** — does not contain any word or idea from what the user shared
- **Shopping suggestions** — sounds like product recommendations, not a direction
- **Interchangeable** — two different relationships with similar inputs produce identical output
- **Vague why_note** — "I got this because you mean a lot to me" (could be sent by anyone to anyone)

---

## 18. Frontend Integration Guide

### Session Lifecycle

1. User enters recipient name → store client-side
2. **Beat 1:** Show 4 mood cards → on selection, call `POST /beat1/think` → display thinking copy for 2.5s+
3. **Beat 2:** Call `POST /beat2/question` → display question → user answers → call `POST /beat2/followup` → if thin, show follow-up once, accept second answer regardless
4. **Beat 3:** Show fixed prompt "What do you want [name] to feel when they open this?" → user answers → call `POST /beat3/risk` → store `social_risk_level` → display thinking copy
5. **Beat 4:** Show fixed prompt about memory → user answers or skips → call `GET /beat4/think` → display thinking sequence over 4–5s
6. **Final:** Compile all context → call `POST /direction` → render output
7. **(Optional)** User clicks "This doesn't feel right" → show text prompt → call `POST /regenerate`

### Context the Frontend Must Accumulate

```typescript
// The frontend builds this object over 4 beats:
{
  recipient_name: string,       // entered before Beat 1
  mood_signal: string[],        // Beat 1 selection (1-2 items)
  beat2_response: string,       // Beat 2 user answer (final, after follow-up if any)
  beat3_intent: string,         // Beat 3 user answer
  social_risk_level: string,    // from POST /beat3/risk response
  memory: string                // Beat 4 user answer, or "none provided" if skipped
}
```

### Post-Output Actions

| Action | Behavior |
|---|---|
| "Start over" | Text link, left side. Resets all state. No confirmation. |
| "Copy the note" | Pill button, right side. Copies `why_note` string to clipboard. |
| "This doesn't feel right" | Quiet text link below Direction. Opens feedback prompt → calls `/regenerate`. |

---

## 19. MVP Hard Limits — What NOT to Build

These are explicitly out of scope. Do not build them:

- ❌ User accounts or login
- ❌ Relationship persona / memory across sessions
- ❌ Persistent storage / database
- ❌ Marketplace or product links
- ❌ Price range inputs
- ❌ Social sharing features
- ❌ Group gifting
- ❌ Acquaintance or colleague gifting flow
- ❌ Any feature that turns this into a recommendation engine

> If a feature is not in this document, it is not in the MVP.

---

*Thoughtly — Internal Technical Reference — MVP v1.0*
