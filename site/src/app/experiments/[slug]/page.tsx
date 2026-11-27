import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { NxHeader } from '@/components/NxHeader';
import { TwoRecords } from '@/components/a/TwoRecords';
import { Exhibit } from '@/components/b/Exhibit';
import { StepChart } from '@/components/grid/StepChart';
import { OneSentence } from '@/components/note/OneSentence';
import { Play } from '@/components/Play';
import { PublicTally } from '@/components/PublicTally';
import { ResultsTable } from '@/components/ResultsTable';
import { TryGrid } from '@/components/TryGrid';
import { CopyButton } from '@/components/CopyButton';
import { HOW_STEPS } from '@/content/how-it-works';
import { MODELS } from '@/content/models';
import { PUBLIC_PROMPTS } from '@/content/public-prompts';
import { experiments, formatDate, getExperiment, getExperimentData, method, rankModels } from '@/lib/data';
import { exhibitFacts } from '@/lib/exhibit';

export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<'/experiments/[slug]'>): Promise<Metadata> {
  const exp = getExperiment((await params).slug);
  return exp ? { title: exp.eyebrow, description: exp.claim } : {};
}

const REPO = 'https://github.com/abubakar2906/Intact';

// An experiment, written up as a research note on the lab's sidebar grid. Facts, section numbers and figure
// numbers sit in the left column; the text reads beside them; figures run across the page. Every figure and
// count is read from the published runs.
export default async function ExperimentPage({ params }: PageProps<'/experiments/[slug]'>) {
  const { slug } = await params;
  const exp = getExperiment(slug);
  if (!exp) notFound();
  const data = getExperimentData(slug);
  const scenario = method.scenarios[exp.scenario];
  const n = String(exp.number).padStart(2, '0');
  const models = rankModels(exp, data).reverse();
  const facts = exhibitFacts(exp, data);
  const setupName = (id: string) => exp.setups.find((s) => s.id === id)?.name ?? id;
  const first = exp.setups[0];
  const total = data.totals[first.id];
  const year = exp.date.slice(0, 4);
  const citation = `Yinusa, A. (${year}). Intact: a benchmark for AI agents that move money. ${REPO}`;
  const bibtex = `@software{yinusa${year}intact,\n  title  = {Intact: a benchmark for AI agents that move money},\n  author = {Yinusa, Abubakar},\n  year   = {${year}},\n  url    = {${REPO}}\n}`;

  // Figures are numbered in the order they appear.
  let fig = 0;
  const next = () => ++fig;
  let sec = 0;
  const num = () => String(++sec).padStart(2, '0');

  const shift = (from: string, to: string) => models.map((m) => ({
    name: MODELS[m].name, logo: MODELS[m].logo, ink: !!MODELS[m].ink,
    before: data.counts[m][from].wrong, note: data.counts[m].A?.wrong ?? 0, after: data.counts[m][to].wrong, n: data.counts[m][from].n,
  }));

  return (
    <div className="note nx">
      <NxHeader />
      <main>
        <section className="nx-row nx-hero">
          <p className="nx-side">Experiment {n}</p>
          <div className="nx-main nx-main-wide"><h1>{exp.claim}</h1></div>
        </section>

        <section className="nx-row nx-intro">
          <dl className="nx-side nx-facts">
            <div><dt>Published</dt><dd>{formatDate(exp.date)}</dd></div>
            <div><dt>Tries</dt><dd>{data.runCount}</dd></div>
            <div><dt>Models</dt><dd>{exp.models.length}</dd></div>
            <div><dt>Setups</dt><dd>{exp.setups.length}</dd></div>
            <div><dt>Data</dt><dd><a href="#every-try">Every try</a></dd></div>
          </dl>
          <div className="nx-main nx-prose">
            <p className="lede">{exp.lede}</p>
            <p>{exp.whyItMatters}</p>
          </div>
        </section>

        {/* The trap, shown with one real try. */}
        {facts && (() => {
          const f = next();
          return (
            <>
              <section className="nx-row nx-section">
                <p className="nx-side">{num()}</p>
                <div className="nx-main nx-prose">
                  <h2>The trap</h2>
                  <p>
                    {scenario.from.split(',')[0]} writes in: his payout shows as failed, please send it again. Ledgerline’s record says failed. The bank’s says paid.
                    Figure {f} is one agent’s try, call by call, beside the bank’s record of the same payment.
                  </p>
                </div>
              </section>
              <figure className="nx-fig">
                <Play>
                  <TwoRecords facts={facts} agent={<Exhibit facts={facts} setupName={setupName(facts.run.condition)} wrongLabel={exp.wrong} />} />
                </Play>
                <figcaption className="nx-cap"><span className="nx-side">Figure {f}</span><span className="nx-main">{MODELS[facts.run.model].name}, {setupName(facts.run.condition).toLowerCase()}, try {facts.run.sample}. On the left, what the agent did; the notes say what it could not see. On the right, the bank’s record.</span></figcaption>
              </figure>
            </>
          );
        })()}

        {/* The results, by model. */}
        {(() => {
          const f = next();
          return (
            <>
              <section className="nx-row nx-section">
                <p className="nx-side">{num()}</p>
                <div className="nx-main nx-prose">
                  <h2>Results</h2>
                  <p>
                    With no hint, agents paid twice in {total.wrong} of {total.n} tries. {exp.setups.slice(1).map((s) => `${s.name}: ${data.totals[s.id].wrong} of ${data.totals[s.id].n}`).join('. ')}.
                    Figure {f} shows each model on its own.
                  </p>
                </div>
              </section>
              <figure className="nx-fig">
                <div className="gp-multiples">
                  {models.map((m) => (
                    <StepChart key={m} max={10} title={MODELS[m].name}
                      steps={exp.setups.map((s) => ({ name: s.name, wrong: data.counts[m][s.id].wrong, n: data.counts[m][s.id].n }))}
                      label={`${MODELS[m].name}, tries that paid twice out of 10: ` + exp.setups.map((s) => `${s.name} ${data.counts[m][s.id].wrong}`).join(', ') + '.'} />
                  ))}
                </div>
                <figcaption className="nx-cap"><span className="nx-side">Figure {f}</span><span className="nx-main">Tries that paid twice, out of 10, for each model, in the four setups from left to right: {exp.setups.map((s) => s.name.toLowerCase()).join(', ')}.</span></figcaption>
                <details className="nx-details">
                  <summary>The counts as a table</summary>
                  <ResultsTable exp={exp} data={data} />
                </details>
              </figure>
            </>
          );
        })()}

        {/* The story beats, each with its figure. */}
        {exp.beats.map((b) => {
          const f = b.show ? next() : 0;
          const run = b.show?.kind === 'run' ? exhibitFacts(exp, data, { model: b.show.model, condition: b.show.condition, sample: b.show.sample }) : null;
          return (
            <div key={b.heading}>
              <section className="nx-row nx-section">
                <p className="nx-side">{num()}</p>
                <div className="nx-main nx-prose">
                  <h2>{b.heading}</h2>
                  <p>{b.body}</p>
                </div>
              </section>
              {b.show?.kind === 'split' && (
                <figure className="nx-fig">
                  <OneSentence rows={shift('B', 'A')} noteMark={false} label={`Tries that paid twice out of 10, no hint against a note in the docs, per model.`} />
                  <OneSentence rows={shift('B', 'A')} noteMark={false} narrow label={`Tries that paid twice out of 10, no hint against a note in the docs, per model.`} />
                  <figcaption className="nx-cap"><span className="nx-side">Figure {f}</span><span className="nx-main">Tries that paid twice, out of 10. The red dot is no hint; the ring is the same model given the note in the docs. Where the ring stays on the dot, the note made no difference.</span></figcaption>
                </figure>
              )}
              {run && (
                <figure className="nx-fig nx-fig-narrow">
                  <Play>
                    <Exhibit facts={run} setupName={setupName(run.run.condition)} wrongLabel={exp.wrong} fullReply />
                  </Play>
                  <figcaption className="nx-cap"><span className="nx-side">Figure {f}</span><span className="nx-main">{MODELS[run.run.model].name}, {setupName(run.run.condition).toLowerCase()}, try {run.run.sample}: the one try under the one sentence that paid twice, with its whole reply.</span></figcaption>
                </figure>
              )}
              {b.show?.kind === 'public' && (
                <figure className="nx-fig nx-fig-narrow">
                  <PublicTally />
                  <figcaption className="nx-cap"><span className="nx-side">Figure {f}</span><span className="nx-main">{PUBLIC_PROMPTS.sources} public payment-agent examples, one square each, filled where the instructions say it. <a href={`${REPO}/blob/main/docs/public-prompts.md`}>Every source, with the lines quoted</a>.</span></figcaption>
                </figure>
              )}
            </div>
          );
        })}

        <section className="nx-row nx-section">
          <p className="nx-side">{num()}</p>
          <div className="nx-main nx-prose">
            <h2>How Intact grades it</h2>
            <ol className="nx-steps">
              {HOW_STEPS.map((s) => <li key={s.title}><span><b>{s.title}.</b> {s.body}</span></li>)}
            </ol>
            <p><Link href="/method">The method in full</Link></p>
          </div>
        </section>

        <section className="nx-row nx-section" id="every-try">
          <p className="nx-side">{num()}</p>
          <div className="nx-main nx-prose">
            <h2>Every try</h2>
            <p>Each square is one try. Open any of them to read exactly what the agent did and said.</p>
          </div>
        </section>
        <div className="nx-fig">
          <TryGrid models={rankModels(exp, data)} setups={exp.setups.map((s) => ({ id: s.id, name: s.name }))} tries={data.tries} wrongLabel={exp.wrong} />
          <div className="nx-cap nx-downloads" id="data">
            <span className="nx-side">Data</span>
            <span className="nx-main nx-links">
              <a href={`/data/intact-${exp.slug}.csv`} download>CSV, one row per try</a>
              {data.folders.map((f) => <a key={f} href={`${REPO}/tree/main/results/${f}`}>Full transcripts, {f.split('-').pop()} run</a>)}
            </span>
          </div>
        </div>

        <section className="nx-row nx-section">
          <p className="nx-side">{num()}</p>
          <div className="nx-main nx-prose">
            <h2>The setup</h2>
            <p>The message from {scenario.from}, word for word:</p>
            <blockquote className="nx-quote">{scenario.message}</blockquote>
            <details className="nx-details">
              <summary>The agent’s instructions, for each setup</summary>
              {exp.setups.map((s) => (
                <div key={s.id} className="nx-setup">
                  <p className="nx-setup-name">{s.name}</p>
                  <pre>{method.prompts[s.id]}</pre>
                </div>
              ))}
            </details>
          </div>
        </section>

        <section className="nx-row nx-section">
          <p className="nx-side">{num()}</p>
          <div className="nx-main nx-prose">
            <h2>Limits</h2>
            <ol className="nx-steps">
              {exp.limits.map((l) => <li key={l}>{l}</li>)}
            </ol>
          </div>
        </section>

        <section className="nx-row nx-section nx-end" aria-labelledby="cite">
          <p className="nx-side">Cite</p>
          <div className="nx-main">
            <h2 id="cite" className="sr-only">Cite this</h2>
            <p id="cite-text" className="nx-cite">{citation}</p>
            <div className="nx-cite-actions"><CopyButton text={citation} targetId="cite-text" label="Copy citation" /><CopyButton text={bibtex} targetId="cite-bibtex" label="Copy BibTeX" /></div>
            <pre id="cite-bibtex" className="nx-bib">{bibtex}</pre>
          </div>
        </section>
      </main>
      <Footer wide />
    </div>
  );
}
