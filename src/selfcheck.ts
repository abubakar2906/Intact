// Checks the checks. The reference must pass every case, and each broken version must fail the cases it was written to fail.
// If this ever fails, the benchmark is wrong, not the models. Run it before trusting any results.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check } from './check.ts';
import { providers } from './providers/index.ts';

const REF = resolve(dirname(fileURLToPath(import.meta.url)), 'references');
let failures = 0;

for (const p of Object.values(providers)) {
  const ref = await check(p.id, resolve(REF, p.reference));
  if (!ref.loaded) { console.log(`✗ ${p.id} reference did not load: ${ref.error}`); failures++; continue; }
  const wrong = ref.results.filter((r) => !r.ok);
  if (wrong.length) { failures++; console.log(`✗ ${p.id} reference fails: ${wrong.map((r) => r.name).join(', ')}`); }
  else console.log(`✓ ${p.id} reference passes all ${ref.results.length} cases`);

  for (const b of p.broken) {
    const res = await check(p.id, resolve(REF, b.file));
    if (!res.loaded) { console.log(`✗ ${b.file} did not load: ${res.error}`); failures++; continue; }
    const failed = res.results.filter((r) => !r.ok).map((r) => r.name);
    const missed = b.mustFail.filter((name) => !failed.includes(name));
    if (missed.length) { failures++; console.log(`✗ ${b.file} should fail ${missed.join(', ')} but passes`); }
    else console.log(`✓ ${b.file} is caught by: ${failed.join(', ')}`);
  }
}

if (failures) { console.log(`\n${failures} problem(s). Fix the cases before running models.`); process.exit(1); }
console.log('\nThe checks are sound.');
