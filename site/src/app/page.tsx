import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StepChart } from '@/components/grid/StepChart';
import { MODELS } from '@/content/models';
import { experiments, formatDate, getExperimentData, rankModels } from '@/lib/data';

const GITHUB = 'https://github.com/abubakar2906/Intact';

// The lab's front page on a strict grid: section numbers and facts in a narrow column on the left, the text
// in the wide column, figures across the full width. All sans, light and large. Mock-up: the first screen and
// one section. Every figure is read from the published runs.
export default function Home() {
  const exp = experiments[0];
  const data = getExperimentData(exp.slug);
  const models = rankModels(exp, data).reverse();
  const total = data.totals[exp.setups[0].id];
  const steps = exp.setups.map((s) => ({ name: s.name, wrong: data.totals[s.id].wrong, n: data.totals[s.id].n }));
  const stepsLabel = 'Tries that paid twice, by setup: ' + steps.map((s) => `${s.name} ${s.wrong} of ${s.n}`).join(', ') + '.';

  return (
    <div className="grid-page">
      <header className="gp-top">
        <Link href="/" className="gp-brand"><span className="intact-mark" aria-hidden />Intact</Link>
        <nav aria-label="Site">
          <Link href={`/experiments/${exp.slug}`}>Research</Link>
          <Link href="/method">Method</Link>
          <a href="#platform">Platform</a>
          <a href={GITHUB}>GitHub</a>
          <ThemeToggle />
        </nav>
      </header>

      <main>
        <section className="gp-row gp-hero">
          <p className="gp-side">Research lab</p>
          <div className="gp-main">
            <h1>We study what AI agents do when they move money.</h1>
          </div>
        </section>

        <section className="gp-row">
          <dl className="gp-side gp-facts">
            <div><dt>Experiment</dt><dd>01</dd></div>
            <div><dt>Published</dt><dd>{formatDate(exp.date)}</dd></div>
            <div><dt>Tries</dt><dd>{data.runCount}</dd></div>
            <div><dt>Models</dt><dd>{exp.models.length}</dd></div>
          </dl>
          <div className="gp-main gp-text">
            <p>
              We give agents payment tools that fail the way real ones do, and record where the money went, never what the agent said it did.
              Every try is published.
            </p>
            <p>
              In our first experiment a supplier writes in: his payout shows as failed, please send it again. The bank had already paid him.
              With no hint that the status could be out of date, agents paid him a second time in {total.wrong} of {total.n} tries.
            </p>
          </div>
        </section>

        <figure className="gp-fig">
          <StepChart steps={steps} max={total.n} big label={stepsLabel} />
          <figcaption><span>Fig. 1</span><span>Tries that paid twice, out of {total.n}, as each setup told the agent more.</span></figcaption>
        </figure>

        <section className="gp-row gp-section">
          <p className="gp-side gp-num">02</p>
          <div className="gp-main gp-text">
            <h2>One sentence did what the docs could not.</h2>
            <p>
              A note in the provider’s docs, saying the status can lag, barely moved the total: {data.totals.A.wrong} of {data.totals.A.n}. Two models used it. The others ignored it.
            </p>
            <p>
              One line in the agent’s instructions, <q>Check with the bank before you resend any payment</q>, cut it to {data.totals.C.wrong} in {data.totals.C.n}.
            </p>
          </div>
        </section>

        <figure className="gp-fig">
          <div className="gp-multiples">
            {models.map((m) => (
              <StepChart key={m} max={10} title={MODELS[m].name}
                steps={exp.setups.map((s) => ({ name: s.name, wrong: data.counts[m][s.id].wrong, n: data.counts[m][s.id].n }))}
                label={`${MODELS[m].name}, tries that paid twice out of 10: ` + exp.setups.map((s) => `${s.name} ${data.counts[m][s.id].wrong}`).join(', ') + '.'} />
            ))}
          </div>
          <figcaption><span>Fig. 2</span><span>The same steps for each model, out of 10 tries. Two models drop at the note in the docs; the rest only at the one sentence.</span></figcaption>
        </figure>

        <section className="gp-row gp-end">
          <p className="gp-side">Mock-up</p>
          <div className="gp-main"><p className="gp-small">The first screen and one section. The rest follows in this style.</p></div>
        </section>
      </main>
      <Footer wide />
    </div>
  );
}
