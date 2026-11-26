import type { Experiment } from '@/content/experiments';
import { rankModels, type ExperimentData } from '@/lib/data';
import { ModelName } from './ModelName';

// One row per model, one column per setup, best first by the first setup (no hint).
// Each cell is how many of that model's tries went wrong. Red only when money went wrong.
export function ResultsTable({ exp, data }: { exp: Experiment; data: ExperimentData }) {
  const models = rankModels(exp, data);
  const cell = (wrong: number, n: number) => (
    <span className={`whitespace-nowrap font-mono text-[13px] sm:text-[15px] ${wrong ? 'text-red' : 'text-ink'}`}>
      {wrong}<span className="text-faint">/{n}</span>
    </span>
  );
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{exp.wrong}, out of each model’s tries, in each setup</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="py-3 pr-3 align-bottom font-mono text-[12px] font-normal uppercase tracking-[0.08em] text-faint">Model</th>
            {exp.setups.map((s, i) => (
              <th key={s.id} scope="col" className="w-[16%] py-3 pl-2 text-right align-bottom text-[12px] font-medium leading-snug text-muted sm:w-[18%] sm:text-[14px]">
                {s.name}
                {i === 0 && <span className="sr-only"> (sorted by this column)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={m} className="border-b border-line">
              <th scope="row" className="py-3.5 pr-3 font-normal">
                <ModelName id={m} size={18} wrap className="text-[14px] sm:text-[15px]" />
              </th>
              {exp.setups.map((s) => (
                <td key={s.id} className="py-3.5 pl-2 text-right">{cell(data.counts[m][s.id].wrong, data.counts[m][s.id].n)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="py-3.5 pr-3 text-[14px] font-medium sm:text-[15px]">All models</th>
            {exp.setups.map((s) => (
              <td key={s.id} className="py-3.5 pl-2 text-right">{cell(data.totals[s.id].wrong, data.totals[s.id].n)}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
