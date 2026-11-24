// Grades answers you collected by hand: paste a model's whole reply into a file, then point this at it.
// usage:
//   npm run prompt -- <provider>                  prints the exact prompt to paste into a chat app
//   npm run grade -- <provider> <reply file>...   checks each reply and prints which checks it failed
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { check } from './check.ts';
import { prompt, extractCode, usesConstantTime } from './prompt.ts';
import { providers } from './providers/index.ts';

const [mode, providerId, ...files] = process.argv.slice(2);
const p = providers[providerId];
if (!p) { console.log(`usage: npm run ${mode ?? 'grade'} -- <${Object.keys(providers).join('|')}> [reply files]`); process.exit(1); }

if (mode === 'prompt') {
  console.log(prompt(p));
  process.exit(0);
}

if (!files.length) { console.log('Give one or more reply files to grade.'); process.exit(1); }
const dir = await mkdtemp(join(tmpdir(), 'intact-'));
for (const f of files) {
  // The reply can be the model's whole message: the first code block is taken from it, as in a normal run.
  const code = extractCode(await readFile(f, 'utf8'));
  const answer = join(dir, basename(f).replace(/\.\w+$/, '') + '.ts');
  await writeFile(answer, code);
  const res = await check(p.id, answer);
  if (!res.loaded) { console.log(`${f}: did not load. ${res.error}`); continue; }
  const failed = res.results.filter((r) => !r.ok);
  const mustFailed = failed.filter((r) => r.level === 'must');
  console.log(`${f}: ${mustFailed.length ? 'FAIL' : 'PASS'}${usesConstantTime(code) ? '' : ' (no timingSafeEqual)'}`);
  for (const r of failed) console.log(`  ✗ ${r.level} · ${r.name}${r.threw ? ` (threw: ${r.threw})` : ''}`);
}
