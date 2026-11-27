import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HomeNav } from '@/components/HomeNav';
import { Footer } from '@/components/Footer';
import { TwoRecords } from '@/components/a/TwoRecords';
import { Exhibit } from '@/components/b/Exhibit';
import { exhibitFacts, storyData } from '@/lib/exhibit';
import { ModelSplit } from '@/components/ModelSplit';
import { SetupLines } from '@/components/SetupLines';
import { ModelLogo } from '@/components/ModelName';
import { Play } from '@/components/Play';
import { TryGrid } from '@/components/TryGrid';
import { ChartFrame } from '@/components/ChartFrame';
import { ResultsTable } from '@/components/ResultsTable';
import { ScrollStory } from '@/components/ScrollStory';
import { MODELS } from '@/content/models';
import { CopyButton } from '@/components/CopyButton';
import { PublicTally } from '@/components/PublicTally';
import { PUBLIC_PROMPTS } from '@/content/public-prompts';
import { experiments, formatDate, getExperiment, getExperimentData, method, rankModels } from '@/lib/data';

export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<'/experiments/[slug]'>): Promise<Metadata> {
  const exp = getExperiment((await params).slug);
  return exp ? { title: exp.eyebrow, description: exp.claim } : {};
}

const REPO = 'https://github.com/abubakar2906/Intact';
// Short setup names for the small charts, where the full ones do not fit.
const SHORT: Record<string, string> = { B: 'No hint', A: 'Docs', C: 'Sentence', D: 'Lock' };

