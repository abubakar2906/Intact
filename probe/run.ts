// Runs agents through the scenarios several times each and writes up what happened.
// usage: npm run probe -- --models <id,id,...> [--scenarios a,b] [--samples 3] [--concurrency 1]
// "careful" and "naive" are the scripted agents: a free dry run that needs no API key.
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { runModel, runScripted } from './agent.ts';
import { SCENARIOS } from './scenarios.ts';
import type { Transcript } from './types.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({ options: {
  models: { type: 'string' }, scenarios: { type: 'string', default: SCENARIOS.map((s) => s.id).join(',') },
  samples: { type: 'string', default: '3' }, concurrency: { type: 'string', default: '1' },
} });
if (!values.models) { console.log('usage: npm run probe -- --models <model ids, comma separated> [--samples 3]\nTry "--models careful,naive" for a free dry run.'); process.exit(1); }

const models = values.models.split(',').map((s) => s.trim()).filter(Boolean);
const chosen = values.scenarios!.split(',').map((id) => {
  const s = SCENARIOS.find((x) => x.id === id.trim());
  if (!s) { console.log(`unknown scenario "${id}". Known: ${SCENARIOS.map((x) => x.id).join(', ')}`); process.exit(1); }
  return s;
});
const samples = Number(values.samples);
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = resolve(ROOT, 'runs', `probe-${stamp}`);
await mkdir(OUT, { recursive: true });
const slug = (m: string) => m.replace(/[^a-z0-9.-]+/gi, '_');

const jobs = models.flatMap((model) => chosen.flatMap((scenario) => Array.from({ length: samples }, (_, i) => ({ model, scenario, sample: i + 1 }))));
const all: Transcript[] = [];
let next = 0;
await Promise.all(Array.from({ length: Number(values.concurrency) }, async () => {
  while (next < jobs.length) {
    const { model, scenario, sample } = jobs[next++];
    const t = model === 'careful' || model === 'naive'
      ? runScripted(scenario, scenario[model], model, sample)
      : await runModel(scenario, model, sample);
    all.push(t);
    const dir = resolve(OUT, 'transcripts', slug(model));
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, `${scenario.id}-${sample}.json`), JSON.stringify(t, null, 2));
    await appendFile(resolve(OUT, 'results.jsonl'), JSON.stringify(t) + '\n');
    const g = t.grade;
    console.log(`${(g.money.ok ? 'money ok' : 'MONEY WRONG').padEnd(12)} ${(g.truth === null ? '' : g.truth.ok ? 'truth ok' : 'UNTRUE?').padEnd(9)} ${model} · ${scenario.id} #${sample} · ${t.ending}${t.error ? ` · ${t.error.slice(0, 80)}` : ''}`);
  }
}));

// The write-up: one table of results, then every failure with the agent's own words, so a person can check them.
const lines: string[] = [`# Intact probe ${stamp}`, '',
  `${samples} runs per agent per scenario. **Money** is graded from Ledgerline's own records. **Truth** looks for specific false claims in the reply; it is rough, so read every flagged reply below before quoting a number.`, '',
  `| scenario | ${models.map((m) => `${m}: money / truth`).join(' | ')} |`, `|---|${models.map(() => '---').join('|')}|`];
for (const s of chosen) {
  const cells = models.map((m) => {
    const ts = all.filter((t) => t.agent === m && t.scenario === s.id && t.ending !== 'api error');
    const money = ts.filter((t) => t.grade.money.ok).length;
    const judged = ts.filter((t) => t.grade.truth !== null);
    const truth = judged.filter((t) => t.grade.truth!.ok).length;
    return ts.length ? `${money}/${ts.length} / ${s.id === 'duplicate-notification' ? '–' : `${truth}/${judged.length}`}` : 'no runs';
  });
  lines.push(`| ${s.title} | ${cells.join(' | ')} |`);
}
lines.push('', '## How runs ended', '', `| agent | replied | escalated | replied in plain text | ran out of steps | api error |`, '|---|---|---|---|---|---|');
for (const m of models) {
  const n = (e: string) => all.filter((t) => t.agent === m && t.ending === e).length;
  lines.push(`| ${m} | ${n('replied')} | ${n('escalated')} | ${n('replied in plain text')} | ${n('ran out of steps')} | ${n('api error')} |`);
}
lines.push('', '## What went wrong', '');
const bad = all.filter((t) => !t.grade.money.ok || t.grade.truth?.ok === false);
if (!bad.length) lines.push('Nothing. Every run kept the money right and made no false claim we look for.');
for (const s of chosen) {
  const here = bad.filter((t) => t.scenario === s.id);
  if (!here.length) continue;
  lines.push(`### ${s.title}`, '', `*The trap:* ${s.trap}`, '');
  for (const t of here.sort((a, b) => a.agent.localeCompare(b.agent) || a.sample - b.sample)) {
    const what = [!t.grade.money.ok && `money: ${t.grade.money.note}`, t.grade.truth?.ok === false && `truth: ${t.grade.truth.note} (flagged "${t.grade.truth.matched}")`].filter(Boolean).join('. ');
    lines.push(`- **${t.agent} #${t.sample}**: ${what}.`, t.reply ? `  > ${t.reply.replace(/\s+/g, ' ').slice(0, 400)}` : '  (no reply)');
  }
  lines.push('');
}
const errors = all.filter((t) => t.error);
if (errors.length) lines.push('## Errors', '', ...errors.map((t) => `- ${t.agent} · ${t.scenario} #${t.sample}: ${t.error}`), '');
const tokens = all.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0);
lines.push(`Tokens used: ${tokens.toLocaleString('en')}. Every run, step by step, is in transcripts/.`);
await writeFile(resolve(OUT, 'summary.md'), lines.join('\n') + '\n');
console.log(`\n${lines.join('\n')}\nSaved to runs/probe-${stamp}/`);
