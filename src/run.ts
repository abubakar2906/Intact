// Asks each model to write each provider's verifier several times, checks every answer, and writes up the results.
// usage: npm run bench -- --models <id,id,...> [--providers paystack,stripe] [--samples 5] [--concurrency 4]
// The model id "reference" uses Intact's own correct verifier instead of calling an API: a free dry run of the whole pipeline.
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { check } from './check.ts';
import { ask } from './openrouter.ts';
import { prompt, extractCode, imports, usesConstantTime } from './prompt.ts';
import { providers } from './providers/index.ts';
import type { CaseResult } from './types.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({ options: {
  models: { type: 'string' }, providers: { type: 'string', default: Object.keys(providers).join(',') },
  samples: { type: 'string', default: '5' }, concurrency: { type: 'string', default: '4' },
} });
if (!values.models) { console.log('usage: npm run bench -- --models <openrouter model ids, comma separated> [--providers paystack,stripe] [--samples 5]'); process.exit(1); }

const models = values.models.split(',').map((s) => s.trim()).filter(Boolean);
const chosen = values.providers!.split(',').map((s) => s.trim());
for (const id of chosen) if (!providers[id]) { console.log(`unknown provider "${id}". Known: ${Object.keys(providers).join(', ')}`); process.exit(1); }
const samples = Number(values.samples);

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = resolve(ROOT, 'runs', stamp);
await mkdir(OUT, { recursive: true });
const slug = (m: string) => m.replace(/[^a-z0-9.-]+/gi, '_');

type Row = {
  model: string; servedBy: string; provider: string; sample: number;
  status: 'pass' | 'fail' | 'did not load' | 'api error'; error?: string;
  results?: CaseResult[]; imports?: string[]; constantTime?: boolean; inputTokens?: number; outputTokens?: number;
};

const jobs = models.flatMap((model) => chosen.flatMap((provider) => Array.from({ length: samples }, (_, i) => ({ model, provider, sample: i + 1 }))));
const rows: Row[] = [];

async function runOne({ model, provider, sample }: { model: string; provider: string; sample: number }): Promise<Row> {
  const p = providers[provider];
  const base = resolve(OUT, 'answers', slug(model), provider);
  await mkdir(base, { recursive: true });
  let text: string, servedBy = model, inputTokens = 0, outputTokens = 0;
  try {
    if (model === 'reference') text = '```ts\n' + await readFile(resolve(ROOT, 'src/references', p.reference), 'utf8') + '```';
    else ({ text, servedBy, inputTokens, outputTokens } = await ask(model, prompt(p)));
  } catch (e) {
    return { model, servedBy, provider, sample, status: 'api error', error: String((e as Error).message ?? e) };
  }
  await writeFile(resolve(base, `${sample}.reply.md`), text);
  const code = extractCode(text);
  const file = resolve(base, `${sample}.ts`);
  await writeFile(file, code);
  const res = await check(provider, file);
  const common = { model, servedBy, provider, sample, imports: imports(code), constantTime: usesConstantTime(code), inputTokens, outputTokens };
  if (!res.loaded) return { ...common, status: 'did not load', error: res.error };
  const passed = res.results.filter((r) => r.level === 'must').every((r) => r.ok);
  return { ...common, status: passed ? 'pass' : 'fail', results: res.results };
}

// A small pool, so a few requests run at once without tripping rate limits.
let next = 0;
await Promise.all(Array.from({ length: Number(values.concurrency) }, async () => {
  while (next < jobs.length) {
    const job = jobs[next++];
    const row = await runOne(job);
    rows.push(row);
    await appendFile(resolve(OUT, 'results.jsonl'), JSON.stringify(row) + '\n');
    console.log(`${row.status.padEnd(12)} ${row.model} · ${row.provider} #${row.sample}${row.error ? ` · ${row.error.slice(0, 80)}` : ''}`);
  }
}));

// The write-up: one table per provider, then which checks each model failed and how often.
const lines: string[] = [`# Intact run ${stamp}`, '', `${samples} samples per model per provider. A sample passes when every "must" check passes.`, ''];
for (const pid of chosen) {
  const p = providers[pid];
  const caseList = p.cases();
  lines.push(`## ${p.name}`, '', '| model | passed | failed | did not load | api error | also met every "should" | used timingSafeEqual |', '|---|---|---|---|---|---|---|');
  for (const m of models) {
    const rs = rows.filter((r) => r.model === m && r.provider === pid);
    const n = (s: Row['status']) => rs.filter((r) => r.status === s).length;
    const ran = rs.filter((r) => r.results);
    const should = ran.filter((r) => r.results!.every((c) => c.ok)).length;
    const ct = rs.filter((r) => r.constantTime).length;
    lines.push(`| ${m} | **${n('pass')}/${rs.length}** | ${n('fail')} | ${n('did not load')} | ${n('api error')} | ${should}/${ran.length} | ${ct}/${rs.length} |`);
  }
  lines.push('', 'Times each check went wrong, out of the samples that ran:', '', `| check | level | ${models.join(' | ')} |`, `|---|---|${models.map(() => '---').join('|')}|`);
  for (const c of caseList) {
    const counts = models.map((m) => {
      const ran = rows.filter((r) => r.model === m && r.provider === pid && r.results);
      return `${ran.filter((r) => !r.results!.find((x) => x.name === c.name)!.ok).length}/${ran.length}`;
    });
    lines.push(`| ${c.name} | ${c.level} | ${counts.join(' | ')} |`);
  }
  lines.push('');
}
const errors = rows.filter((r) => r.error);
if (errors.length) lines.push('## Errors', '', ...errors.map((r) => `- ${r.model} · ${r.provider} #${r.sample} (${r.status}): ${r.error}`), '');
const tokens = rows.reduce((s, r) => s + (r.inputTokens ?? 0) + (r.outputTokens ?? 0), 0);
lines.push(`Tokens used: ${tokens.toLocaleString('en')}. Every answer and reply is in answers/.`);
await writeFile(resolve(OUT, 'summary.md'), lines.join('\n') + '\n');
console.log(`\n${lines.join('\n')}\nSaved to runs/${stamp}/`);
