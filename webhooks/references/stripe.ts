// The correct Stripe verifier, following Stripe's documented scheme. Every case must pass against this.
import { createHmac, timingSafeEqual } from 'node:crypto';

const TOLERANCE_SECONDS = 300;

export function verify(rawBody: string, headers: Record<string, string | undefined>, secret: string): boolean {
  const header = headers['stripe-signature'];
  if (!header) return false;

  let timestamp: number | null = null;
  const v1: string[] = [];
  for (const part of header.split(',')) {
    const i = part.indexOf('=');
    if (i < 1) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (key === 't') timestamp = Number(value);
    if (key === 'v1') v1.push(value);
  }
  if (timestamp === null || !Number.isFinite(timestamp) || v1.length === 0) return false;
  if (Math.floor(Date.now() / 1000) - timestamp > TOLERANCE_SECONDS) return false;

  const expected = Buffer.from(createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex'), 'utf8');
  return v1.some((sig) => {
    const given = Buffer.from(sig, 'utf8');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
