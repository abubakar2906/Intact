// Runs one answer file against one provider's cases and prints the results as JSON.
// It runs in its own process (see check.ts), so a model's code that hangs, crashes or misbehaves cannot take the benchmark down.
// usage: node --experimental-strip-types src/harness.ts <provider> <absolute path to answer.ts>
import { pathToFileURL } from 'node:url';
import { providers } from './providers/index.ts';
import type { CaseResult, HarnessOutput } from './types.ts';

const [providerId, answerPath] = process.argv.slice(2);
const provider = providers[providerId];

function out(o: HarnessOutput): never {
  process.stdout.write(JSON.stringify(o));
  process.exit(0);
}

if (!provider || !answerPath) out({ loaded: false, error: `usage: harness <${Object.keys(providers).join('|')}> <answer.ts>` });

// Build the cases before freezing the clock, then freeze it at the moment the webhooks "arrive".
// The model is never told about time, so a time check it writes has to come from knowing the provider.
const cases = provider.cases();
const fixed = provider.now * 1000;
const RealDate = Date;
class FrozenDate extends RealDate {
  constructor(...args: any[]) {
    if (args.length === 0) super(fixed);
    else super(...(args as [any]));
  }
  static now() { return fixed; }
}
globalThis.Date = FrozenDate as DateConstructor;

let verify: unknown;
try {
  const mod = await import(pathToFileURL(answerPath).href);
  verify = mod.verify ?? mod.default;
} catch (e) {
  out({ loaded: false, error: `could not load: ${String((e as Error)?.message ?? e).slice(0, 300)}` });
}
if (typeof verify !== 'function') out({ loaded: false, error: 'no exported verify function' });

const results: CaseResult[] = cases.map((c) => {
  try {
    const got = (verify as Function)(c.rawBody, { ...c.headers }, provider.secret);
    // Only a real true counts as accepting. A truthy string or a Promise does not.
    const value = got === true ? true : got === false ? false : null;
    return { name: c.name, level: c.level, expect: c.expect, got: value, threw: null, ok: value === c.expect };
  } catch (e) {
    return { name: c.name, level: c.level, expect: c.expect, got: null, threw: String((e as Error)?.message ?? e).slice(0, 200), ok: false };
  }
});
out({ loaded: true, results });
