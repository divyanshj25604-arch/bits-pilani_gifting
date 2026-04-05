const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

async function apiCall(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

export async function beat1Think(moodSignal) {
  return apiCall('POST', '/api/gift/beat1/think', { mood_signal: moodSignal });
}

export async function beat2Question(recipientName, moodSignal) {
  return apiCall('POST', '/api/gift/beat2/question', {
    recipient_name: recipientName,
    mood_signal: moodSignal,
  });
}

export async function beat2Followup(beat2Response) {
  return apiCall('POST', '/api/gift/beat2/followup', { beat2_response: beat2Response });
}

export async function beat3Risk(beat3Intent) {
  return apiCall('POST', '/api/gift/beat3/risk', { beat3_intent: beat3Intent });
}

export async function beat4Think() {
  return apiCall('GET', '/api/gift/beat4/think');
}

export async function generateDirection(giftInput) {
  return apiCall('POST', '/api/gift/direction', giftInput);
}

export async function regenerateDirection(originalInput, originalOutput, feedback) {
  return apiCall('POST', '/api/gift/regenerate', {
    original_input: originalInput,
    original_output: originalOutput,
    feedback,
  });
}
