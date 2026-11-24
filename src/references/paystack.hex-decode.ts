// Loose on purpose: decodes both sides from hex, which silently drops trailing junk. (Hooklens's own verifier does this.)
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verify(rawBody: string, headers: Record<string, string | undefined>, secret: string): boolean {
  const signature = headers['x-paystack-signature'];
  if (!signature) return false;
  const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}
