import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { SetupBars } from '@/components/SetupBars';
import { ModelSplit } from '@/components/ModelSplit';
import { RunCard } from '@/components/RunCard';
import { TryGrid } from '@/components/TryGrid';
import { Claim } from '@/components/Claim';
import { ModelName } from '@/components/ModelName';
import { experiments, findRunId, formatDate, getExperiment, getExperimentData, getRun, method } from '@/lib/data';

export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<'/experiments/[slug]'>): Promise<Metadata> {
  const exp = getExperiment((await params).slug);
  return exp ? { title: exp.eyebrow, description: exp.claim } : {};
}

export default async function ExperimentPage({ params }: PageProps<'/experiments/[slug]'>) {
  const { slug } = await params;
  const exp = getExperiment(slug);
  if (!exp) notFound();
  const data = getExperimentData(slug);
  const scenario = method.scenarios[exp.scenario];
  const n = String(exp.number).padStart(2, '0');

  return (
    <main>
      <SiteHeader />
      <article className="mx-auto max-w-6xl px-6 sm:px-10">
        <header className="pt-10 sm:pt-16">
          <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-faint">
            Experiment {n} · {exp.eyebrow} · {formatDate(exp.date)}
          </p>
          <h1 className="mt-5 max-w-5xl text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[52px]">
            <Claim text={exp.claim} highlight={exp.claimHighlight} />
          </h1>
          <p className="mt-6 max-w-2xl text-[18px] leading-relaxed text-muted">{exp.lede}</p>
        </header>

        <section className="mt-16 sm:mt-20" aria-label="Results by setup">
          <SetupBars exp={exp} data={data} />
        </section>

        {exp.beats.map((b, i) => {
          const runId = b.show?.kind === 'run' ? findRunId(data, b.show.model, b.show.condition, b.show.sample) : undefined;
          const run = runId ? getRun(runId) : undefined;
          return (
            // A run card needs the full width to read. A short visual sits beside its text.
            <section key={b.heading} className={`mt-24 grid gap-10 ${run ? '' : 'lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16'} ${i === 0 ? 'sm:mt-28' : ''}`}>
              <div className={run ? 'max-w-2xl' : 'lg:pt-1'}>
                <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.015em] sm:text-[30px]">{b.heading}</h2>
                <p className="mt-4 text-[17px] leading-relaxed text-muted">{b.body}</p>
                {run && (
                  <p className="mt-6 text-[15px] text-muted">
                    <ModelName id={run.model} size={18} className="font-medium text-ink" />
                    <span className="ml-1"> · {run.setupName} · try {run.sample}</span>
                  </p>
                )}
              </div>
              <div className="min-w-0">
                {b.show?.kind === 'split' && <ModelSplit exp={exp} data={data} />}
                {run && <RunCard run={run} wrongLabel={exp.wrong} />}
              </div>
            </section>
          );
        })}

        <section id="every-try" className="mt-28 scroll-mt-8">
          <h2 className="text-[26px] font-semibold tracking-[-0.015em] sm:text-[30px]">Every try</h2>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-muted">Each square is one try. Open any of them to see exactly what the agent did and said.</p>
          <div className="mt-10">
            <TryGrid models={exp.models} setups={exp.setups.map((s) => ({ id: s.id, name: s.name }))} tries={data.tries} wrongLabel={exp.wrong} />
          </div>
        </section>

        <section className="mt-28 grid gap-12 border-t border-line pt-12 lg:grid-cols-2">
          <div>
            <h2 className="text-[20px] font-semibold">What the agent got</h2>
            <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.08em] text-faint">Message from {scenario.from}</p>
            <p className="mt-2 font-code text-[15px] leading-[1.75]">{scenario.message}</p>
            <details className="group mt-6">
              <summary className="cursor-pointer text-[15px] text-muted hover:text-ink">The agent’s instructions, for each setup</summary>
              <div className="mt-4 flex flex-col gap-5">
                {exp.setups.map((s) => (
                  <div key={s.id}>
                    <p className="text-[14px] font-semibold">{s.name}</p>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-wash p-4 font-mono text-[13px] leading-relaxed text-muted">{method.prompts[s.id]}</pre>
                  </div>
                ))}
              </div>
            </details>
            <Link href="/method" className="mt-6 inline-block text-[15px] text-muted underline underline-offset-4 hover:text-ink">How grading works</Link>
          </div>
          <div>
            <h2 className="text-[20px] font-semibold">Limits</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {exp.limits.map((l) => (
                <li key={l} className="text-[16px] leading-relaxed text-muted">{l}</li>
              ))}
            </ul>
          </div>
        </section>
      </article>
    </main>
  );
}
