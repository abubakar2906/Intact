// Typed access to what scripts/build-data.ts wrote. Server-only: runs.json is large and never sent to the browser.
import experimentsJson from '@/data/generated/experiments.json';
import runsJson from '@/data/generated/runs.json';
import methodJson from '@/data/generated/method.json';
import { EXPERIMENTS, type Experiment } from '@/content/experiments';

export type Verdict = 'right' | 'wrong' | 'escalated' | 'error';
export type Try = { id: string; sample: number; verdict: Verdict; untrue: boolean };
export type Count = { wrong: number; n: number; untrue: number; escalated: number; errors: number };
export type ExperimentData = {
  counts: Record<string, Record<string, Count>>;
  tries: Record<string, Record<string, Try[]>>;
  totals: Record<string, { wrong: number; n: number; errors: number }>;
  runCount: number;
};

export type Step =
  | { kind: 'tool'; name: string; args: Record<string, unknown>; result: unknown }
  | { kind: 'text'; text: string }
  | { kind: 'message'; from: string; text: string };

export type Run = {
  id: string;
  experiment: string;
  model: string;
  condition: string;
  setupName: string;
  sample: number;
  verdict: Verdict;
  ending: string;
  money: { ok: boolean; note: string };
  truth: { ok: boolean; note: string; matched?: string } | null;
  from: string;
  message: string;
  followUp: string | null;
  steps: Step[];
  reply: string | null;
  error: string | null;
  tokens: number;
};

export type Method = {
  notes: string;
  tools: { name: string; description: string; params: string[] }[];
  prompts: Record<string, string>;
  conditions: Record<string, string>;
  scenarios: Record<string, { title: string; trap: string; from: string; message: string; followUp: string | null }>;
};

const experimentsData = experimentsJson as unknown as Record<string, ExperimentData>;
const runs = runsJson as unknown as Record<string, Run>;
export const method = methodJson as unknown as Method;

export const experiments = EXPERIMENTS;
export const getExperiment = (slug: string): Experiment | undefined => EXPERIMENTS.find((e) => e.slug === slug);
export const getExperimentData = (slug: string): ExperimentData => experimentsData[slug];
export const getRun = (id: string): Run | undefined => runs[id];
export const allRunIds = (): string[] => Object.keys(runs);

export const findRunId = (exp: ExperimentData, model: string, condition: string, sample: number) =>
  exp.tries[model]?.[condition]?.find((t) => t.sample === sample)?.id;

export const formatDate = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// Models best first: fewest wrong in the experiment's first setup (no hint), then fewest wrong overall.
// Every chart and table uses this order, so a model sits in the same place everywhere.
export const rankModels = (exp: Experiment, data: ExperimentData): string[] => {
  const first = exp.setups[0].id;
  const all = (m: string) => exp.setups.reduce((n, s) => n + data.counts[m][s.id].wrong, 0);
  return [...exp.models].sort((a, b) => data.counts[a][first].wrong - data.counts[b][first].wrong || all(a) - all(b));
};
