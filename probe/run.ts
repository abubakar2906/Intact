// Runs agents through the scenarios several times each and writes up what happened.
// usage: npm run probe -- --models <id,id,...> [--scenarios a,b] [--samples 3] [--conditions A,B,C,D] [--parallel 3]
//        npm run probe -- --resume runs/probe-<time> [--models <corrected list>]   finish a run that stopped early
//        npm run probe -- --resume runs/probe-<time> --rescore   grade finished runs again with the current grading. Calls no model.
// "careful" and "naive" are the scripted agents: a free dry run that needs no API key.
// Each model runs in its own lane, with up to --parallel tries at a time, paced to its rate limits (see pace.ts).
import { mkdir, writeFile, appendFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { availableModels, makeWorld, missingSetup, ModelMissingError, runModel, runScripted, setLog } from './agent.ts';
import { CONDITIONS, parseConditions, type Condition } from './conditions.ts';
import { DailyLimitError } from './pace.ts';
import { SCENARIOS, type Scenario } from './scenarios.ts';
import type { Transcript } from './types.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OPTIONS = {
  models: { type: 'string' }, scenarios: { type: 'string' }, samples: { type: 'string' }, resume: { type: 'string' }, rescore: { type: 'boolean' },
  conditions: { type: 'string' }, parallel: { type: 'string' },
} as const;
let values: ReturnType<typeof parseArgs<{ options: typeof OPTIONS }>>['values'];
try {
  ({ values } = parseArgs({ options: OPTIONS }));
} catch (e) {
  // Usually a command cut short when pasted, like "--parall". Say which part, not a stack trace.
  console.log(`${(e as Error).message.split('.')[0]}. The options are: ${Object.keys(OPTIONS).map((o) => `--${o}`).join(', ')}. Check the end of the command wasn't cut off when you pasted it.`);
  process.exit(1);
}

// A run's settings are saved in run.json, so --resume carries on with exactly the same models, scenarios and samples.
type Plan = { models: string[]; scenarios: string[]; samples: number; conditions?: Condition[] };
let OUT: string, plan: Plan, stamp: string;
if (values.resume) {
  OUT = resolve(values.resume);
  if (!existsSync(resolve(OUT, 'run.json'))) { console.log(`${values.resume} has no run.json: not a probe run folder.`); process.exit(1); }
  plan = JSON.parse(await readFile(resolve(OUT, 'run.json'), 'utf8'));
  // A corrected model list (say, after a wrong id) replaces the saved one. Finished runs of the models kept are reused.
  if (values.models) {
    plan.models = values.models.split(',').map((s) => s.trim()).filter(Boolean);
    await writeFile(resolve(OUT, 'run.json'), JSON.stringify(plan, null, 2));
  }
  stamp = OUT.split(/[\\/]/).pop()!.replace(/^probe-/, '');
} else {
  if (!values.models) { console.log('usage: npm run probe -- --models <model ids, comma separated> [--samples 3]\nTry "--models careful,naive" for a free dry run.'); process.exit(1); }
  stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  OUT = resolve(ROOT, 'runs', `probe-${stamp}`);
  plan = {
    models: values.models.split(',').map((s) => s.trim()).filter(Boolean),
    scenarios: (values.scenarios ?? SCENARIOS.map((s) => s.id).join(',')).split(',').map((s) => s.trim()),
    samples: Number(values.samples ?? 3),
    conditions: parseConditions(values.conditions),
  };
  // Before a folder is made, so a run that can't start leaves nothing behind.
  const missing = plan.models.some((m) => m !== 'careful' && m !== 'naive') ? missingSetup() : null;
  if (missing) { console.log(missing); process.exit(1); }
  await mkdir(OUT, { recursive: true });
  await writeFile(resolve(OUT, 'run.json'), JSON.stringify(plan, null, 2));
}

