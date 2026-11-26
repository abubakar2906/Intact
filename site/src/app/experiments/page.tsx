import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { SetupBars } from '@/components/SetupBars';
import { Claim } from '@/components/Claim';
import { ChartFrame } from '@/components/ChartFrame';
import { experiments, formatDate, getExperimentData } from '@/lib/data';

export const metadata: Metadata = { title: 'Results', description: 'Every Intact experiment, newest first, with every try public.' };

export default function ExperimentsPage() {
  return (
    <>
      <main className="flex-1 pb-24">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <header className="pt-10 sm:pt-16">
            <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-faint">Results</p>
            <h1 className="mt-5 text-[40px] leading-[1.02] tracking-[-0.04em] sm:text-[64px]">Every experiment</h1>
            <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-muted">Newest first. Each one asks a single question, written down before it runs, and publishes every try.</p>
          </header>
          {experiments.map((e) => {
            const data = getExperimentData(e.slug);
            return (
              <article key={e.slug} className="mt-16 border-t border-line pt-10">
                <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-faint">
                  Experiment {String(e.number).padStart(2, '0')} · {e.eyebrow} · {formatDate(e.date)} · {data.runCount} tries
                </p>
                <h2 className="mt-4 max-w-4xl text-[28px] leading-[1.1] sm:text-[40px]">
                  <Link href={`/experiments/${e.slug}`} className="hover:underline hover:underline-offset-4"><Claim text={e.claim} highlight={e.claimHighlight} /></Link>
                </h2>
                <div className="mt-10">
                  <ChartFrame title={`${e.wrong}, by setup`} definition={`Times each model ${e.wrong.toLowerCase()}, out of its tries, in each setup.`} lowerIsBetter>
                    <SetupBars exp={e} data={data} compact />
                  </ChartFrame>
                </div>
                <Link href={`/experiments/${e.slug}`} className="mt-10 inline-flex items-center gap-2 text-[16px] font-medium underline-offset-4 hover:underline">
                  Read it, and open every try <span aria-hidden>→</span>
                </Link>
              </article>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
