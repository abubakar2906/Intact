// Runs agents through the scenarios several times each and writes up what happened.
// usage: npm run probe -- --models <id,id,...> [--scenarios a,b] [--samples 3]
//        npm run probe -- --resume runs/probe-<time>     finish a run that stopped at a model's daily limit
// "careful" and "naive" are the scripted agents: a free dry run that needs no API key.
// Each model runs in its own lane, one request at a time, paced to its rate limits (see pace.ts).
import { mkdir, writeFile, appendFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { runModel, runScripted, setLog } from './agent.ts';
import { DailyLimitError } from './pace.ts';
import { SCENARIOS } from './scenarios.ts';
import type { Transcript } from './types.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({ options: {
  models: { type: 'string' }, scenarios: { type: 'string' }, samples: { type: 'string' }, resume: { type: 'string' },
} });

// A run's settings are saved in run.json, so --resume carries on with exactly the same models, scenarios and samples.
type Plan = { models: string[]; scenarios: string[]; samples: number };
let OUT: string, plan: Plan, stamp: string;
if (values.resume) {
  OUT = resolve(values.resume);
  if (!existsSync(resolve(OUT, 'run.json'))) { console.log(`${values.resume} has no run.json: not a probe run folder.`); process.exit(1); }
  plan = JSON.parse(await readFile(resolve(OUT, 'run.json'), 'utf8'));
  stamp = OUT.split(/[\\/]/).pop()!.replace(/^probe-/, '');
} else {
  if (!values.models) { console.log('usage: npm run probe -- --models <model ids, comma separated> [--samples 3]\nTry "--models careful,naive" for a free dry run.'); process.exit(1); }
  stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  OUT = resolve(ROOT, 'runs', `probe-${stamp}`);
  plan = {
    models: values.models.split(',').map((s) => s.trim()).filter(Boolean),
    scenarios: (values.scenarios ?? SCENARIOS.map((s) => s.id).join(',')).split(',').map((s) => s.trim()),
    samples: Number(values.samples ?? 3),
  };
  await mkdir(OUT, { recursive: true });
  await writeFile(resolve(OUT, 'run.json'), JSON.stringify(plan, null, 2));
}

const models = plan.models;
const chosen = plan.scenarios.map((id) => {
  const s = SCENARIOS.find((x) => x.id === id.trim());
  if (!s) { console.log(`unknown scenario "${id}". Known: ${SCENARIOS.map((x) => x.id).join(', ')}`); process.exit(1); }
  return s;
});
const samples = plan.samples;
const slug = (m: string) => m.replace(/[^a-z0-9.-]+/gi, '_');
const key = (agent: string, scenario: string, sample: number) => `${agent}|${scenario}|${sample}`;

// Runs already finished in this folder are kept. A run that ended in an api error is tried again.
const done = new Map<string, Transcript>();
if (existsSync(resolve(OUT, 'results.jsonl'))) {
  for (const line of (await readFile(resolve(OUT, 'results.jsonl'), 'utf8')).split('\n').filter(Boolean)) {
    const t = JSON.parse(line) as Transcript;
    done.set(key(t.agent, t.scenario, t.sample), t);
  }
}
const todo = (m: string) => chosen.flatMap((scenario) => Array.from({ length: samples }, (_, i) => ({ model: m, scenario, sample: i + 1 })))
  .filter((j) => { const t = done.get(key(j.model, j.scenario.id, j.sample)); return !t || t.ending === 'api error'; });
const jobCount = models.reduce((n, m) => n + todo(m).length, 0);
if (values.resume) console.log(`Resuming ${values.resume}: ${jobCount} runs left.`);

setLog((msg) => console.log(`  ${msg}`));
const stopped = new Map<string, string>();
// One lane per model: services limit each model separately, so models run side by side and each one is paced on its own.
await Promise.all(models.map(async (model) => {
  for (const { scenario, sample } of todo(model)) {
    let t: Transcript;
    try {
      t = model === 'careful' || model === 'naive'
        ? runScripted(scenario, scenario[model], model, sample)
        : await runModel(scenario, model, sample);
    } catch (e) {
      if (!(e instanceof DailyLimitError)) throw e;
      stopped.set(model, e.message);
      console.log(`  ${e.message} Stopping it here; everything finished so far is saved.`);
      return;
    }
    done.set(key(model, scenario.id, sample), t);
    const dir = resolve(OUT, 'transcripts', slug(model));
    await mkdir(dir, { recursive: true });
    await writeFile(resolve(dir, `${scenario.id}-${sample}.json`), JSON.stringify(t, null, 2));
    await appendFile(resolve(OUT, 'results.jsonl'), JSON.stringify(t) + '\n');
    const g = t.grade;
    console.log(`${(g.money.ok ? 'money ok' : 'MONEY WRONG').padEnd(12)} ${(g.truth === null ? '' : g.truth.ok ? 'truth ok' : 'UNTRUE?').padEnd(9)} ${model} · ${scenario.id} #${sample} · ${t.ending}${t.error ? ` · ${t.error.slice(0, 80)}` : ''}`);
  }
}));
const all = [...done.values()].filter((t) => models.includes(t.agent) && chosen.some((s) => s.id === t.scenario));

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
if (stopped.size) {
  const rel = OUT.startsWith(ROOT) ? OUT.slice(ROOT.length + 1) : OUT;
  lines.push('## Not finished yet', '', ...[...stopped.entries()].map(([m, why]) => `- ${m}: ${todo(m).length} runs left. ${why}`), '',
    `Run \`npm run probe -- --resume ${rel}\` after the limit resets to finish them. The table above only counts finished runs.`, '');
}
const tokens = all.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0);
lines.push(`Tokens used: ${tokens.toLocaleString('en')}. Every run, step by step, is in transcripts/.`);
await writeFile(resolve(OUT, 'summary.md'), lines.join('\n') + '\n');
console.log(`\n${lines.join('\n')}\nSaved to ${OUT}`);
