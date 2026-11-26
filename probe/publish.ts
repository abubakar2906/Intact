// Copies a finished run into results/, so it can be pushed and seen by anyone: the plan it ran with, every run
// with its full transcript (results.jsonl), and the summary. runs/ stays on your machine; results/ is public.
// usage: npm run publish -- runs/probe-<time> [a short name, e.g. stale-payout-groq]
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [from, name] = process.argv.slice(2);
if (!from) { console.log('usage: npm run publish -- runs/probe-<time> [short-name]'); process.exit(1); }
const src = resolve(from);
for (const f of ['run.json', 'results.jsonl', 'summary.md']) {
  if (!existsSync(resolve(src, f))) { console.log(`${from} has no ${f}. Publish a run that has finished (or been resumed to the end).`); process.exit(1); }
}
// A run that still has api errors isn't finished: say so, but publish anyway if asked, since finished runs are still real.
const lines = (await readFile(resolve(src, 'results.jsonl'), 'utf8')).split('\n').filter(Boolean);
const errors = lines.filter((l) => JSON.parse(l).ending === 'api error').length;
const out = resolve(ROOT, 'results', name ? `${basename(src)}-${name}` : basename(src));
await mkdir(out, { recursive: true });
for (const f of ['run.json', 'results.jsonl', 'summary.md']) await copyFile(resolve(src, f), resolve(out, f));
console.log(`Copied ${lines.length} runs to ${out.slice(ROOT.length + 1)}.${errors ? ` ${errors} of them ended in an api error; resume the run to finish them, then publish again.` : ''}`);
console.log('Next: git add results, then git commit and git push.');
