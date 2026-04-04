# Thoughtly — Gift Direction Engine

AI-powered backend that generates hyper-personalized gift directions using Groq (Llama 3.3 70B).

## Setup

```bash
npm install
cp .env.example .env
# Add your Groq API key to .env
```

## Run

```bash
npm run dev     # Development (hot reload)
npm run build   # Compile TypeScript
npm start       # Production
```

## API

### `POST /api/gift/direction`

**Request Body:**

```json
{
  "recipient_name": "Anya",
  "mood_signal": ["stressed", "nostalgic"],
  "beat2_response": "She keeps talking about how she misses our road trips from college, especially the one to Jaipur where we got lost and found that tiny bookstore.",
  "beat3_intent": "I want her to feel like I still remember those days",
  "social_risk_level": "high",
  "memory": "She bought a hand-painted bookmark from that Jaipur bookstore and still uses it"
}
```

**Response:**

```json
{
  "direction": "...",
  "examples": [
    { "item": "...", "reason": "..." },
    { "item": "...", "reason": "..." },
    { "item": "...", "reason": "..." }
  ],
  "why_note": "..."
}
```

### `GET /health`

Returns `{ "status": "ok", "service": "thoughtly-backend" }`

## Architecture

```
src/
├── server.ts          # Express app entry point
├── route.ts           # POST /api/gift/direction
├── groq.service.ts    # Groq API integration
├── prompt.ts          # System + user prompt builder
├── validation.ts      # Input validation
└── types.ts           # TypeScript interfaces
```
