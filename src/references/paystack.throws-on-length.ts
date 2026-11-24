// Broken on purpose: timingSafeEqual throws when the lengths differ, and nothing catches it.
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verify(rawBody: string, headers: Record<string, string | undefined>, secret: string): boolean {
  const signature = headers['x-paystack-signature'];
  if (!signature) return false;
  const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
