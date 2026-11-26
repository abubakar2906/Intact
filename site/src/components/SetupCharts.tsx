import type { Experiment } from '@/content/experiments';
import { MODELS } from '@/content/models';
import { rankModels, type ExperimentData } from '@/lib/data';
import { ChartFrame } from './ChartFrame';
import { ModelLogo } from './ModelName';
import { CountUp, Reveal } from './Reveal';

// Three small charts side by side, one per key setup: a bar per model, its logo under it.
// The bars keep the same model order in every card, so a model can be followed across them.
// Motion tells the story: the first card's bars rise from zero, then each later card starts at the first card's
// heights and falls to its own, so the reader sees what the change took away.
const STAGE = 1100;

export function SetupCharts({ exp, data }: { exp: Experiment; data: ExperimentData }) {
  const models = rankModels(exp, data);
  const setups = exp.keySetups.map((id) => exp.setups.find((s) => s.id === id)!);
  const base = setups[0].id;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {setups.map((s, i) => {
        const total = data.totals[s.id];
        const fromTotal = i === 0 ? 0 : data.totals[base].wrong;
        return (
          <Reveal key={s.id} stage={i * STAGE} className="flex">
            <ChartFrame
              className="w-full rounded-2xl border border-line p-5 sm:p-6"
              title={s.name}
              definition={`Times each model ${exp.wrong.toLowerCase()}, out of its tries.`}
              lowerIsBetter
              aside={
                <>
                  <p className="font-mono text-[30px] font-medium leading-none tracking-tight">
                    <CountUp from={fromTotal} to={total.wrong} hot="text-red" cold="text-ink" />
                  </p>
                  <p className="mt-1.5 font-mono text-[12px] text-faint">of {total.n}</p>
                </>
              }
            >
              <Bars
                models={models}
                values={models.map((m) => data.counts[m][s.id])}
                from={models.map((m) => (i === 0 ? 0 : data.counts[m][base].wrong))}
              />
              <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-faint">{s.what}</p>
            </ChartFrame>
          </Reveal>
        );
      })}
    </div>
  );
}

function Bars({ models, values, from }: { models: string[]; values: { wrong: number; n: number }[]; from: number[] }) {
  const max = Math.max(...values.map((v) => v.n), 1);
  // Room under the bars for the logos, and above the tallest bar for its number.
  const plot = 'calc(100% - 28px - 22px)';
  const size = (wrong: number) => (wrong ? `${(wrong / max) * 100}%` : '2px');
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
              <span
                className={`reveal-h relative block w-full rounded-t-[3px] ${v.wrong ? 'bg-red' : 'bg-faint/40'}`}
                style={{
                  '--to': size(v.wrong),
                  '--from': from[i] ? size(from[i]) : '0px',
                  // A bar that falls to zero stays red on the way down, then fades to the grey of an empty bar.
                  '--from-color': from[i] || v.wrong ? 'var(--color-red)' : 'transparent',
                  '--delay': `calc(var(--stage) + ${i * 70}ms)`,
                } as React.CSSProperties}
              >
                <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 font-mono text-[13px]">
                  <CountUp from={from[i]} to={v.wrong} delay={i * 70} hot="text-red" cold="text-faint" />
                </span>
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
