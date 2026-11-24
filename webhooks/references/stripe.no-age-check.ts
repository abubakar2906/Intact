// Broken on purpose: checks the signature but never the age, so old webhooks can be replayed.
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verify(rawBody: string, headers: Record<string, string | undefined>, secret: string): boolean {
  const header = headers['stripe-signature'];
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  if (!parts.t || !parts.v1) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex'));
  const given = Buffer.from(parts.v1);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
