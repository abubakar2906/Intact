import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { RunCard } from '@/components/RunCard';
import { ModelLogo } from '@/components/ModelName';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MODELS } from '@/content/models';
import { allRunIds, getExperiment, getExperimentData, getRun, type Verdict } from '@/lib/data';

// One try on its own page, so it can be shared. The try grid's drawer shows the same thing without leaving the experiment.
// Every published try gets a page at build time. Any other address is a 404, from notFound() below.

export function generateStaticParams() {
  return allRunIds().map((id) => ({ id }));
}

const GITHUB = 'https://github.com/abubakar2906/Intact';

const outcome = (wrong: string): Record<Verdict, string> => ({
  wrong: wrong.toLowerCase(),
  right: 'got it right',
  escalated: 'handed it to a person',
  error: 'never finished',
});

export async function generateMetadata({ params }: PageProps<'/runs/[id]'>): Promise<Metadata> {
  const run = getRun((await params).id);
  const exp = run && getExperiment(run.experiment);
  if (!run || !exp) return {};
  const name = MODELS[run.model].name;
  return {
    title: `${name}, ${run.setupName.toLowerCase()}, try ${run.sample}`,
    description: `In experiment ${String(exp.number).padStart(2, '0')}, ${exp.eyebrow.toLowerCase()}, ${name} ${outcome(exp.wrong)[run.verdict]}. Every step it took, and what it said.`,
  };
}

export default async function RunPage({ params }: PageProps<'/runs/[id]'>) {
  const run = getRun((await params).id);
  const exp = run && getExperiment(run.experiment);
  if (!run || !exp) notFound();
  const data = getExperimentData(exp.slug);
  const n = String(exp.number).padStart(2, '0');
  const name = MODELS[run.model].name;
  const said = outcome(exp.wrong);
  const siblings = data.tries[run.model]?.[run.condition] ?? [];
  const setup = exp.setups.find((s) => s.id === run.condition);

  // Colour means money: red went wrong, green was kept, amber waited for a person. A try that never ran has none.
  const tone = run.verdict === 'wrong' ? 'wrong' : run.verdict === 'right' ? 'kept' : run.verdict === 'escalated' ? 'wait' : 'none';
  const truth =
    run.verdict === 'error' ? null
      : !run.reply ? 'It sent no reply, so there was nothing to check.'
      : run.truth && !run.truth.ok ? `It said something false: it ${run.truth.note}.`
      : 'No false claim found in its reply.';
  // The grader's notes read as the end of a sentence, e.g. "supplier received ₦500,000 for a ₦250,000 invoice".
  const money =
    run.verdict === 'error' ? 'Nothing was paid. The model’s service stopped answering, so the try never finished and is not counted.'
      : run.money.note.startsWith('supplier ') ? `The ${run.money.note}.`
      : `It ${run.money.note}.`;

  return (
    <div className="home">
      <div className="home-wrap">
        <nav className="home-nav" aria-label="Site">
          <Link href="/" className="home-brand"><span className="intact-mark" aria-hidden />Intact</Link>
          <ul>
            <li><Link href="/experiments">Results</Link></li>
            <li><Link href="/method">Method</Link></li>
          </ul>
          <div className="home-nav-right">
            <a href={GITHUB}>GitHub</a>
            <ThemeToggle />
          </div>
        </nav>
      </div>

      <main className="home-wrap run-page">
        <Link href={`/experiments/${exp.slug}#every-try`} className="run-back">Every try in experiment {n}</Link>

        <header className="run-head">
          <p className="home-kicker">Experiment {n}, {exp.eyebrow.toLowerCase()} · {run.setupName} · try {run.sample} of {siblings.length}</p>
          <h1>
            <ModelLogo id={run.model} size={40} className="run-logo" />
            <span>{name} <span className={`run-said run-${tone}`}>{said[run.verdict]}</span></span>
          </h1>
        </header>

        <dl className="run-grade">
          <div>
            <dt>Money</dt>
            <dd><i className={`run-dot run-${run.verdict === 'wrong' ? 'wrong' : run.verdict === 'error' ? 'none' : 'kept'}`} aria-hidden />{money}</dd>
          </div>
          {truth && (
            <div>
              <dt>Truth</dt>
              <dd>{truth}</dd>
            </div>
          )}
          {setup && (
            <div>
              <dt>Setup</dt>
              <dd>{setup.name}. {setup.what}</dd>
            </div>
          )}
        </dl>

        <section className="run-part" aria-labelledby="got">
          <h2 id="got">What the agent got</h2>
          <div className="run-message">
            <p className="run-label">Message from {run.from}</p>
            <p className="run-quote">{run.message}</p>
            {run.followUp && (
              <>
                <p className="run-label">If it holds off, {run.from} answers</p>
                <p className="run-quote">{run.followUp}</p>
              </>
            )}
          </div>
        </section>

        <section className="run-part" aria-labelledby="did">
          <h2 id="did">What it did</h2>
          <div className="run-steps">
            <RunCard run={run} wrongLabel={exp.wrong} />
          </div>
        </section>

        {siblings.length > 1 && (
          <section className="run-part" aria-labelledby="others">
            <h2 id="others">The other tries</h2>
            <p className="run-note">{name}, {run.setupName.toLowerCase()}. One square per try.</p>
            <ol className="run-siblings">
              {siblings.map((t) => {
                const label = `Try ${t.sample}: ${said[t.verdict]}${t.untrue ? ', and said something false' : ''}`;
                const current = t.id === run.id;
                return (
                  <li key={t.id}>
                    <Link
                      href={`/runs/${t.id}`}
                      prefetch={false}
                      aria-label={label}
                      title={label}
                      aria-current={current ? 'page' : undefined}
                      className={`run-sq run-sq-${t.verdict}`}
                    >
                      {t.sample}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <p className="run-source">
          Graded from the tool calls Ledgerline recorded, never from what the agent said. Every try’s full transcript is in{' '}
          <a href={`${GITHUB}/tree/main/results`}>results/ on GitHub</a>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
