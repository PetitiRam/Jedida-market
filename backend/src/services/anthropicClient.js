// Thin wrapper around the Anthropic Messages API. Every AI "bot" in this
// codebase (Nsubuga Joseph, Colline, PETITI, TAUSI) currently uses
// deterministic heuristics so the platform works end-to-end without any
// API key. This client is the single real integration point — call
// `askClaude()` from any bot to upgrade it to genuine LLM reasoning; when
// ANTHROPIC_API_KEY isn't set, callers should catch the thrown error and
// fall back to their deterministic logic (see nsubugaJosephBot.js for the
// reference pattern).

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

export function isClaudeConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {object} [opts] - { maxTokens, jsonMode }
 * @returns {Promise<string>} the model's text response
 */
export async function askClaude(systemPrompt, userMessage, opts = {}) {
  if (!isClaudeConfigured()) {
    throw new Error('ANTHROPIC_API_KEY is not configured.');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: opts.maxTokens || 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((b) => b.type === 'text');
  return textBlock?.text || '';
}

/**
 * Same as askClaude but parses the response as JSON. Instructs the model to
 * return only JSON, and throws if parsing fails so callers can fall back.
 */
export async function askClaudeForJson(systemPrompt, userMessage, opts = {}) {
  const strictSystem = `${systemPrompt}\n\nRespond with ONLY valid JSON. No markdown fences, no preamble, no explanation.`;
  const text = await askClaude(strictSystem, userMessage, opts);
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}
