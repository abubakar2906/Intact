import Link from 'next/link';
import { StepChart } from '@/components/grid/StepChart';
import { UPDATES } from '@/content/updates';
import { experiments, formatDate, getExperimentData } from '@/lib/data';

// The lab's research, newest first: what is in progress, then each published experiment with its finding.
// `figures` adds each experiment's step chart under it, for the results list page.
export function ResearchList({ figures = false }: { figures?: boolean }) {
  const next = UPDATES.filter((u) => u.next);
  return (
    <div className="rl">
      {next.map((u) => (
        <div key={u.title} className="rl-row">
          <p className="nx-side">In progress</p>
          <div className="nx-main"><h3 className="rl-title rl-next">{u.title}</h3></div>
        </div>
      ))}
      {experiments.map((e) => {
        const data = getExperimentData(e.slug);
        const n = String(e.number).padStart(2, '0');
        const steps = e.setups.map((s) => ({ name: s.name, wrong: data.totals[s.id].wrong, n: data.totals[s.id].n }));
        return (
          <article key={e.slug}>
            <div className="rl-row">
              <dl className="nx-side rl-meta">
                <dt className="sr-only">Experiment</dt><dd>Experiment {n}</dd>
                <dt className="sr-only">Published</dt><dd>{formatDate(e.date)}</dd>
                <dt className="sr-only">Tries</dt><dd>{data.runCount} tries, {e.models.length} models</dd>
              </dl>
              <div className="nx-main">
                <h3 className="rl-title"><Link href={`/experiments/${e.slug}`}>{e.claim}</Link></h3>
                {figures && <p className="rl-lede">{e.lede}</p>}
                <p className="rl-link"><Link href={`/experiments/${e.slug}`}>Read it, and open every try</Link></p>
              </div>
            </div>
            {figures && (
              <figure className="rl-fig">
                <StepChart steps={steps} max={Math.max(...steps.map((s) => s.n))} big label={`${e.wrong}, by setup: ` + steps.map((s) => `${s.name} ${s.wrong} of ${s.n}`).join(', ') + '.'} />
                <figcaption className="nx-cap"><span className="nx-side">Experiment {n}</span><span className="nx-main">Tries that {e.wrong.toLowerCase()}, as each setup told the agent more.</span></figcaption>
              </figure>
            )}
          </article>
        );
      })}
    </div>
  );
}