const models = plan.models;
const conditions: Condition[] = plan.conditions ?? ['A'];
const chosen = plan.scenarios.map((id) => {
  const s = SCENARIOS.find((x) => x.id === id.trim());
  if (!s) { console.log(`unknown scenario "${id}". Known: ${SCENARIOS.map((x) => x.id).join(', ')}`); process.exit(1); }
  return s;
});
const samples = plan.samples;
// Several tries of one model at once. Slow models (minutes per answer) finish several times sooner. A refusal for
// asking too fast is still waited out, so a service that allows less only slows down, it doesn't fail.
const parallel = Math.max(1, Number(values.parallel ?? 3));
const slug = (m: string) => m.replace(/[^a-z0-9.-]+/gi, '_');
const conditionOf = (t: Transcript) => (t.condition ?? 'A') as Condition;
const key = (agent: string, condition: string, scenario: string, sample: number) => `${agent}|${condition}|${scenario}|${sample}`;
// Runs from before conditions existed keep their old file name.
const fileFor = (t: { agent: string; scenario: string; sample: number; condition?: string }) =>
  resolve(OUT, 'transcripts', slug(t.agent), `${t.scenario}${(t.condition ?? 'A') === 'A' ? '' : `-${t.condition}`}-${t.sample}.json`);
const label = (c: Condition) => (conditions.length > 1 ? ` (${c})` : '');

// Runs already finished in this folder are kept. A run that ended in an api error is tried again.
const done = new Map<string, Transcript>();
if (existsSync(resolve(OUT, 'results.jsonl'))) {
  for (const line of (await readFile(resolve(OUT, 'results.jsonl'), 'utf8')).split('\n').filter(Boolean)) {
    const t = JSON.parse(line) as Transcript;
    done.set(key(t.agent, conditionOf(t), t.scenario, t.sample), t);
  }
}
// Rescoring replays each run's tool calls on a fresh world and grades the result, so a fix to the grading or the world
// can be checked against runs already paid for. If the world now answers a call differently from what the agent saw,
// the note says so: the agent might have acted differently, so that run should be read, not just counted.
if (values.rescore) {
  if (!values.resume) { console.log('--rescore needs --resume <run folder>.'); process.exit(1); }
  // Kept from the first rescore only, so a second rescore can't overwrite the original grades.
  if (!existsSync(resolve(OUT, 'results.before-rescore.jsonl'))) await writeFile(resolve(OUT, 'results.before-rescore.jsonl'), [...done.values()].map((t) => JSON.stringify(t)).join('\n') + '\n');
  let changed = 0;
  for (const t of done.values()) {
    if (t.ending === 'api error') continue;
    const scenario = SCENARIOS.find((s) => s.id === t.scenario);
    if (!scenario) continue;
    const world = makeWorld(scenario, conditionOf(t));
    const differ: number[] = [];
    t.steps.forEach((step, i) => {
      if (step.kind !== 'tool') return;
      if (JSON.stringify(world.call(step.name, step.args)) !== JSON.stringify(step.result)) differ.push(i + 1);
    });
    const before = JSON.stringify(t.grade);
    t.grade = scenario.grade(world, t.reply, t.ending);
    if (differ.length) t.grade.money.note += ` (replayed: the world now answers step ${differ.join(', ')} differently from what the agent saw, so read this run)`;
    if (JSON.stringify(t.grade) !== before) changed++;
    await mkdir(dirname(fileFor(t)), { recursive: true });
    await writeFile(fileFor(t), JSON.stringify(t, null, 2));
  }
  await writeFile(resolve(OUT, 'results.jsonl'), [...done.values()].map((t) => JSON.stringify(t)).join('\n') + '\n');
  console.log(`Rescored ${done.size} runs: ${changed} grades changed. The old grades are in results.before-rescore.jsonl.`);
}

type Job = { model: string; condition: Condition; scenario: Scenario; sample: number };
const todo = (m: string): Job[] => conditions.flatMap((condition) => chosen.flatMap((scenario) => Array.from({ length: samples }, (_, i) => ({ model: m, condition, scenario, sample: i + 1 }))))
  .filter((j) => { const t = done.get(key(j.model, j.condition, j.scenario.id, j.sample)); return !t || t.ending === 'api error'; });
const jobCount = models.reduce((n, m) => n + todo(m).length, 0);
if (values.resume) console.log(`Resuming ${values.resume}: ${jobCount} runs left.`);

