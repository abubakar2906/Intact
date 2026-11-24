// Broken on purpose: signs a re-serialised copy of the body instead of the raw bytes.
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verify(rawBody: string, headers: Record<string, string | undefined>, secret: string): boolean {
  const signature = headers['x-paystack-signature'];
  if (!signature) return false;
  const expected = createHmac('sha512', secret).update(JSON.stringify(JSON.parse(rawBody))).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
