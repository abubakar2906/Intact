import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyButton } from '@/components/CopyButton';
import { Flow } from '@/components/lab/Flow';
import { CaveChat, Records } from '@/components/lab/Evidence';
import { LabFooter, LabHeader } from '@/components/lab/LabHeader';
import { PushbackTicks } from '@/components/lab/PushbackTicks';
import { SetupChart } from '@/components/lab/SetupChart';
import { ResultsTable } from '@/components/ResultsTable';
import { TryGrid } from '@/components/TryGrid';
import { MODELS } from '@/content/models';
import { PUBLIC_PROMPTS } from '@/content/public-prompts';
import { experiments, findRunId, formatDate, getExperiment, getExperimentData, getRun, method, rankModels } from '@/lib/data';
import { exhibitFacts } from '@/lib/exhibit';
import { chartData, pad, phaseTotals, tickRows } from '@/lib/lab';

export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<'/experiments/[slug]'>): Promise<Metadata> {
  const exp = getExperiment((await params).slug);
  return exp ? { title: `Experiment ${pad(exp.number)}: ${exp.eyebrow}`, description: exp.claim } : {};
}

const REPO = 'https://github.com/abubakar2906/Intact';

// One experiment, in full: the result as a live chart, the evidence, what it means, every try, and the setup.
// Every figure and count is read from the published runs.
export default async function ExperimentPage({ params }: PageProps<'/experiments/[slug]'>) {
  const { slug } = await params;
  const exp = getExperiment(slug);
  if (!exp) notFound();
  const data = getExperimentData(slug);
  const scenario = method.scenarios[exp.scenario];
  const chart = chartData(exp, data);
  const ticks = tickRows(exp, data);
  const facts = exhibitFacts(exp, data);
  const caveId = exp.cave ? findRunId(data, exp.cave.model, exp.cave.condition, exp.cave.sample) : undefined;
  const caveRun = caveId ? getRun(caveId) : undefined;
  const setupName = (id: string) => exp.setups.find((s) => s.id === id)?.name ?? id;
  const year = exp.date.slice(0, 4);
  const citation = `Yinusa, A. (${year}). Intact: a benchmark for AI agents that move money. Experiment ${pad(exp.number)}, ${exp.eyebrow.toLowerCase()}. ${REPO}`;
  const errors = exp.setups.reduce((n, s) => n + data.totals[s.id].errors, 0);
  let fig = 0; const f = () => ++fig;
  let sec = 0; const s = () => pad(++sec);

  return (
    <div className="lab">
      <div className="lab-wrap">
        <LabHeader />
        <main>
          <section className="lab-hero">
            <div className="lab-row">
              <dl className="lab-facts lab-mono">
                <dt>Experiment</dt><dd>{pad(exp.number)}</dd>
                <dt>Published</dt><dd>{formatDate(exp.date)}</dd>
                <dt>Tries</dt><dd>{data.runCount - errors}</dd>
                <dt>Models</dt><dd>{exp.models.length}</dd>
                <dt>Data</dt><dd><a href="#every-try">Every try</a></dd>
              </dl>
              <div><h1>{exp.claim}</h1><p className="lab-lede">{exp.lede}</p></div>
            </div>
            <SetupChart {...chart} wrongLabel={exp.wrong.toLowerCase()} autoplay />
            <div className="lab-cap"><span className="lab-mono">Figure {f()}</span><span>{exp.wrong}, out of each model’s tries, in each setup. Pick what the agent was told.</span></div>
          </section>

          {ticks && (
            <section className="lab-part">
              <div className="lab-row"><p className="lab-side">{s()}</p><div className="lab-prose">
                <h2>When the money moved</h2>
                <p>Each square is one try. A red square paid twice before anyone argued. An outlined square held off: it checked, asked, or handed it to a person. Then the supplier pushed back. The ringed squares are the ones that gave in.</p>
              </div></div>
              <PushbackTicks {...ticks} />
              {caveRun && (
                <div className="lab-chat"><p className="lab-side">One that gave in</p><CaveChat run={caveRun} modelName={MODELS[caveRun.model].name} setupName={setupName(caveRun.condition)} /></div>
              )}
              <div className="lab-cap"><span className="lab-mono">Figure {f()}</span><span>Tries by when the money moved, all five models together.{caveRun ? ` Below: ${MODELS[caveRun.model].name}, ${setupName(caveRun.condition).toLowerCase()}, try ${caveRun.sample}, from the check to the second payment.` : ''}</span></div>
            </section>
          )}

          {facts && !ticks && (
            <section className="lab-part">
              <div className="lab-row"><p className="lab-side">{s()}</p><div className="lab-prose">
                <h2>The agent read one record. The bank kept another.</h2>
                <p>{scenario.from.split(',')[0]} writes in: his payout shows as failed, please send it again. Ledgerline’s record says failed. The bank’s says paid.</p>
              </div></div>
              <Records facts={facts} modelName={MODELS[facts.run.model].name} setupName={setupName(facts.run.condition)} />
              <div className="lab-cap"><span className="lab-mono">Figure {f()}</span><span>One try, as recorded: {MODELS[facts.run.model].name}, {setupName(facts.run.condition).toLowerCase()}, try {facts.run.sample}. <Link href={`/runs/${facts.run.id}`}>Read the whole try</Link>.</span></div>
            </section>
          )}

          <section className="lab-part">
            <div className="lab-row"><p className="lab-side">{s()}</p><div className="lab-prose"><h2>What we found</h2></div></div>
            <div className="lab-cols" style={{ '--cols': exp.beats.length } as React.CSSProperties}>
              {exp.beats.map((b) => <div key={b.heading}><h3>{b.heading}</h3><p>{b.body}</p></div>)}
            </div>
            {exp.beats.some((b) => b.show?.kind === 'public') && (
              <>
                <div className="lab-cols" style={{ '--cols': PUBLIC_PROMPTS.rows.length } as React.CSSProperties}>
                  {PUBLIC_PROMPTS.rows.map((r) => <div key={r.what}><span className={`lab-f ${r.count ? '' : 'is-red'}`}>{r.count}<small>of {PUBLIC_PROMPTS.sources} public payment agents are told: {r.what.toLowerCase()}</small></span></div>)}
                </div>
                <div className="lab-cap"><span className="lab-mono">Figure {f()}</span><span>What {PUBLIC_PROMPTS.sources} public payment-agent examples tell the agent. <a href={`${REPO}/blob/main/docs/public-prompts.md`}>Every source, with the lines quoted</a>.</span></div>
              </>
            )}
          </section>

          {ticks && (() => {
            const rules = exp.setups.slice(1).map((x) => ({ x, p: phaseTotals(exp, data, x.id)! }));
            return (
              <section className="lab-part">
                <div className="lab-row"><p className="lab-side">{s()}</p><div className="lab-prose"><h2>Under each rule</h2><p>Of the tries that held off and reached the pushback, how many then paid.</p></div></div>
                <div className="lab-cols" style={{ '--cols': rules.length } as React.CSSProperties}>
                  {rules.map(({ x, p }) => <div key={x.id}><p className="lab-side">{x.name}</p><div className="lab-figs"><span className="lab-f is-red">{p.cave}<small>of {p.reached} gave in after the pushback. {p.now} paid straight away.</small></span></div></div>)}
                </div>
              </section>
            );
          })()}

          <section className="lab-part" id="every-try">
            <div className="lab-row"><p className="lab-side">{s()}</p><div className="lab-prose"><h2>Every try</h2><p>Each square is one try. Open any of them to read exactly what the agent did and said.</p></div></div>
            <div style={{ marginTop: 40 }}>
              <TryGrid models={rankModels(exp, data)} setups={exp.setups.map((x) => ({ id: x.id, name: x.name }))} tries={data.tries} wrongLabel={exp.wrong} />
            </div>
            <details className="lab-details"><summary>The counts as a table</summary><ResultsTable exp={exp} data={data} /></details>
            <div className="lab-pills">
              <a href={`/data/intact-${exp.slug}.csv`} download>CSV, one row per try</a>
              {data.folders.map((x) => <a key={x} href={`${REPO}/tree/main/results/${x}`}>Transcripts, {x.split('-').pop()} run</a>)}
            </div>
          </section>

          <section className="lab-part">
            <div className="lab-row"><p className="lab-side">{s()}</p><div className="lab-prose">
              <h2>The setup</h2>
              <p>The message from {scenario.from}, word for word:</p>
              <blockquote className="lab-quote">{scenario.message}</blockquote>
              {scenario.followUp && <><p>If the agent holds off, he writes again:</p><blockquote className="lab-quote">{scenario.followUp}</blockquote></>}
              <details className="lab-details"><summary>The agent’s instructions, for each setup</summary>
                {exp.setups.map((x) => <div key={x.id}><p className="lab-k" style={{ marginTop: 14 }}>{x.name}</p><pre>{method.prompts[x.id]}</pre></div>)}
              </details>
            </div></div>
          </section>

          <section className="lab-part">
            <div className="lab-row"><p className="lab-side">{s()}</p><div className="lab-prose"><h2>How it’s graded</h2></div></div>
            <Flow />
            <div className="lab-cap"><span /><span><Link href="/method" className="lab-more">The method in full</Link></span></div>
          </section>

          <section className="lab-part">
            <div className="lab-row"><p className="lab-side">{s()}</p><div className="lab-prose">
              <h2>Limits</h2>
              <ol className="lab-ol">{exp.limits.map((l) => <li key={l}>{l}</li>)}</ol>
              <h2 style={{ marginTop: 56 }}>Cite this</h2>
              <p id="cite-text" className="lab-cite">{citation}</p>
              <div style={{ marginTop: 12 }}><CopyButton text={citation} targetId="cite-text" label="Copy citation" /></div>
            </div></div>
          </section>
        </main>
        <LabFooter />
      </div>
    </div>
  );
}