setLog((msg) => console.log(`  ${msg}`));
const stopped = new Map<string, string>();

// Catch a wrong model id before spending any runs on it.
const real = models.filter((m) => m !== 'careful' && m !== 'naive');
const missing = real.length && jobCount > 0 ? missingSetup() : null;
if (missing) { console.log(missing); process.exit(1); }
if (real.length && jobCount > 0) {
  console.log(`Asking ${(process.env.INTACT_BASE_URL ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '')}, ${parallel} tries at a time per model.`);
  const offered = await availableModels();
  if (offered) {
    for (const m of real.filter((m) => !offered.includes(m))) {
      stopped.set(m, `${m} is not a model id this service offers.`);
      console.log(`  ${m} is not offered by this service, so it's skipped. Close matches: ${offered.filter((o) => o.split(/[\/-]/).some((part) => part.length > 3 && m.includes(part))).join(', ') || 'none'}.`);
    }
    if (stopped.size && offered.length <= 60) console.log(`  This service offers: ${offered.slice().sort().join(', ')}\n`);
    else if (stopped.size) console.log(`  This service offers ${offered.length} models. To see them all, open ${(process.env.INTACT_BASE_URL ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '')}/models in a browser.\n`);
  }
}

async function runJob({ model, condition, scenario, sample }: Job) {
  const t = model === 'careful' || model === 'naive'
    ? runScripted(scenario, scenario[model], model, sample, condition)
    : await runModel(scenario, model, sample, condition);
  done.set(key(model, condition, scenario.id, sample), t);
  await mkdir(dirname(fileFor(t)), { recursive: true });
  await writeFile(fileFor(t), JSON.stringify(t, null, 2));
  await appendFile(resolve(OUT, 'results.jsonl'), JSON.stringify(t) + '\n');
  const g = t.grade;
  const where = `${model} · ${scenario.id}${label(condition)} #${sample}`;
  // A run that failed to reach the model has no result to grade, so none is printed.
  if (t.ending === 'api error') console.log(`${'API ERROR'.padEnd(22)} ${where} · ${t.error?.slice(0, 100)}`);
  else console.log(`${(g.money.ok ? 'money ok' : 'MONEY WRONG').padEnd(12)} ${(g.truth === null ? '' : g.truth.ok ? 'truth ok' : 'UNTRUE?').padEnd(9)} ${where} · ${t.ending}`);
}

// One lane per model, since services limit each model separately. Inside a lane, up to `parallel` tries run at once.
// A daily limit or a missing model stops the lane: tries already running finish, no new ones start.
await Promise.all(models.filter((m) => !stopped.has(m)).map(async (model) => {
  const queue = todo(model);
  await Promise.all(Array.from({ length: Math.min(parallel, queue.length) }, async () => {
    while (queue.length && !stopped.has(model)) {
      try { await runJob(queue.shift()!); } catch (e) {
        if (!(e instanceof DailyLimitError || e instanceof ModelMissingError)) throw e;
        if (!stopped.has(model)) console.log(`  ${e.message} Stopping it here; everything finished so far is saved.`);
        stopped.set(model, e.message);
      }
    }
  }));
}));
const all = [...done.values()].filter((t) => models.includes(t.agent) && conditions.includes(conditionOf(t)) && chosen.some((s) => s.id === t.scenario));

// The write-up: one table of results, then every failure with the agent's own words, so a person can check them.
const right = (t: Transcript) => t.grade.money.ok && t.grade.truth?.ok !== false;
const lines: string[] = [`# Intact probe ${stamp}`, '',
  `${samples} runs per agent per scenario${conditions.length > 1 ? ' per condition' : ''}. **Money** is graded from Ledgerline's own records. **Truth** looks for specific false claims in the reply; it is rough, so read every flagged reply below before quoting a number. **Every try** is yes only when every finished run got both right: a business needs an agent that always gets it right, not one that can.`, ''];
