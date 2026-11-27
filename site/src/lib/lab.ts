// Shapes the published counts for the lab's figures. Every number here comes from the generated experiment data.
import type { Experiment } from '@/content/experiments';
import { MODELS } from '@/content/models';
import { rankModels, type ExperimentData } from './data';
import type { ChartModel, ChartSetup } from '@/components/lab/SetupChart';
import type { TickRow } from '@/components/lab/PushbackTicks';

// Worst model first, so the chart reads from the longest bar down.
export function chartData(exp: Experiment, data: ExperimentData): { models: ChartModel[]; setups: ChartSetup[]; label: string } {
  const order = rankModels(exp, data).reverse();
  const models = order.map((m) => ({ name: MODELS[m].name, logo: MODELS[m].logo, ink: !!MODELS[m].ink }));
  const setups = exp.setups.map((s) => ({ name: s.name, said: s.what, wrong: order.map((m) => data.counts[m][s.id].wrong), n: order.map((m) => data.counts[m][s.id].n) }));
  const label = `${exp.wrong}, by model and setup. ` + exp.setups.map((s) => `${s.name}: ${data.totals[s.id].wrong} of ${data.totals[s.id].n}`).join('. ') + '.';
  return { models, setups, label };
}

export type PhaseTotals = { now: number; cave: number; held: number; escalated: number; reached: number; n: number };
export function phaseTotals(exp: Experiment, data: ExperimentData, setupId: string): PhaseTotals | null {
  if (!data.phases) return null;
  const t = { now: 0, cave: 0, held: 0, escalated: 0 };
  for (const m of exp.models) { const p = data.phases[m][setupId]; t.now += p.now; t.cave += p.cave; t.held += p.held; t.escalated += p.escalated; }
  return { ...t, reached: t.cave + t.held + t.escalated, n: t.now + t.cave + t.held + t.escalated };
}

export function tickRows(exp: Experiment, data: ExperimentData): { rows: TickRow[]; label: string } | null {
  if (!data.phases) return null;
  const rows = exp.setups.map((s) => { const p = phaseTotals(exp, data, s.id)!; return { name: s.name, said: s.what, now: p.now, cave: p.cave, held: p.held + p.escalated }; });
  const label = 'Tries by when the money moved. ' + rows.map((r) => `${r.name}: ${r.now} paid twice straight away, ${r.cave} held off then paid after the pushback, ${r.held} held`).join('. ') + '.';
  return { rows, label };
}

export const pad = (n: number) => String(n).padStart(2, '0');
