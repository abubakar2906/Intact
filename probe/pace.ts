// Keeps each model inside its rate limits, so a run never fails for asking too fast.
// Services report what's left with every reply, in rate-limit headers. Groq sends:
//   x-ratelimit-remaining-tokens / x-ratelimit-reset-tokens     tokens left this minute, and when the minute refills
//   x-ratelimit-remaining-requests / x-ratelimit-reset-requests requests left today, and when the day refills
//   retry-after                                                 on a refusal (429): how many seconds to wait
// Before each request we wait if the last reply said there isn't room for another one.

// A wait longer than this means a daily cap. Waiting hours inside a run is pointless: stop the model and resume later.
export const LONGEST_WAIT_MS = 5 * 60_000;

export class DailyLimitError extends Error {
  model: string;
  waitMs: number;
  constructor(model: string, waitMs: number) {
    super(waitMs > 0 ? `${model} hit its daily limit. It resets in about ${formatWait(waitMs)}.` : `${model} hit its daily limit.`);
    this.model = model;
    this.waitMs = waitMs;
  }
}

type State = { readyAt: number; lastTokens: number };
const states = new Map<string, State>();
const state = (model: string) => states.get(model) ?? (states.set(model, { readyAt: 0, lastTokens: 3000 }), states.get(model)!);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function formatWait(ms: number) {
  const m = Math.round(ms / 60_000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : m >= 1 ? `${m} minute${m === 1 ? '' : 's'}` : `${Math.ceil(ms / 1000)} seconds`;
}

// "7.66s", "2m59.56s", "1h2m", "350ms", or a plain number of seconds, into milliseconds.
export function parseWait(v: string | null): number | null {
  if (!v) return null;
  const s = v.trim();
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    return n > 1e12 ? n - Date.now() : n * 1000; // some services send a reset time in epoch milliseconds
  }
  let ms = 0, found = false;
  for (const [, n, unit] of s.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)) {
    found = true;
    ms += Number(n) * { ms: 1, s: 1000, m: 60_000, h: 3_600_000 }[unit as 'ms' | 's' | 'm' | 'h'];
  }
  return found ? ms : null;
}

const num = (v: string | null) => (v === null || v === '' || isNaN(Number(v)) ? null : Number(v));

// Call before every request. Waits for room, or throws DailyLimitError when the wait would be hours.
export async function waitForRoom(model: string, log: (msg: string) => void) {
  const s = state(model);
  const wait = s.readyAt - Date.now();
  if (wait <= 0) return;
  if (wait > LONGEST_WAIT_MS) throw new DailyLimitError(model, wait);
  if (wait > 3000) log(`${model}: pausing ${formatWait(wait)} to stay inside its rate limit`);
  await sleep(wait);
}

// Call after every reply, refused or not, with the headers and the tokens the request used.
export function noteReply(model: string, headers: Headers, tokensUsed: number | null) {
  const s = state(model);
  if (tokensUsed) s.lastTokens = tokensUsed;
  let readyAt = 0;
  const tokensLeft = num(headers.get('x-ratelimit-remaining-tokens'));
  const tokensReset = parseWait(headers.get('x-ratelimit-reset-tokens'));
  // The next request carries the whole conversation so far, so it needs at least as much as the last one. Leave room.
  if (tokensLeft !== null && tokensReset !== null && tokensLeft < s.lastTokens * 1.5) readyAt = Date.now() + tokensReset + 500;
  const requestsLeft = num(headers.get('x-ratelimit-remaining-requests') ?? headers.get('x-ratelimit-remaining'));
  const requestsReset = parseWait(headers.get('x-ratelimit-reset-requests') ?? headers.get('x-ratelimit-reset'));
  if (requestsLeft !== null && requestsReset !== null && requestsLeft < 1) readyAt = Math.max(readyAt, Date.now() + requestsReset + 500);
  s.readyAt = readyAt;
}

// After a refusal (429): how long to wait before trying again.
export function refusalWait(model: string, headers: Headers, attempt: number): number {
  const said = parseWait(headers.get('retry-after')) ?? parseWait(headers.get('x-ratelimit-reset-tokens')) ?? parseWait(headers.get('x-ratelimit-reset'));
  const wait = (said ?? Math.min(60_000, 2000 * 2 ** attempt)) + 500;
  state(model).readyAt = Date.now() + wait;
  return wait;
}
