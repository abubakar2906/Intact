import type { Experiment } from '@/content/experiments';
import { rankModels, type ExperimentData } from '@/lib/data';
import { ModelName } from './ModelName';
import { CountUp, Reveal } from './Reveal';

// One panel per setup: its total, then a bar per model. Red is the only colour, and it means a failed try.
// Each panel grows from zero when it scrolls into view, a row at a time.
// `panel` styles each setup's panel, for pages that set them on cards.
export function SetupBars({ exp, data, compact = false, panel = '' }: { exp: Experiment; data: ExperimentData; compact?: boolean; panel?: string }) {
  const models = rankModels(exp, data);
  return (
    <div className={`grid gap-x-16 gap-y-12 ${compact ? 'md:grid-cols-2' : 'lg:grid-cols-2'}`}>
      {exp.setups.map((s) => {
        const total = data.totals[s.id];
        return (
          <Reveal key={s.id}>
          <section className={`flex flex-col gap-3 ${panel}`} aria-label={`${s.name}: ${total.wrong} of ${total.n} tries ${exp.wrong.toLowerCase()}`}>
            <header className="mb-2 flex items-start justify-between gap-6 border-b border-line pb-4">
              <div className="min-w-0">
                <h3 className="text-[20px] leading-snug">{s.name}</h3>
                <p className="mt-1 max-w-sm text-[14px] leading-relaxed text-muted">{s.what}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-[40px] font-medium leading-none tracking-tight"><CountUp to={total.wrong} hot="text-red" cold="text-ink" /></p>
                <p className="mt-1.5 font-mono text-[13px] text-faint">of {total.n}</p>
              </div>
            </header>
            {models.map((m, i) => {
              const c = data.counts[m][s.id];
              return (
                <div key={m} className="grid h-8 grid-cols-[minmax(0,170px)_1fr_48px] items-center gap-3 sm:grid-cols-[180px_1fr_52px] sm:gap-4">
                  <ModelName id={m} size={18} className="text-[14px] font-medium sm:text-[15px]" />
                  <span className="relative h-3 overflow-hidden rounded bg-track">
                    <span
                      className="reveal-w absolute inset-y-0 left-0 rounded-r bg-red"
                      style={{ '--to': `${c.n ? (c.wrong / c.n) * 100 : 0}%`, '--delay': `${i * 90}ms` } as React.CSSProperties}
                    />
                  </span>
                  <span className="text-right font-mono text-[15px]">
                    <CountUp to={c.wrong} delay={i * 90} hot="text-red" cold="text-faint" />
                    <span className="text-faint">/{c.n}</span>
                  </span>
                </div>
              );
            })}
          </section>
          </Reveal>
        );
      })}
    </div>
  );
}
