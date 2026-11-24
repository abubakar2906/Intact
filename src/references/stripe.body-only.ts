// Broken on purpose: signs the body alone, leaving out the "<timestamp>." prefix Stripe signs.
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verify(rawBody: string, headers: Record<string, string | undefined>, secret: string): boolean {
  const header = headers['stripe-signature'];
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  if (!parts.t || !parts.v1) return false;
  if (Math.floor(Date.now() / 1000) - Number(parts.t) > 300) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('hex'));
  const given = Buffer.from(parts.v1);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
