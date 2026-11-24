import type { Case, Provider } from '../types.ts';
import { paystackSignature } from '../sign.ts';

const secret = 'sk_test_intact_4f9c2a7e1b';
const header = 'x-paystack-signature';

const compact = '{"event":"charge.success","data":{"id":302961,"amount":500000,"currency":"NGN","reference":"intact_ref_001"}}';
// Same kind of event, but with spaces, a line break and a different key order. Parsing and re-stringifying it changes the bytes.
const spaced = '{ "event": "charge.success",\n  "data": { "reference": "intact_ref_002", "amount": 500000, "currency": "NGN", "id": 302962 } }';
const tampered = compact.replace('"amount":500000', '"amount":50000000');

function cases(): Case[] {
  const good = paystackSignature(compact, secret);
  return [
    { name: 'valid', level: 'must', expect: true, why: 'A real webhook must be accepted.',
      rawBody: compact, headers: { [header]: good } },
    { name: 'valid, spaced body', level: 'must', expect: true, why: 'The signature covers the exact bytes. Re-serialising the JSON breaks it.',
      rawBody: spaced, headers: { [header]: paystackSignature(spaced, secret) } },
    { name: 'tampered amount', level: 'must', expect: false, why: 'Someone changed the amount after Paystack signed it.',
      rawBody: tampered, headers: { [header]: good } },
    { name: 'wrong secret', level: 'must', expect: false, why: 'Signed by someone who does not have your secret.',
      rawBody: compact, headers: { [header]: paystackSignature(compact, 'sk_test_attacker') } },
    { name: 'missing header', level: 'must', expect: false, why: 'No signature at all.',
      rawBody: compact, headers: {} },
    { name: 'empty header', level: 'must', expect: false, why: 'A signature header with nothing in it.',
      rawBody: compact, headers: { [header]: '' } },
    { name: 'short garbage', level: 'must', expect: false, why: 'A signature of the wrong length. A careless timingSafeEqual throws here instead of returning false.',
      rawBody: compact, headers: { [header]: 'abc123' } },
    { name: 'junk after valid signature', level: 'should', expect: false, why: 'Buffer.from(x, "hex") silently drops trailing junk, so a loose check accepts it.',
      rawBody: compact, headers: { [header]: good + 'zz' } },
  ];
}

export const paystack: Provider = {
  id: 'paystack',
  name: 'Paystack',
  secretDescription: 'your Paystack secret key (it starts with sk_)',
  secret,
  now: 1795000000,
  cases,
  reference: 'paystack.ts',
  broken: [
    { file: 'paystack.reserialises.ts', mustFail: ['valid, spaced body'] },
    { file: 'paystack.throws-on-length.ts', mustFail: ['short garbage'] },
    { file: 'paystack.hex-decode.ts', mustFail: ['junk after valid signature'] },
  ],
};
