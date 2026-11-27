import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StepChart } from '@/components/grid/StepChart';
import { OneSentence } from '@/components/note/OneSentence';
import { MODELS } from '@/content/models';
import { experiments, formatDate, getExperimentData, rankModels } from '@/lib/data';

const GITHUB = 'https://github.com/abubakar2906/Intact';

// The lab's front page, combined: the research note's type and figures (A), on the grid's sidebar (B).
// Facts and section numbers sit in a narrow column on the left; the text reads in the column beside it;
// figures run across the full width. Mock-up: the first screen and one section. Every figure is read
// from the published runs.
export default function Home() {
  const exp = experiments[0];
  const data = getExperimentData(exp.slug);
  const models = rankModels(exp, data).reverse();
  const total = data.totals[exp.setups[0].id];
  const byId = (id: string) => exp.setups.find((s) => s.id === id);

  const steps = exp.setups.map((s) => ({ name: s.name, wrong: data.totals[s.id].wrong, n: data.totals[s.id].n }));
  const stepsLabel = 'Tries that paid twice, by setup: ' + steps.map((s) => `${s.name} ${s.wrong} of ${s.n}`).join(', ') + '.';

  const sentence = models.map((m) => ({
    name: MODELS[m].name, logo: MODELS[m].logo, ink: !!MODELS[m].ink,
    before: data.counts[m].B.wrong, note: data.counts[m].A.wrong, after: data.counts[m].C.wrong, n: data.counts[m].B.n,
  }));
  const sentenceLabel = 'Tries that paid twice out of 10, per model. ' + sentence.map((r) => `${r.name}: ${r.before} with no hint, ${r.note} with the note in the docs, ${r.after} with one sentence`).join('. ') + '.';

  return (
    <div className="note nx">
      <header className="nx-top">
        <Link href="/" className="note-brand"><span className="intact-mark" aria-hidden />Intact</Link>
        <nav aria-label="Site">
          <Link href={`/experiments/${exp.slug}`}>Research</Link>
          <Link href="/method">Method</Link>
          <a href="#platform">Platform</a>
          <a href={GITHUB}>GitHub</a>
          <ThemeToggle />
        </nav>
      </header>

      <main>
        <section className="nx-row nx-hero">
          <p className="nx-side">Research lab</p>
          <div className="nx-main">
            <h1>Intact is a research lab studying AI agents that move money.</h1>
          </div>
        </section>

        <section className="nx-row nx-intro">
          <dl className="nx-side nx-facts">
            <div><dt>Experiment</dt><dd>01</dd></div>
            <div><dt>Published</dt><dd>{formatDate(exp.date)}</dd></div>
            <div><dt>Tries</dt><dd>{data.runCount}</dd></div>
            <div><dt>Models</dt><dd>{exp.models.length}</dd></div>
          </dl>
          <div className="nx-main nx-prose">
            <p className="lede">
              We give agents payment tools that fail the way real ones do, and record where the money went, never what the agent said it did.
              Every try is published.
            </p>
            <p>
              Our first experiment asked a simple question. A supplier writes in: his payout shows as failed, please send it again.
              The bank had already paid him. With no hint that the status could be out of date, agents paid him a second time in {total.wrong} of {total.n} tries.
            </p>
          </div>
        </section>

        <figure className="nx-fig">
          <StepChart steps={steps} max={total.n} big label={stepsLabel} />
          <figcaption className="nx-cap"><span className="nx-side">Figure 1</span><span className="nx-main">Tries that paid twice, out of {total.n}, as each setup told the agent more.</span></figcaption>
        </figure>

        <section className="nx-row nx-section">
          <p className="nx-side">02</p>
          <div className="nx-main nx-prose">
            <h2>One sentence did what the docs could not</h2>
            <p>
              A note in the provider’s docs, saying the status can lag, barely moved the total: {data.totals.A.wrong} of {data.totals.A.n}.
              Two models used it. The others ignored it.
            </p>
            <p>
              Then we added one line to the agent’s instructions: <q>{byId('C')?.what.replace(/[“”]/g, '')}</q> Paying twice fell to {data.totals.C.wrong} in {data.totals.C.n}.
              The one slip resent the payment first and checked second.
            </p>
          </div>
        </section>

        <figure className="nx-fig">
          <OneSentence rows={sentence} label={sentenceLabel} />
          <OneSentence rows={sentence} label={sentenceLabel} narrow />
          <figcaption className="nx-cap"><span className="nx-side">Figure 2</span><span className="nx-main">Tries that paid twice, out of 10, for each model. The red dot is no hint; the ring is the same model told to check with the bank first; the grey mark is the note in the docs.</span></figcaption>
        </figure>

        <section className="nx-row nx-end">
          <p className="nx-side">Mock-up</p>
          <p className="nx-main nx-small">The first screen and one section. The rest follows in this style.</p>
        </section>
      </main>
      <Footer wide />
    </div>
  );
}