if (conditions.length > 1) lines.push(...conditions.map((c) => `- **${c}**: ${CONDITIONS[c]}`), '');
lines.push(`| scenario | ${models.map((m) => `${m}: money / truth / every try`).join(' | ')} |`, `|---|${models.map(() => '---').join('|')}|`);
for (const s of chosen) {
  for (const c of conditions) {
    const cells = models.map((m) => {
      const ts = all.filter((t) => t.agent === m && conditionOf(t) === c && t.scenario === s.id && t.ending !== 'api error');
      const money = ts.filter((t) => t.grade.money.ok).length;
      const judged = ts.filter((t) => t.grade.truth !== null);
      const truth = judged.filter((t) => t.grade.truth!.ok).length;
      return ts.length ? `${money}/${ts.length} / ${judged.length ? `${truth}/${judged.length}` : '–'} / ${ts.every(right) ? 'yes' : 'no'}` : 'no runs';
    });
    lines.push(`| ${s.title}${label(c)} | ${cells.join(' | ')} |`);
  }
}
lines.push('', '## How runs ended', '', `| agent | replied | escalated | replied in plain text | ran out of steps | api error |`, '|---|---|---|---|---|---|');
for (const m of models) {
  const n = (e: string) => all.filter((t) => t.agent === m && t.ending === e).length;
  lines.push(`| ${m} | ${n('replied')} | ${n('escalated')} | ${n('replied in plain text')} | ${n('ran out of steps')} | ${n('api error')} |`);
}
lines.push('', '## What went wrong', '');
const bad = all.filter((t) => t.ending !== 'api error' && !right(t));
const finished = all.filter((t) => t.ending !== 'api error');
if (!finished.length) lines.push('No run finished, so there is nothing to judge yet.');
else if (!bad.length) lines.push('Nothing. Every run kept the money right and made no false claim we look for.');
for (const s of chosen) {
  const here = bad.filter((t) => t.scenario === s.id);
  if (!here.length) continue;
  lines.push(`### ${s.title}`, '', `*The trap:* ${s.trap}`, '');
  for (const t of here.sort((a, b) => a.agent.localeCompare(b.agent) || conditionOf(a).localeCompare(conditionOf(b)) || a.sample - b.sample)) {
    const what = [!t.grade.money.ok && `money: ${t.grade.money.note}`, t.grade.truth?.ok === false && `truth: ${t.grade.truth.note} (flagged "${t.grade.truth.matched}")`].filter(Boolean).join('. ');
    lines.push(`- **${t.agent}${label(conditionOf(t))} #${t.sample}**: ${what}.`, t.reply ? `  > ${t.reply.replace(/\s+/g, ' ').slice(0, 400)}` : '  (no reply)');
  }
  lines.push('');
}
const replayed = all.filter((t) => t.grade.money.note.includes('(replayed:'));
if (replayed.length) lines.push('## Read these: rescored on a world that now answers differently', '', 'The agent saw one answer and the rescore gave another, so it might have acted differently. Their grades above are a best guess.', '', ...replayed.map((t) => `- ${t.agent} · ${t.scenario}${label(conditionOf(t))} #${t.sample}: ${t.grade.money.note}`), '');
const errors = all.filter((t) => t.error);
if (errors.length) lines.push('## Errors', '', ...errors.map((t) => `- ${t.agent} · ${t.scenario}${label(conditionOf(t))} #${t.sample}: ${t.error}`), '');
if (stopped.size) {
  const rel = OUT.startsWith(ROOT) ? OUT.slice(ROOT.length + 1) : OUT;
  lines.push('## Not finished yet', '', ...[...stopped.entries()].map(([m, why]) => `- ${m}: ${todo(m).length} runs left. ${why}`), '',
    `For a daily limit: run \`npm run probe -- --resume ${rel}\` after it resets.`,
    `For a wrong model id: run \`npm run probe -- --resume ${rel} --models <the corrected list>\`.`,
    'Finished runs are kept either way. The table above only counts finished runs.', '');
}
const tokens = all.reduce((s, t) => s + t.inputTokens + t.outputTokens, 0);
lines.push(`Tokens used: ${tokens.toLocaleString('en')}. Every run, step by step, is in transcripts/.`);
await writeFile(resolve(OUT, 'summary.md'), lines.join('\n') + '\n');
console.log(`\n${lines.join('\n')}\nSaved to ${OUT}`);
