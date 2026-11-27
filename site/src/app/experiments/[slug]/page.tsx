import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HomeNav } from '@/components/HomeNav';
import { Footer } from '@/components/Footer';
import { Exhibit } from '@/components/b/Exhibit';
import { PromptDiff } from '@/components/b/PromptDiff';
import { exhibitFacts } from '@/lib/exhibit';
import { ModelSplit } from '@/components/ModelSplit';
import { RunCard } from '@/components/RunCard';
import { TryGrid } from '@/components/TryGrid';
import { ModelName } from '@/components/ModelName';
import { ChartFrame } from '@/components/ChartFrame';
import { ResultsTable } from '@/components/ResultsTable';
import { HowItWorks } from '@/components/HowItWorks';
import { CopyButton } from '@/components/CopyButton';
import { PublicTally } from '@/components/PublicTally';
import { PUBLIC_PROMPTS } from '@/content/public-prompts';
import { experiments, findRunId, formatDate, getExperiment, getExperimentData, getRun, method, rankModels } from '@/lib/data';

export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<'/experiments/[slug]'>): Promise<Metadata> {
  const exp = getExperiment((await params).slug);
  return exp ? { title: exp.eyebrow, description: exp.claim } : {};
}

const REPO = 'https://github.com/abubakar2906/Intact';

