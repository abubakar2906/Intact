import type { Case, Provider } from '../types.ts';
import { stripeSignature } from '../sign.ts';

const secret = 'whsec_intact_8d3e6b1f0c2a';
const header = 'stripe-signature';
const now = 1795000000;

const compact = '{"id":"evt_intact_001","type":"payment_intent.succeeded","data":{"object":{"id":"pi_001","amount":5000,"currency":"usd"}}}';
const spaced = '{ "type": "payment_intent.succeeded",\n  "id": "evt_intact_002", "data": { "object": { "currency": "usd", "amount": 5000, "id": "pi_002" } } }';
const tampered = compact.replace('"amount":5000', '"amount":500000');

function cases(): Case[] {
  const t = now - 30;
  const good = stripeSignature(compact, secret, t);
  const old = now - 600;
  return [
    { name: 'valid', level: 'must', expect: true, why: 'A real webhook, sent 30 seconds ago, must be accepted.',
      rawBody: compact, headers: { [header]: `t=${t},v1=${good}` } },
    { name: 'valid, spaced body', level: 'must', expect: true, why: 'The signature covers the exact bytes. Re-serialising the JSON breaks it.',
      rawBody: spaced, headers: { [header]: `t=${t},v1=${stripeSignature(spaced, secret, t)}` } },
    { name: 'tampered amount', level: 'must', expect: false, why: 'Someone changed the amount after Stripe signed it.',
      rawBody: tampered, headers: { [header]: `t=${t},v1=${good}` } },
    { name: 'wrong secret', level: 'must', expect: false, why: 'Signed by someone who does not have your secret.',
      rawBody: compact, headers: { [header]: `t=${t},v1=${stripeSignature(compact, 'whsec_attacker', t)}` } },
    { name: 'missing header', level: 'must', expect: false, why: 'No signature at all.',
      rawBody: compact, headers: {} },
    { name: 'too old', level: 'must', expect: false, why: 'Correctly signed, but 10 minutes old: a replayed webhook. Stripe allows 5 minutes.',
      rawBody: compact, headers: { [header]: `t=${old},v1=${stripeSignature(compact, secret, old)}` } },
    { name: 'timestamp swapped', level: 'must', expect: false, why: 'An old signature with a fresh timestamp pasted in, to get past the age check.',
      rawBody: compact, headers: { [header]: `t=${t},v1=${stripeSignature(compact, secret, old)}` } },
    { name: 'malformed header', level: 'must', expect: false, why: 'A header that is not in Stripe\'s format at all. Must return false, not throw.',
      rawBody: compact, headers: { [header]: 'garbage' } },
    { name: 'timestamp only', level: 'must', expect: false, why: 'A timestamp but no signature.',
      rawBody: compact, headers: { [header]: `t=${t}` } },
    { name: 'rotated secret', level: 'should', expect: true, why: 'While a secret is being rotated, Stripe sends several v1 signatures. Any one matching is enough.',
      rawBody: compact, headers: { [header]: `t=${t},v1=${stripeSignature(compact, 'whsec_old_secret', t)},v1=${good}` } },
    { name: 'v0 only', level: 'should', expect: false, why: 'Only v1 is a real signature scheme. A valid-looking v0 must not be trusted.',
      rawBody: compact, headers: { [header]: `t=${t},v0=${good}` } },
  ];
}

export const stripe: Provider = {
  id: 'stripe',
  name: 'Stripe',
  secretDescription: 'your endpoint\'s webhook signing secret (it starts with whsec_)',
  secret,
  now,
  cases,
  reference: 'stripe.ts',
  broken: [
    { file: 'stripe.no-age-check.ts', mustFail: ['too old'] },
    { file: 'stripe.body-only.ts', mustFail: ['valid', 'valid, spaced body'] },
    { file: 'stripe.first-v1-only.ts', mustFail: ['rotated secret'] },
    { file: 'stripe.any-scheme.ts', mustFail: ['v0 only'] },
  ],
};
