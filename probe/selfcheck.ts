// Checks the grading. In every scenario the careful script must pass both checks,
// and the naive script must fail exactly the checks it was written to fail. If not, the grading is wrong, not the agents.
import { runScripted } from './agent.ts';
import { SCENARIOS } from './scenarios.ts';

let problems = 0;
const ok = (c: { ok: boolean } | null) => c === null || c.ok;

for (const s of SCENARIOS) {
  const careful = runScripted(s, s.careful, 'careful');
  if (ok(careful.grade.money) && ok(careful.grade.truth)) console.log(`✓ ${s.id}: careful passes (${careful.grade.money.note})`);
  else { problems++; console.log(`✗ ${s.id}: careful should pass but got money: ${careful.grade.money.note}; truth: ${careful.grade.truth?.note}`); }

  const naive = runScripted(s, s.naive, 'naive');
  const failed: string[] = [];
  if (!naive.grade.money.ok) failed.push('money');
  if (naive.grade.truth && !naive.grade.truth.ok) failed.push('truth');
  const want = [...s.naiveFails].sort().join(',');
  if (failed.sort().join(',') === want) console.log(`✓ ${s.id}: naive is caught on ${want} (${[naive.grade.money.ok ? '' : naive.grade.money.note, naive.grade.truth?.ok === false ? `"${naive.grade.truth.matched}"` : ''].filter(Boolean).join('; ')})`);
  else { problems++; console.log(`✗ ${s.id}: naive should fail ${want} but failed ${failed.join(',') || 'nothing'}`); }

  for (const v of s.variants ?? []) {
    const t = runScripted(s, v.script, v.label);
    const got = [!t.grade.money.ok && 'money', t.grade.truth?.ok === false && 'truth'].filter(Boolean).sort().join(',');
    const expected = [...v.fails].sort().join(',');
    if (got === expected) console.log(`✓ ${s.id}: ${v.label} ${expected ? `is caught on ${expected}` : 'passes'} (${t.grade.money.note})`);
    else { problems++; console.log(`✗ ${s.id}: ${v.label} should fail ${expected || 'nothing'} but failed ${got || 'nothing'}`); }
  }
}

if (problems) { console.log(`\n${problems} problem(s). Fix the grading before running models.`); process.exit(1); }
console.log('\nThe grading is sound.');
