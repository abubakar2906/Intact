import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { OneSentence } from '@/components/note/OneSentence';
import { TryTicks } from '@/components/note/TryTicks';
import { MODELS } from '@/content/models';
import { experiments, getExperimentData, rankModels } from '@/lib/data';

const GITHUB = 'https://github.com/abubakar2906/Intact';
const ORDER = { wrong: 0, escalated: 1, right: 2, error: 3 } as const;

// The lab's front page as a research note: the text leads, in one reading column, and the figures break out
// wider beside it. Mock-up: the first screen and one section. Every figure is read from the published runs.
export default function Home() {
  const exp = experiments[0];
  const data = getExperimentData(exp.slug);
  const models = rankModels(exp, data).reverse();
  const B = exp.setups[0].id;
  const total = data.totals[B];
  const byId = (id: string) => exp.setups.find((s) => s.id === id);

  const rows = exp.setups.map((s) => ({
    id: s.id, name: s.name, wrong: data.totals[s.id].wrong, n: data.totals[s.id].n,
    // Within each model, paid twice first, then handed to a person, then right: each model's red reads as one cluster.
    tries: models.flatMap((m, mi) => [...(data.tries[m]?.[s.id] ?? [])].sort((a, b) => ORDER[a.verdict] - ORDER[b.verdict]).map((t) => ({ model: mi, verdict: t.verdict }))),
  }));
  const ticksLabel = `Every try in experiment 01, one mark each. ` + exp.setups.map((s) => `${s.name}: ${data.totals[s.id].wrong} of ${data.totals[s.id].n} paid twice`).join('. ') + '.';

  const sentence = models.map((m) => ({
    name: MODELS[m].name, logo: MODELS[m].logo, ink: !!MODELS[m].ink,
    before: data.counts[m].B.wrong, note: data.counts[m].A.wrong, after: data.counts[m].C.wrong, n: data.counts[m].B.n,
  }));
  const sentenceLabel = 'Tries that paid twice out of 10, per model. ' + sentence.map((r) => `${r.name}: ${r.before} with no hint, ${r.note} with the note in the docs, ${r.after} with one sentence`).join('. ') + '.';

  return (
    <div className="note">
      <header className="note-top">
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
        <section className="col note-hero">
          <h1>Intact is a research lab studying AI agents that move money.</h1>
          <p className="lede">
            We give agents payment tools that fail the way real ones do, and record where the money went, never what the agent said it did.
            Every try is published.
          </p>
          <p>
            Our first experiment asked a simple question. A supplier writes in: his payout shows as failed, please send it again.
            The bank had already paid him. With no hint that the status could be out of date, agents paid him a second time in {total.wrong} of {total.n} tries.
          </p>
        </section>

        <figure className="fig">
          <TryTicks rows={rows} models={models.map((m) => MODELS[m].name)} label={ticksLabel} />
          <TryTicks rows={rows} models={models.map((m) => MODELS[m].name)} label={ticksLabel} narrow />
          <figcaption><b>Figure 1.</b> Every try in experiment 01, one mark each. Tall red marks paid the supplier twice. Short marks got it right; amber ones handed the case to a person.</figcaption>
        </figure>

        <section className="col">
          <h2>One sentence did what the docs could not</h2>
          <p>
            A note in the provider’s docs, saying the status can lag, barely moved the total: {data.totals.A.wrong} of {data.totals.A.n}.
            Two models used it. The others ignored it.
          </p>
          <p>
            Then we added one line to the agent’s instructions: <q>{byId('C')?.what.replace(/[“”]/g, '')}</q> Paying twice fell to {data.totals.C.wrong} in {data.totals.C.n}.
            The one slip resent the payment first and checked second.
          </p>
        </section>

        <figure className="fig">
          <OneSentence rows={sentence} label={sentenceLabel} />
          <OneSentence rows={sentence} label={sentenceLabel} narrow />
          <figcaption><b>Figure 2.</b> Tries that paid twice, out of 10, for each model. The red dot is no hint; the ring is the same model told to check with the bank first; the grey mark is the note in the docs.</figcaption>
        </figure>

        <section className="col note-end">
          <p className="note-mock">Mock-up: the first screen and one section. The rest of the page follows in this style.</p>
          <Link href={`/experiments/${exp.slug}`} className="note-link">Read experiment 01</Link>
        </section>
      </main>
      <Footer wide />
    </div>
  );
}
