// ─── Thin Input Detection ───────────────────────────────────────────────────
const NON_ANSWERS = [
  "i don't know", "idk", "not sure", "no idea", "dunno",
  "nothing", "can't think", "cant think", "i'm not sure",
  "im not sure", "nothing comes to mind", "i don't know her that well",
  "i don't know him that well", "i don't know them that well",
];

export function isThinInput(response) {
  if (!response || typeof response !== 'string') return true;
  const trimmed = response.trim().toLowerCase();
  if (trimmed.length < 15) return true;
  if (trimmed.split(/\s+/).length === 1) return true;
  return NON_ANSWERS.some(na => trimmed.includes(na));
}

export function isRichInput(response) {
  if (!response || typeof response !== 'string') return false;
  return response.trim().split(/\s+/).length > 40;
}

// ─── Name / Possessive Formatting ────────────────────────────────────────────
export function formatNameForPrompt(input) {
  const trimmed = input.trim();
  // Starts with capital → treat as proper name
  if (trimmed[0] === trimmed[0].toUpperCase() && /[A-Z]/.test(trimmed[0])) {
    return trimmed;
  }
  if (trimmed.toLowerCase().startsWith('my ')) return trimmed;
  return `your ${trimmed}`;
}

export function formatNameDirect(input) {
  return input.trim();
}

// ─── Social Risk Inference (local, keyword-based) ────────────────────────────
const HIGH_SIGNALS = ['birthday', 'anniversary', 'special', 'important', 'milestone',
  'celebrate', 'surprise', 'marking', 'first', 'remember', 'forever'];
const MEDIUM_SIGNALS = ['diwali', 'holi', 'festival', 'thank you', 'appreciate',
  'christmas', 'eid', 'occasion', 'holiday'];
const LOW_SIGNALS = ['just because', 'random', 'no reason', 'thinking of',
  'felt like it', 'spontaneous', 'small'];

export function inferSocialRisk(beat3Response) {
  const lower = beat3Response.toLowerCase();
  const isHigh = HIGH_SIGNALS.some(s => lower.includes(s));
  const isLow = LOW_SIGNALS.some(s => lower.includes(s));
  const isMed = MEDIUM_SIGNALS.some(s => lower.includes(s));
  if (isHigh) return 'high';
  if (isMed) return 'medium';
  if (isLow) return 'low';
  return 'medium';
}

// ─── Beat 2 Question Validation ──────────────────────────────────────────────
const FORBIDDEN_WORDS = ['gift', 'present', 'buy', 'purchase', 'shop', 'recommend', 'suggest', 'product'];
const YES_NO_STARTS = ['Do ', 'Does ', 'Did ', 'Is ', 'Are ', 'Was ', 'Were ',
  'Have ', 'Has ', 'Had ', 'Can ', 'Could ', 'Would ', 'Should ', 'Will '];
const BAD_STARTS = ['Please ', 'Can you tell me', 'I would like to know', 'Could you share'];
const BAD_PHRASES = ['occasion', 'budget', 'price', 'cost', 'expensive', 'cheap', 'category', 'type of gift'];

const FALLBACK_QUESTIONS = {
  'Quiet and interior': "What's something they do that nobody else notices?",
  'Loud and full of life': "When did they last genuinely surprise you?",
  'Precise about everything': "What would they buy themselves if they stopped being practical for a day?",
  'Warm and a little scattered': "What do they do with a completely free afternoon when nothing is planned?",
};

export function validateQuestion(question, moodSignal) {
  if (!question || typeof question !== 'string') return getFallback(moodSignal);
  let q = question.trim();

  // Check forbidden words
  if (FORBIDDEN_WORDS.some(w => q.toLowerCase().includes(w))) return getFallback(moodSignal);
  // Yes/no starts
  if (YES_NO_STARTS.some(s => q.startsWith(s))) return getFallback(moodSignal);
  // Bad starts
  if (BAD_STARTS.some(s => q.startsWith(s))) return getFallback(moodSignal);
  // Bad phrases
  if (BAD_PHRASES.some(p => q.toLowerCase().includes(p))) return getFallback(moodSignal);
  // Word count
  const words = q.split(/\s+/).length;
  if (words < 6 || words > 30) return getFallback(moodSignal);
  // Multiple sentences
  const sentences = q.split(/[.!?]+/).filter(Boolean);
  if (sentences.length > 1) q = sentences[0].trim();
  // Ensure question mark
  if (!q.endsWith('?')) q += '?';

  return q;
}

function getFallback(moodSignal) {
  const key = Array.isArray(moodSignal) ? moodSignal[0] : moodSignal;
  return FALLBACK_QUESTIONS[key] || FALLBACK_QUESTIONS['Quiet and interior'];
}

// ─── Direction Validation ────────────────────────────────────────────────────
export function validateDirection(direction) {
  if (!direction || direction.length < 20) return false;
  const bad = ['consider getting', 'you should buy', 'a good option'];
  return !bad.some(p => direction.toLowerCase().includes(p));
}

// ─── Clean Example Text ──────────────────────────────────────────────────────
const CURRENCY_RE = /(?:Rs\.?|INR|USD|\$|£|€)\s*[\d,]+(?:\s*[-–]\s*[\d,]+)?/gi;
const PROMO_RE = /https?:\/\/\S+|www\.\S+|use code\b.*|discount\b.*|\d+%\s*off.*/gi;

export function cleanExampleItem(item) {
  if (!item) return item;
  return item.replace(CURRENCY_RE, '').replace(PROMO_RE, '').trim();
}

export function cleanExampleReason(reason) {
  if (!reason) return reason;
  return reason.replace(CURRENCY_RE, '').replace(PROMO_RE, '').trim() || '.';
}

// ─── Quality Flag (logging only) ────────────────────────────────────────────
const STOP_WORDS = new Set(['that', 'this', 'with', 'about', 'from', 'they',
  'them', 'their', 'have', 'been', 'when', 'what', 'where', 'which', 'will',
  'just', 'like', 'some', 'then', 'than', 'your', 'also', 'into', 'more']);

function significantWords(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w));
}

export function qualityFlag(beat2Response, memory, direction) {
  const words = [...significantWords(beat2Response), ...significantWords(memory)];
  const dirLower = (direction || '').toLowerCase();
  const matches = words.filter(w => dirLower.includes(w));
  if (matches.length < 2) {
    console.warn('[Thoughtly Quality] Direction may be generic — low word overlap with user input');
    return false;
  }
  return true;
}