// The experiment page, in the home page's look (.home and .exp in globals.css).
// The charts are the same components as before; .exp points their colours at the home tokens.
export default async function ExperimentPage({ params }: PageProps<'/experiments/[slug]'>) {
  const { slug } = await params;
  const exp = getExperiment(slug);
  if (!exp) notFound();
  const data = getExperimentData(slug);
  const scenario = method.scenarios[exp.scenario];
  const facts = exhibitFacts(exp, data);
  const story = storyData(exp, data, method.tools.map((t) => t.name), (id) => MODELS[id].name);
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
            <div className="home-ctas">
              <a href="#every-try" className="home-btn home-btn-main">Open every try</a>
              <a href="#data" className="home-btn home-btn-quiet">Get the data</a>
            </div>
            <p className="exp-meta">Experiment {n}, published {formatDate(exp.date)}</p>
          </div>
          {facts && (
            <TwoRecords
              facts={facts}
              agent={<Exhibit facts={facts} setupName={exp.setups.find((s) => s.id === facts.run.condition)?.name ?? facts.run.setupName} wrongLabel={exp.wrong} />}
            />
          )}
        </div>
      </header>

      <main>
        {/* What we found: the four figures, every try, then the same counts by model. */}
        <section className="band" aria-labelledby="found">
          <div className="home-wrap">
            <div className="ch-head">
              <h2 id="found">How often agents {wrong}</h2>
            </div>
            <SetupLines
              wrongLabel={exp.wrong}
              setups={exp.setups.map((s) => ({ id: s.id, name: s.name, short: SHORT[s.id] ?? s.name, total: data.totals[s.id] }))}
              models={rankModels(exp, data).reverse().map((m) => ({ id: m, name: MODELS[m].name, logo: <ModelLogo id={m} size={16} />, counts: exp.setups.map((s) => data.counts[m][s.id]) }))}
            />
            <details className="exp-details counts">
              <summary>The counts as a table</summary>
              <div className="exp-card exp-table"><ResultsTable exp={exp} data={data} /></div>
            </details>
          </div>
        </section>

        {exp.beats.map((b, k) => {
          const pick = b.show?.kind === 'run' ? { model: b.show.model, condition: b.show.condition, sample: b.show.sample } : undefined;
          const beatFacts = pick ? exhibitFacts(exp, data, pick) : null;
          const band = k === 1;
          const body = (
            <>
              {b.show?.kind === 'split' && (
                <div className="spread">
                  <div className="ch-head">
                    <h2>{b.heading}</h2>
                    <p>{b.body}</p>
                  </div>
                  <div className="exp-card exp-pad exp-split">
                    <ChartFrame
                      title={`${exp.setups.find((s) => s.id === 'B')?.name} against ${exp.setups.find((s) => s.id === 'A')?.name.toLowerCase()}`}
                      definition={`Times each model ${wrong}, one square per try.`}
                      lowerIsBetter
                    >
                      <ModelSplit exp={exp} data={data} />
                    </ChartFrame>
                  </div>
                </div>
              )}
              {beatFacts && (
                <div className="spread spread-wide">
                  <div className="ch-head">
                    <h2>{b.heading}</h2>
                    <p>{b.body}</p>
                  </div>
                  <Play>
                    <Exhibit facts={beatFacts} setupName={exp.setups.find((s) => s.id === beatFacts.run.condition)?.name ?? beatFacts.run.setupName} wrongLabel={exp.wrong} fullReply />
                  </Play>
                </div>
              )}
              {b.show?.kind === 'public' && (
                <div className="spread">
                  <div className="ch-head">
                    <h2>{b.heading}</h2>
                    <p>{b.body}</p>
                  </div>
                  <div className="tally">
                    <p className="tally-fig"><b>{PUBLIC_PROMPTS.rows[0].count}</b> of {PUBLIC_PROMPTS.sources}</p>
                    <p className="tally-what">public payment-agent examples tell the agent to check a payment’s real status before retrying</p>
                    <PublicTally />
                    <Link href={`${REPO}/blob/main/docs/public-prompts.md`} className="home-more">Every source, with the lines quoted</Link>
                  </div>
                </div>
              )}
            </>
          );
          return band
            ? <section key={b.heading} className="band"><div className="home-wrap">{body}</div></section>
            : <section key={b.heading} className="home-wrap chapter">{body}</section>;
        })}

        <section className="home-wrap chapter" aria-labelledby="how">
          <div className="ch-head">
            <h2 id="how">How Intact grades it</h2>
          </div>
          {story && <ScrollStory story={story} />}
        </section>

        {/* Every try: the grid opens any try in the drawer; then the data to check it yourself. */}
        <section id="every-try" className="band scroll-mt-8" aria-labelledby="every">
          <div className="home-wrap">
            <div className="ch-head">
              <h2 id="every">Every try</h2>
            </div>
            <div className="exp-card exp-pad exp-tries">
              <TryGrid models={rankModels(exp, data)} setups={exp.setups.map((s) => ({ id: s.id, name: s.name }))} tries={data.tries} wrongLabel={exp.wrong} />
            </div>
            <div id="data" className="downloads scroll-mt-8">
              <a href={`/data/intact-${exp.slug}.csv`} download className="dl">
                <b>Download the CSV</b>
                <span>One row per try, {data.runCount} rows</span>
              </a>
              {data.folders.map((f) => (
                // Folders end in the service the run used, e.g. "-groq", which is a shorter name than the folder.
                <a key={f} href={`${REPO}/tree/main/results/${f}`} className="dl">
                  <b>Full transcripts, {f.split('-').pop()} run</b>
                  <span>results/{f}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* The setup, and what this run can and cannot tell you. */}
        <section className="home-wrap chapter" aria-labelledby="setup">
          <div className="ch-head">
            <h2 id="setup">The setup, and its limits</h2>
          </div>
          <div className="setup">
            <div>
              <h3 className="ch-h3">What the agent got</h3>
              <div className="st-msg setup-msg">
                <p className="st-label">Message from {scenario.from}</p>
                <p>“{scenario.message}”</p>
              </div>
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
            <div>
              <h3 className="ch-h3">Limits</h3>
              <ol className="limits">
                {exp.limits.map((l) => <li key={l}>{l}</li>)}
              </ol>
            </div>
          </div>
          <section className="exp-cite" aria-labelledby="cite">
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
        </section>
      </main>
      <div className="exp-foot"><Footer wide /></div>
    </div>
  );
}
