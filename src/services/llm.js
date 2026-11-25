/*
 * Live language model (optional). The browser never holds an API key: it calls /api/ai/*, and the web
 * server adds the key (Caddyfile in production, the dev plugin in vite.config.js locally).
 *   GET  /api/ai/status → { live: true|false }
 *   POST /api/ai/chat   → OpenAI-compatible chat completion (Groq free tier by default)
 * When the key is not set — or the free quota runs out — every AI feature falls back to the demo heuristics.
 */
export const AI_MODEL = import.meta.env.VITE_AI_MODEL || 'openai/gpt-oss-20b';
export const AI_PROVIDER = 'Groq';

let statusPromise = null;

/** Is a real model connected? Cached for the session. */
export function llmStatus() {
  if (!statusPromise) {
    statusPromise = fetch('/api/ai/status', { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { live: false }))
      .then((j) => ({ live: j?.live === true, model: AI_MODEL, provider: AI_PROVIDER }))
      .catch(() => ({ live: false })); // static hosting / preview: index.html comes back → not JSON
  }
  return statusPromise;
}

export class LlmError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code; // 'rateLimit' | 'offline' | 'failed'
  }
}

/** One chat completion. `messages` = [{ role: 'system'|'user'|'assistant', content }]. Returns the reply text. */
export async function chat(messages, { maxTokens = 700, temperature = 0.4, signal } = {}) {
  let res;
  try {
    res = await fetch('/api/ai/chat', {
      method: 'POST',
      // The custom header forces a CORS preflight, so other websites can't use this proxy from a browser.
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'template-crm' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature,
        max_completion_tokens: maxTokens,
        reasoning_effort: 'low', // gpt-oss: think briefly; answers in ~1 s
        include_reasoning: false,
      }),
      signal,
    });
  } catch {
    throw new LlmError('offline');
  }
  if (res.status === 429) throw new LlmError('rateLimit');
  if (!res.ok) throw new LlmError('failed', `HTTP ${res.status}`);
  const json = await res.json().catch(() => null);
  const text = json?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new LlmError('failed', 'empty reply');
  return text;
}
