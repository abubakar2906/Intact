// Asks a model through any service that speaks the OpenAI chat format. OpenRouter is the default.
// Set INTACT_BASE_URL and INTACT_API_KEY to use another one (Groq, Gemini, a local Ollama). Keys are read from the
// environment and never written anywhere.
export type Reply = { text: string; servedBy: string; inputTokens: number; outputTokens: number };

const BASE_URL = (process.env.INTACT_BASE_URL ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '');
const KEY = process.env.INTACT_API_KEY ?? process.env.OPENROUTER_API_KEY;
// A local Ollama needs no key. Everything else does.
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(BASE_URL);

export async function ask(model: string, content: string): Promise<Reply> {
  if (!KEY && !LOCAL) throw new Error('Set OPENROUTER_API_KEY, or INTACT_BASE_URL and INTACT_API_KEY for another service.');
  let last = '';
  for (let attempt = 0; attempt < 4; attempt++) {
    // Free tiers rate-limit hard, so wait longer each time: 4s, 8s, 16s.
    if (attempt) await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { ...(KEY ? { authorization: `Bearer ${KEY}` } : {}), 'content-type': 'application/json', 'x-title': 'Intact' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content }] }),
    });
    // Rate limits and server errors are worth retrying. Anything else (a bad model id, no credit) is not.
    if (res.status === 429 || res.status >= 500) { last = `${res.status} ${await res.text()}`; continue; }
    const body = await res.json() as any;
    if (!res.ok || body.error) throw new Error(`${model}: ${res.status} ${JSON.stringify(body.error ?? body).slice(0, 300)}`);
    return {
      text: body.choices?.[0]?.message?.content ?? '',
      servedBy: body.model ?? model,
      inputTokens: body.usage?.prompt_tokens ?? 0,
      outputTokens: body.usage?.completion_tokens ?? 0,
    };
  }
  throw new Error(`${model}: gave up after retries (${last.slice(0, 200)})`);
}
