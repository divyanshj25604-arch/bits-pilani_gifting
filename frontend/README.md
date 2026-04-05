# Thoughtly — Frontend

React 18 frontend for Thoughtly. Points to the Node/Express backend.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env — set REACT_APP_API_URL to your backend URL
npm start
```

## Build

```bash
npm run build
```

## Environment

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:3000` | Backend base URL |

## Structure

```
src/
├── App.js                  # Surface orchestration (pre / conversation / output)
├── api.js                  # All backend API calls
├── utils.js                # Thin input detection, question validation, cleaning, risk inference
├── index.css               # CSS variables, animations, dark/light theme
├── hooks/
│   └── useSession.js       # Session state shape
└── components/
    ├── PreConversation.js  # Surface 1 — name input + begin
    ├── ConversationSurface.js # Surface 2 — all 4 beats + thinking states
    ├── OutputSurface.js    # Surface 3 — direction, examples, why note, actions
    ├── ThemeToggle.js
    ├── Wordmark.js
    ├── MoodCard.js
    ├── ThinkingState.js
    ├── ThinkingState4.js   # Multi-line sequential, 5s minimum
    ├── ThinkingDots.js
    ├── TextInput.js
    ├── SendIcon.js
    ├── ConversationMessage.js
    └── UserResponse.js
```
