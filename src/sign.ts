// Signing helpers for building test webhooks. These play the provider's side, so they must match the real schemes exactly.
import { createHmac } from 'node:crypto';

// Paystack: HMAC-SHA512 of the raw body, keyed with the secret key, sent as lowercase hex in x-paystack-signature.
export function paystackSignature(rawBody: string, secret: string): string {
  return createHmac('sha512', secret).update(rawBody).digest('hex');
}

// Stripe: HMAC-SHA256 of "<timestamp>.<raw body>", keyed with the whole whsec_ secret,
// sent as "t=<timestamp>,v1=<hex>" in stripe-signature.
export function stripeSignature(rawBody: string, secret: string, timestamp: number): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}
