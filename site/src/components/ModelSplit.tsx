import type { Experiment } from '@/content/experiments';
import type { ExperimentData } from '@/lib/data';
import { ModelName } from './ModelName';
import { CountUp, Reveal } from './Reveal';

// The same models with and without the note in the docs, side by side: who read it, who didn't.
// The squares fill one by one when the chart scrolls into view, a row a little after the one above.
// On a phone the model name gets its own line, so both columns of squares still fit side by side.
export function ModelSplit({ exp, data, without = 'B', withNote = 'A' }: { exp: Experiment; data: ExperimentData; without?: string; withNote?: string }) {
  const name = (id: string) => exp.setups.find((s) => s.id === id)?.name ?? id;
  const rows = [...exp.models].sort((a, b) => data.counts[a][withNote].wrong - data.counts[b][withNote].wrong);
  const most = Math.max(...exp.models.flatMap((m) => [data.counts[m][without].n, data.counts[m][withNote].n]));
  const Cell = ({ n, of, row }: { n: number; of: number; row: number }) => (
    <span className="flex items-center gap-2.5">
      <span className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: of }, (_, i) => (
          <span
            key={i}
            className={`size-2.5 rounded-[2px] sm:size-3 ${i < n ? 'reveal-fill bg-red' : 'bg-track'}`}
            style={{ '--delay': `${row * 80 + i * 60}ms` } as React.CSSProperties}
          />
        ))}
      </span>
      <CountUp to={n} delay={row * 80} className="font-mono text-[14px]" hot="text-red" cold="text-faint" />
    </span>
  );
  const head = 'font-mono text-[12px] uppercase tracking-[0.08em] text-faint';
  return (
    <Reveal>
    <div role="table" aria-label={`${exp.wrong}, out of ${most} tries, ${name(without)} against ${name(withNote)}`}>
      <div role="row" className="grid grid-cols-2 gap-4 pb-3 sm:grid-cols-[190px_1fr_1fr]">
        <span role="columnheader" className={`hidden sm:block ${head}`}>{exp.wrong}, out of {most}</span>
        <span role="columnheader" className={head}>{name(without)}</span>
        <span role="columnheader" className={head}>{name(withNote)}</span>
      </div>
      {rows.map((m, row) => (
        <div key={m} role="row" className="grid grid-cols-2 items-center gap-x-4 gap-y-2 border-t border-line py-3 sm:grid-cols-[190px_1fr_1fr]">
          <span role="rowheader" className="col-span-2 sm:col-span-1"><ModelName id={m} size={18} className="text-[15px] font-medium" /></span>
          <span role="cell"><Cell n={data.counts[m][without].wrong} of={data.counts[m][without].n} row={row} /></span>
          <span role="cell"><Cell n={data.counts[m][withNote].wrong} of={data.counts[m][withNote].n} row={row} /></span>
        </div>
      ))}
    </div>
    </Reveal>
  );
}
