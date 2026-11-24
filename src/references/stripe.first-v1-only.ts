// Broken on purpose: reads one v1 signature only, so webhooks sent during a secret rotation can be rejected.
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verify(rawBody: string, headers: Record<string, string | undefined>, secret: string): boolean {
  const header = headers['stripe-signature'];
  if (!header) return false;
  const t = header.match(/t=(\d+)/)?.[1];
  const v1 = header.match(/v1=([0-9a-f]+)/)?.[1];
  if (!t || !v1) return false;
  if (Math.floor(Date.now() / 1000) - Number(t) > 300) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex'));
  const given = Buffer.from(v1);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