// The experiment page, in the home page's look (.home and .exp in globals.css).
// The charts are the same components as before; .exp points their colours at the home tokens.
export default async function ExperimentPage({ params }: PageProps<'/experiments/[slug]'>) {
  const { slug } = await params;
  const exp = getExperiment(slug);
  if (!exp) notFound();
  const data = getExperimentData(slug);
  const scenario = method.scenarios[exp.scenario];
  const facts = exhibitFacts(exp, data);
  const n = String(exp.number).padStart(2, '0');
  const wrong = exp.wrong.toLowerCase();
  const year = exp.date.slice(0, 4);
  const citation = `Yinusa, A. (${year}). Intact: a benchmark for AI agents that move money. ${REPO}`;
  const bibtex = `@software{yinusa${year}intact,\n  title  = {Intact: a benchmark for AI agents that move money},\n  author = {Yinusa, Abubakar},\n  year   = {${year}},\n  url    = {${REPO}}\n}`;

  return (
    <div className="home exp">
      <header className="home-hero exp-hero">
        <div className="home-wrap">
          <HomeNav cta={{ href: REPO, label: 'Run it on GitHub' }} />
          <div className="exp-intro">
            <h1>{exp.claim}</h1>
            <p className="home-lede exp-lede">{exp.lede}</p>
            <div className="home-ctas">
              <a href="#every-try" className="home-btn home-btn-main">Open every try</a>
              <a href="#data" className="home-btn home-btn-quiet">Get the data</a>
            </div>
            <p className="exp-meta">Experiment {n}, published {formatDate(exp.date)}</p>
          </div>
          {facts && <Exhibit facts={facts} setupName={exp.setups.find((s) => s.id === facts.run.condition)?.name ?? facts.run.setupName} wrongLabel={exp.wrong} />}
        </div>
      </header>

      <main className="home-wrap">
        <section className="exp-why" aria-label="Why it matters">
          <p className="exp-why-text">{exp.whyItMatters}</p>
        </section>

        <section className="exp-part">
          <ChartFrame
            level={2}
            title="What changed, and what it did"
            definition={`Each setup’s change to the agent’s real instructions, beside how many tries ${wrong}.`}
            lowerIsBetter
          >
            <PromptDiff exp={exp} data={data} />
          </ChartFrame>
        </section>

        <section className="exp-part">
          <ChartFrame
            level={2}
            title="Every model, every setup"
            definition={`The same counts as one table, sorted by ${exp.setups[0].name.toLowerCase()}.`}
            lowerIsBetter
          >
            <div className="exp-card exp-table"><ResultsTable exp={exp} data={data} /></div>
          </ChartFrame>
        </section>

        {exp.beats.map((b) => {
          const runId = b.show?.kind === 'run' ? findRunId(data, b.show.model, b.show.condition, b.show.sample) : undefined;
          const run = runId ? getRun(runId) : undefined;
          return (
            // A run card needs the full width to read. A short visual sits beside its text.
            <section key={b.heading} className={`exp-part exp-beat grid gap-10 ${run ? '' : 'lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16'}`}>
              <div className={run ? 'max-w-2xl' : 'lg:pt-1'}>
                <h2>{b.heading}</h2>
                <p className="exp-body">{b.body}</p>
                {run && (
                  <p className="mt-6 text-[15px] text-muted">
                    <ModelName id={run.model} size={18} className="font-medium text-ink" />
                    <span className="ml-1"> · {run.setupName} · try {run.sample}</span>
                  </p>
                )}
              </div>
              <div className="min-w-0">
                {b.show?.kind === 'split' && (
                  <div className="exp-card exp-pad exp-split">
                    <ChartFrame
                      title={`${exp.setups.find((s) => s.id === 'B')?.name} against ${exp.setups.find((s) => s.id === 'A')?.name.toLowerCase()}`}
                      definition={`Times each model ${wrong}, one square per try.`}
                      lowerIsBetter
                    >
                      <ModelSplit exp={exp} data={data} />
                    </ChartFrame>
                  </div>
                )}
                {b.show?.kind === 'public' && (
                  <div className="exp-card exp-pad">
                    <ChartFrame
                      title="What public payment agents are told"
                      definition={`${PUBLIC_PROMPTS.sources} examples from benchmarks and starter kits, one square each, filled where the instructions say it.`}
                    >
                      <PublicTally />
                      <Link href={`${REPO}/blob/main/docs/public-prompts.md`} className="home-more">Every source, with the lines quoted</Link>
                    </ChartFrame>
                  </div>
                )}
                {run && <RunCard run={run} wrongLabel={exp.wrong} />}
              </div>
            </section>
          );
        })}

        <section className="exp-part" aria-labelledby="how">
          <h2 id="how">How Intact works</h2>
          <p className="exp-body">
            The agent only acts through tools. The tools talk to Ledgerline, and Ledgerline talks to the bank. The grade is read from what moved, never from what the agent says.
          </p>
          <div className="mt-10"><HowItWorks facts={facts} tools={method.tools.map((t) => t.name)} /></div>
        </section>

        <section id="every-try" className="exp-part scroll-mt-8">
          <ChartFrame
            level={2}
            title="Every try"
            definition="Each square is one try. Open any of them to see exactly what the agent did and said."
          >
            <div className="exp-card exp-pad exp-tries">
              <TryGrid models={rankModels(exp, data)} setups={exp.setups.map((s) => ({ id: s.id, name: s.name }))} tries={data.tries} wrongLabel={exp.wrong} />
            </div>
          </ChartFrame>
          <div id="data" className="exp-data scroll-mt-8">
            <p className="text-[15px] font-semibold">Get the data</p>
            <a href={`/data/intact-${exp.slug}.csv`} download className="home-btn home-btn-quiet home-btn-sm">
              Download CSV, one row per try
            </a>
            {data.folders.map((f) => (
              // Folders end in the service the run used, e.g. "-groq", which is a shorter name than the folder.
              <a key={f} href={`${REPO}/tree/main/results/${f}`} title={`results/${f}`} className="exp-link">
                Full transcripts, {f.split('-').pop()} run
              </a>
            ))}
          </div>
        </section>

        <section className="exp-part grid gap-6 lg:grid-cols-2">
          <div className="exp-card exp-pad">
            <h2 className="exp-h-sm">What the agent got</h2>
            <p className="exp-label mt-4">Message from {scenario.from}</p>
            <p className="mt-2 font-code text-[15px] leading-[1.75]">{scenario.message}</p>
            <details className="exp-details mt-6">
              <summary>The agent’s instructions, for each setup</summary>
              <div className="mt-4 flex flex-col gap-5">
                {exp.setups.map((s) => (
                  <div key={s.id}>
                    <p className="text-[14px] font-semibold">{s.name}</p>
                    <pre className="exp-code mt-2 whitespace-pre-wrap">{method.prompts[s.id]}</pre>
                  </div>
                ))}
              </div>
            </details>
            <Link href="/method" className="home-more">How grading works</Link>
          </div>
          <div className="exp-card exp-pad">
            <h2 className="exp-h-sm">Limits</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {exp.limits.map((l) => (
                <li key={l} className="text-[16px] leading-relaxed text-muted">{l}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="exp-part exp-cite" aria-labelledby="cite">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="cite" className="exp-h-sm">Cite this</h2>
            <CopyButton text={citation} targetId="cite-text" label="Copy citation" />
          </div>
          <p id="cite-text" className="mt-4 max-w-3xl text-[16px] leading-relaxed text-muted">{citation}</p>
          <div className="exp-card mt-6 overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
              <span className="exp-label">BibTeX</span>
              <CopyButton text={bibtex} targetId="cite-bibtex" label="Copy BibTeX" />
            </div>
            <pre id="cite-bibtex" className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-ink">{bibtex}</pre>
          </div>
        </section>
      </main>
      <div className="exp-foot"><Footer wide /></div>
    </div>
  );
}
