import type { Experiment } from '@/content/experiments';
import { MODELS } from '@/content/models';
import { rankModels, type ExperimentData } from '@/lib/data';
import { ChartFrame, Total } from './ChartFrame';
import { ModelLogo } from './ModelName';

// Three small charts side by side, one per key setup: a bar per model, its logo under it.
// The bars keep the same model order in every card, so a model can be followed across them.
export function SetupCharts({ exp, data }: { exp: Experiment; data: ExperimentData }) {
  const models = rankModels(exp, data);
  const setups = exp.keySetups.map((id) => exp.setups.find((s) => s.id === id)!);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {setups.map((s) => {
        const total = data.totals[s.id];
        return (
          <ChartFrame
            key={s.id}
            className="rounded-2xl border border-line p-5 sm:p-6"
            title={s.name}
            definition={`Times each model ${exp.wrong.toLowerCase()}, out of its tries.`}
            lowerIsBetter
            aside={<Total wrong={total.wrong} n={total.n} />}
          >
            <Bars models={models} values={models.map((m) => data.counts[m][s.id])} />
            <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-faint">{s.what}</p>
          </ChartFrame>
        );
      })}
    </div>
  );
}

function Bars({ models, values }: { models: string[]; values: { wrong: number; n: number }[] }) {
  const max = Math.max(...values.map((v) => v.n), 1);
  // Room under the bars for the logos, and above the tallest bar for its number.
  const plot = 'calc(100% - 28px - 22px)';
  return (
    <ul className="relative grid h-[168px] grid-cols-5 items-end gap-3 sm:gap-4">
      {[0, 0.5, 1].map((f) => (
        <li key={f} aria-hidden className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `calc(28px + ${f} * (100% - 50px))` }} />
      ))}
      {models.map((m, i) => {
        const v = values[i];
        const name = MODELS[m].name;
        return (
          <li key={m} className="relative flex h-full flex-col items-center justify-end" title={`${name}: ${v.wrong} of ${v.n}`}>
            <span className="sr-only">{name}: {v.wrong} of {v.n}</span>
            <span aria-hidden className="flex w-full max-w-[40px] flex-col justify-end" style={{ height: plot }}>
              <span className={`relative block w-full rounded-t-[3px] ${v.wrong ? 'bg-red' : 'bg-faint/40'}`} style={{ height: v.wrong ? `${(v.wrong / max) * 100}%` : '2px' }}>
                <span className={`absolute bottom-full left-1/2 mb-1 -translate-x-1/2 font-mono text-[13px] ${v.wrong ? 'text-red' : 'text-faint'}`}>{v.wrong}</span>
              </span>
            </span>
            <span aria-hidden className="mt-2 grid h-5 place-items-center">
              <ModelLogo id={m} size={18} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
