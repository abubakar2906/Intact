// Broken on purpose: trusts a signature under any scheme name, not only v1.
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verify(rawBody: string, headers: Record<string, string | undefined>, secret: string): boolean {
  const header = headers['stripe-signature'];
  if (!header) return false;
  let t = '';
  const sigs: string[] = [];
  for (const part of header.split(',')) {
    const [k, v] = part.split('=');
    if (k === 't') t = v;
    else if (v) sigs.push(v);
  }
  if (!t || sigs.length === 0) return false;
  if (Math.floor(Date.now() / 1000) - Number(t) > 300) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex'));
  return sigs.some((s) => Buffer.from(s).length === expected.length && timingSafeEqual(Buffer.from(s), expected));
}
