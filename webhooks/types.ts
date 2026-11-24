// The shapes every part of Intact shares.

export type Headers = Record<string, string | undefined>;

// What a model has to write. The same signature for every provider, so one harness runs them all.
export type Verify = (rawBody: string, headers: Headers, secret: string) => boolean;

// "must": getting this wrong means real webhooks are rejected or fake ones are accepted. It decides pass or fail.
// "should": stricter behaviour a careful engineer would add. Reported, but it does not decide pass or fail.
export type Level = 'must' | 'should';

export type Case = {
  name: string;
  why: string;
  level: Level;
  rawBody: string;
  headers: Headers;
  expect: boolean;
};

export type Provider = {
  id: string;
  name: string;
  // How the secret is described to the model, in the provider's own terms.
  secretDescription: string;
  secret: string;
  // The moment the webhooks "arrive", in Unix seconds. The harness freezes the clock here.
  now: number;
  cases: () => Case[];
  // Files under webhooks/references/ that export a verify function. The reference must pass every case.
  // Each broken version must fail at least the cases listed.
  reference: string;
  broken: { file: string; mustFail: string[] }[];
};

export type CaseResult = { name: string; level: Level; expect: boolean; got: boolean | null; threw: string | null; ok: boolean };

export type HarnessOutput =
  | { loaded: true; results: CaseResult[] }
  | { loaded: false; error: string };
