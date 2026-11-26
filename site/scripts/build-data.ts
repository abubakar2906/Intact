// Turns results/ and the probe's own code into the data the site imports. Runs before `next dev` and `next build`.
// Everything shown on the site comes from here, so the site can't disagree with the published results.
//   src/data/generated/experiments.json  counts and one entry per try, for charts and the try grid
//   src/data/generated/runs.json         every run in full, for the run pages
//   src/data/generated/method.json       the provider notes, tools, instructions and scenarios the agents saw
//   public/runs/<id>.json                every run in full, fetched when a reader opens a try
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPERIMENTS } from '../src/content/experiments.ts';
import { MODELS } from '../src/content/models.ts';
import { systemPrompt } from '../../probe/agent.ts';
import { CONDITIONS, type Condition } from '../../probe/conditions.ts';
import { SCENARIOS } from '../../probe/scenarios.ts';
import { LEDGERLINE_NOTES, TOOLS } from '../../probe/world.ts';
import type { Transcript } from '../../probe/types.ts';

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RESULTS = resolve(SITE, '..', 'results');
const OUT = resolve(SITE, 'src/data/generated');
const PUBLIC_RUNS = resolve(SITE, 'public/runs');

const slug = (s: string) => s.toLowerCase().replace(/^[^/]+\//, '').replace(/[^a-z0-9]+/g, '-');
export const runId = (experiment: string, model: string, condition: string, sample: number) =>
  `${experiment}-${slug(model)}-${condition.toLowerCase()}-${sample}`;

type Verdict = 'right' | 'wrong' | 'escalated' | 'error';
const verdictOf = (t: Transcript): Verdict =>
  t.ending === 'api error' ? 'error' : !t.grade.money.ok ? 'wrong' : t.ending === 'escalated' ? 'escalated' : 'right';

const experiments: Record<string, unknown> = {};
const runs: Record<string, unknown> = {};

for (const e of EXPERIMENTS) {
  const scenario = SCENARIOS.find((s) => s.id === e.scenario);
  if (!scenario) throw new Error(`${e.slug}: no scenario "${e.scenario}" in probe/scenarios.ts`);
  const transcripts: Transcript[] = [];
  for (const folder of e.results) {
    const file = resolve(RESULTS, folder, 'results.jsonl');
    if (!existsSync(file)) throw new Error(`${e.slug}: ${file} is missing. Publish the run first (npm run publish in the repo root).`);
    for (const line of (await readFile(file, 'utf8')).split('\n').filter(Boolean)) {
      const t = JSON.parse(line) as Transcript;
      if (t.scenario === e.scenario) transcripts.push(t);
    }
  }
  const tries: Record<string, Record<string, { id: string; sample: number; verdict: Verdict; untrue: boolean }[]>> = {};
  const counts: Record<string, Record<string, { wrong: number; n: number; untrue: number; escalated: number; errors: number }>> = {};
  for (const model of e.models) {
    if (!MODELS[model]) throw new Error(`${e.slug}: add ${model} to src/content/models.ts`);
    tries[model] = {};
    counts[model] = {};
    for (const setup of e.setups) {
      const mine = transcripts.filter((t) => t.agent === model && (t.condition ?? 'A') === setup.id).sort((a, b) => a.sample - b.sample);
      tries[model][setup.id] = mine.map((t) => ({ id: runId(e.slug, model, setup.id, t.sample), sample: t.sample, verdict: verdictOf(t), untrue: t.grade.truth?.ok === false }));
      const finished = mine.filter((t) => t.ending !== 'api error');
      counts[model][setup.id] = {
        wrong: finished.filter((t) => !t.grade.money.ok).length,
        n: finished.length,
        untrue: finished.filter((t) => t.grade.truth?.ok === false).length,
        escalated: finished.filter((t) => t.ending === 'escalated').length,
        errors: mine.length - finished.length,
      };
      for (const t of mine) {
        const id = runId(e.slug, model, setup.id, t.sample);
        runs[id] = {
          id, experiment: e.slug, model, condition: setup.id, setupName: setup.name, sample: t.sample,
          verdict: verdictOf(t), ending: t.ending, money: t.grade.money, truth: t.grade.truth,
          from: scenario.from, message: scenario.message, followUp: scenario.followUp ?? null,
          steps: t.steps, reply: t.reply, error: t.error ?? null, tokens: t.inputTokens + t.outputTokens,
        };
      }
    }
  }
  const totals = Object.fromEntries(e.setups.map((s) => {
    const all = e.models.map((m) => counts[m][s.id]);
    return [s.id, { wrong: all.reduce((n, c) => n + c.wrong, 0), n: all.reduce((n, c) => n + c.n, 0), errors: all.reduce((n, c) => n + c.errors, 0) }];
  }));
  experiments[e.slug] = { counts, tries, totals, runCount: transcripts.length };
}

const usedConditions = [...new Set(EXPERIMENTS.flatMap((e) => e.setups.map((s) => s.id)))] as Condition[];
const method = {
  notes: LEDGERLINE_NOTES,
  tools: TOOLS.map((t) => ({ name: t.function.name, description: t.function.description, params: Object.keys(t.function.parameters.properties ?? {}) })),
  prompts: Object.fromEntries(usedConditions.map((c) => [c, systemPrompt(c)])),
  conditions: CONDITIONS,
  scenarios: Object.fromEntries(SCENARIOS.map((s) => [s.id, { title: s.title, trap: s.trap, from: s.from, message: s.message, followUp: s.followUp ?? null }])),
};

await mkdir(OUT, { recursive: true });
await rm(PUBLIC_RUNS, { recursive: true, force: true });
await mkdir(PUBLIC_RUNS, { recursive: true });
await writeFile(resolve(OUT, 'experiments.json'), JSON.stringify(experiments));
await writeFile(resolve(OUT, 'runs.json'), JSON.stringify(runs));
await writeFile(resolve(OUT, 'method.json'), JSON.stringify(method));
for (const [id, run] of Object.entries(runs)) await writeFile(resolve(PUBLIC_RUNS, `${id}.json`), JSON.stringify(run));
console.log(`Site data: ${EXPERIMENTS.length} experiment(s), ${Object.keys(runs).length} runs.`);
