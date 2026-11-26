import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HeroCard } from '@/components/HeroCard';
import { Footer } from '@/components/Footer';
import { SetupBars } from '@/components/SetupBars';
import { ModelSplit } from '@/components/ModelSplit';
import { RunCard } from '@/components/RunCard';
import { TryGrid } from '@/components/TryGrid';
import { Claim } from '@/components/Claim';
import { ModelName } from '@/components/ModelName';
import { ChartFrame } from '@/components/ChartFrame';
import { ResultsTable } from '@/components/ResultsTable';
import { Flow } from '@/components/Flow';
import { CopyButton } from '@/components/CopyButton';
import { experiments, findRunId, formatDate, getExperiment, getExperimentData, getRun, method, rankModels } from '@/lib/data';

export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<'/experiments/[slug]'>): Promise<Metadata> {
  const exp = getExperiment((await params).slug);
  return exp ? { title: exp.eyebrow, description: exp.claim } : {};
}

const REPO = 'https://github.com/abubakar2906/Intact';

export default async function ExperimentPage({ params }: PageProps<'/experiments/[slug]'>) {
  const { slug } = await params;
  const exp = getExperiment(slug);
  if (!exp) notFound();
  const data = getExperimentData(slug);
  const scenario = method.scenarios[exp.scenario];
  const n = String(exp.number).padStart(2, '0');
  const wrong = exp.wrong.toLowerCase();
  const year = exp.date.slice(0, 4);
  const citation = `Yinusa, A. (${year}). Intact: a benchmark for AI agents that move money. ${REPO}`;
  const bibtex = `@software{yinusa${year}intact,\n  title  = {Intact: a benchmark for AI agents that move money},\n  author = {Yinusa, Abubakar},\n  year   = {${year}},\n  url    = {${REPO}}\n}`;
  const moneyTools = method.tools.filter((t) => ['create_transfer', 'get_transfer', 'verify_transfer', 'create_refund'].includes(t.name)).map((t) => t.name);

  return (
    <>
      <HeroCard still>
        <header className="relative mx-auto w-full max-w-6xl px-6 pb-12 pt-10 sm:px-10 sm:pb-16 sm:pt-20">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-white/60 sm:text-[13px]">
            Experiment {n} · {exp.eyebrow} · {formatDate(exp.date)}
          </p>
          <h1 className="mt-5 max-w-5xl text-[36px] leading-[1.04] tracking-[-0.04em] sm:text-[60px]">
            <Claim text={exp.claim} highlight={exp.claimHighlight} onDark />
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-white/75 sm:text-[19px]">{exp.lede}</p>
        </header>
      </HeroCard>

      <main className="flex-1 pb-24">
        <article className="mx-auto max-w-6xl px-6 sm:px-10">
          <section className="mt-14 sm:mt-20" aria-label="Why it matters">
            <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-faint">Why it matters</p>
            <p className="mt-4 max-w-3xl font-display text-[24px] leading-snug tracking-[-0.02em] sm:text-[30px]">{exp.whyItMatters}</p>
          </section>

          <section className="mt-16 sm:mt-24">
            <ChartFrame
              level={2}
              title={`${exp.wrong}, by setup`}
              definition={`Times each model ${wrong}, out of its tries, in each of the ${exp.setups.length} setups.`}
              lowerIsBetter
            >
              <div className="mt-4"><SetupBars exp={exp} data={data} /></div>
            </ChartFrame>
          </section>

          <section className="mt-20">
            <ChartFrame
              level={2}
              title="Every model, every setup"
              definition={`The same counts as one table, sorted by ${exp.setups[0].name.toLowerCase()}.`}
              lowerIsBetter
            >
              <ResultsTable exp={exp} data={data} />
            </ChartFrame>
          </section>

          {exp.beats.map((b) => {
            const runId = b.show?.kind === 'run' ? findRunId(data, b.show.model, b.show.condition, b.show.sample) : undefined;
            const run = runId ? getRun(runId) : undefined;
            return (
              // A run card needs the full width to read. A short visual sits beside its text.
              <section key={b.heading} className={`mt-24 grid gap-10 sm:mt-28 ${run ? '' : 'lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16'}`}>
                <div className={run ? 'max-w-2xl' : 'lg:pt-1'}>
                  <h2 className="text-[28px] leading-tight sm:text-[36px]">{b.heading}</h2>
                  <p className="mt-4 text-[17px] leading-relaxed text-muted">{b.body}</p>
                  {run && (
                    <p className="mt-6 text-[15px] text-muted">
                      <ModelName id={run.model} size={18} className="font-medium text-ink" />
                      <span className="ml-1"> · {run.setupName} · try {run.sample}</span>
                    </p>
                  )}
                </div>
                <div className="min-w-0">
                  {b.show?.kind === 'split' && (
                    <ChartFrame
                      title={`${exp.setups.find((s) => s.id === 'B')?.name} against ${exp.setups.find((s) => s.id === 'A')?.name.toLowerCase()}`}
                      definition={`Times each model ${wrong}, one square per try.`}
                      lowerIsBetter
                    >
                      <ModelSplit exp={exp} data={data} />
                    </ChartFrame>
                  )}
                  {run && <RunCard run={run} wrongLabel={exp.wrong} />}
                </div>
              </section>
            );
          })}

          <section className="mt-28" aria-labelledby="how">
            <h2 id="how" className="text-[28px] leading-tight sm:text-[36px]">How Intact works</h2>
            <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted">
              The agent only acts through tools. The tools talk to Ledgerline, and Ledgerline talks to the bank. The grade is read from what moved, never from what the agent says.
            </p>
            <div className="mt-10 rounded-2xl bg-wash p-5 sm:p-8">
              <Flow
                nodes={[
                  { label: 'The agent', note: 'the model under test, given one message' },
                  { label: 'Tools', note: moneyTools.join(', ') + ' and more' },
                  { label: 'Ledgerline', note: 'a made-up provider whose status can lag' },
                  { label: 'The bank', note: 'where the money really moves' },
                ]}
                links={['both', 'both', 'both']}
                result={{ label: 'Grading: where the money went', note: 'read from Ledgerline’s own records of every payment, after the try ends', strong: true }}
              />
            </div>
          </section>

          <section id="every-try" className="mt-28 scroll-mt-8">
            <ChartFrame
              level={2}
              title="Every try"
              definition="Each square is one try. Open any of them to see exactly what the agent did and said."
            >
              <TryGrid models={rankModels(exp, data)} setups={exp.setups.map((s) => ({ id: s.id, name: s.name }))} tries={data.tries} wrongLabel={exp.wrong} />
            </ChartFrame>
          </section>

          <section className="mt-28 grid gap-12 border-t border-line pt-12 lg:grid-cols-2">
            <div>
              <h2 className="text-[24px] leading-tight">What the agent got</h2>
              <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.08em] text-faint">Message from {scenario.from}</p>
              <p className="mt-2 font-code text-[15px] leading-[1.75]">{scenario.message}</p>
              <details className="group mt-6">
                <summary className="cursor-pointer text-[15px] text-muted hover:text-ink">The agent’s instructions, for each setup</summary>
                <div className="mt-4 flex flex-col gap-5">
                  {exp.setups.map((s) => (
                    <div key={s.id}>
                      <p className="text-[14px] font-medium">{s.name}</p>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-wash p-4 font-mono text-[13px] leading-relaxed text-muted">{method.prompts[s.id]}</pre>
                    </div>
                  ))}
                </div>
              </details>
              <Link href="/method" className="mt-6 inline-block text-[15px] text-muted underline underline-offset-4 hover:text-ink">How grading works</Link>
            </div>
            <div>
              <h2 className="text-[24px] leading-tight">Limits</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {exp.limits.map((l) => (
                  <li key={l} className="text-[16px] leading-relaxed text-muted">{l}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-16 border-t border-line pt-12" aria-labelledby="cite">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="cite" className="text-[24px] leading-tight">Cite this</h2>
              <CopyButton text={citation} targetId="cite-text" label="Copy citation" />
            </div>
            <p id="cite-text" className="mt-4 max-w-3xl text-[16px] leading-relaxed text-muted">{citation}</p>
            <div className="mt-6 rounded-xl bg-wash">
              <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5">
                <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-faint">BibTeX</span>
                <CopyButton text={bibtex} targetId="cite-bibtex" label="Copy BibTeX" />
              </div>
              <pre id="cite-bibtex" className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-ink">{bibtex}</pre>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
