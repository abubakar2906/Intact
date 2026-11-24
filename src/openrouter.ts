// Asks a model through OpenRouter, so one API key reaches every model. The key comes from OPENROUTER_API_KEY and is never written anywhere.
export type Reply = { text: string; servedBy: string; inputTokens: number; outputTokens: number };

export async function ask(model: string, content: string): Promise<Reply> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('Set OPENROUTER_API_KEY first.');
  let last = '';
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', 'x-title': 'Intact' },
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
