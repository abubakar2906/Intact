import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { SetupBars } from '@/components/SetupBars';
import { Claim } from '@/components/Claim';
import { experiments, formatDate, getExperimentData } from '@/lib/data';

const HOW = [
  { title: 'A payment system with real glitches', body: 'Ledgerline is made up, but it fails the way real ones do: statuses that lag, requests that time out after the money moved, notifications that arrive twice.' },
  { title: 'The tools a real agent gets', body: 'Look up a payment, ask the bank for its final status, send money, refund, reply. The agent decides what to call.' },
  { title: 'Graded on where the money went', body: 'Every try is scored from the provider’s own records, not from what the agent says. Then we read what it said too.' },
];

export default function Home() {
  const latest = experiments[0];
  const data = getExperimentData(latest.slug);
  return (
    <main>
      <Hero href={`/experiments/${latest.slug}`} />

      <section className="mx-auto max-w-6xl px-6 pt-24 sm:px-10 sm:pt-28">
        <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-faint">
          Latest finding · Experiment {String(latest.number).padStart(2, '0')} · {formatDate(latest.date)}
        </p>
        <h2 className="mt-5 max-w-4xl text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] sm:text-[42px]">
          <Claim text={latest.claim} highlight={latest.claimHighlight} />
        </h2>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">{latest.lede}</p>
        <div className="mt-14">
          <SetupBars exp={latest} data={data} compact />
        </div>
        <Link href={`/experiments/${latest.slug}`} className="mt-12 inline-flex items-center gap-2 text-[16px] font-medium underline-offset-4 hover:underline">
          Read the finding, and every try <span aria-hidden>→</span>
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-6 pt-28 sm:px-10">
        <h2 className="text-[24px] font-semibold tracking-tight">How Intact works</h2>
        <div className="mt-8 grid gap-10 sm:grid-cols-3">
          {HOW.map((h) => (
            <div key={h.title}>
              <h3 className="text-[16px] font-semibold">{h.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{h.body}</p>
            </div>
          ))}
        </div>
        <Link href="/method" className="mt-8 inline-flex items-center gap-2 text-[15px] text-muted underline-offset-4 hover:text-ink hover:underline">
          The full method <span aria-hidden>→</span>
        </Link>
      </section>

      <section id="experiments" className="mx-auto max-w-6xl scroll-mt-8 px-6 pt-28 sm:px-10">
        <h2 className="text-[24px] font-semibold tracking-tight">Experiments</h2>
        <ul className="mt-6 border-t border-line">
          {experiments.map((e) => {
            const d = getExperimentData(e.slug);
            return (
              <li key={e.slug} className="border-b border-line">
                <Link href={`/experiments/${e.slug}`} className="group grid gap-2 py-6 sm:grid-cols-[64px_1fr_auto] sm:items-baseline sm:gap-6">
                  <span className="font-mono text-[14px] text-faint">{String(e.number).padStart(2, '0')}</span>
                  <span>
                    <span className="block text-[18px] font-semibold group-hover:underline group-hover:underline-offset-4">{e.eyebrow}</span>
                    <span className="mt-1 block max-w-2xl text-[15px] leading-relaxed text-muted">{e.claim}</span>
                  </span>
                  <span className="font-mono text-[13px] text-faint">{formatDate(e.date)} · {d.runCount} tries · {e.models.length} models</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
