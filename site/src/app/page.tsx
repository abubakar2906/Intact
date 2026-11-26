import Link from 'next/link';
import { HeroCard } from '@/components/HeroCard';
import { Footer } from '@/components/Footer';
import { SetupCharts } from '@/components/SetupCharts';
import { ResultsTable } from '@/components/ResultsTable';
import { ChartFrame, LowerIsBetter } from '@/components/ChartFrame';
import { Roadmap } from '@/components/Roadmap';
import { Updates } from '@/components/Updates';
import { roadmap } from '@/content/roadmap';
import { experiments, getExperimentData, method } from '@/lib/data';

export default function Home() {
  const latest = experiments[0];
  const first = experiments[experiments.length - 1];
  const data = getExperimentData(latest.slug);
  const firstData = getExperimentData(first.slug);
  const runCount = experiments.reduce((n, e) => n + getExperimentData(e.slug).runCount, 0);
  const n = String(latest.number).padStart(2, '0');
  const perModel = Math.max(...latest.models.map((m) => data.counts[m][latest.setups[0].id].n + data.counts[m][latest.setups[0].id].errors));
  // The lock is the last setup of the first experiment.
  const lockId = first.setups[first.setups.length - 1].id;
  const stages = roadmap({
    scenarios: Object.values(method.scenarios).filter((s) => !s.followUp).length,
    runs: runCount,
    firstExperiment: { number: first.number, slug: first.slug, name: first.eyebrow },
    lock: firstData.totals[lockId],
  });

  return (
    <>
      <HeroCard className="min-h-[min(820px,calc(100svh-24px))] sm:min-h-[min(860px,calc(100svh-32px))]">
        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-6 pb-12 pt-16 sm:px-10 sm:pb-16">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-white/60 sm:text-[13px]">An open benchmark for AI agents that move money</p>
          <h1 className="mt-5 max-w-4xl text-[48px] leading-[0.98] tracking-[-0.04em] sm:text-[84px] lg:text-[104px]">
            Do AI agents keep money intact?
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/75 sm:text-[19px]">
            We give agents a payment system that gets things wrong the way real ones do, and check where the money ends up.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href={`/experiments/${latest.slug}`} className="rounded-full bg-white px-5 py-3 text-[15px] font-medium text-space transition-colors hover:bg-white/85">
              See the first results
            </Link>
            <Link href="/method" className="rounded-full px-5 py-3 text-[15px] font-medium text-white ring-1 ring-white/30 backdrop-blur-sm transition-colors hover:bg-white/10">
              How it works
            </Link>
          </div>
          <p className="mt-10 font-mono text-[13px] text-white/55">{runCount} tries · {latest.models.length} models · every transcript public</p>
        </div>
      </HeroCard>

      <main className="flex-1">
        {/* Results */}
        <section className="mx-auto max-w-6xl px-6 pt-20 sm:px-10 sm:pt-28" aria-labelledby="results">
          <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-faint">Experiment {n} · {latest.eyebrow}</p>
          <h2 id="results" className="mt-4 max-w-3xl text-[32px] leading-[1.05] sm:text-[48px]">
            A payout shows “failed”. The bank already paid. Do agents pay again?
          </h2>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">
            {latest.models.length} open models, {perModel} tries each, in {latest.setups.length} setups. Three of them:
          </p>
          <div className="mt-10">
            <SetupCharts exp={latest} data={data} />
          </div>

          <div className="mt-14">
            <ChartFrame
              title="Every model, every setup"
              definition={`Times each model ${latest.wrong.toLowerCase()}, out of its tries. Sorted by ${latest.setups[0].name.toLowerCase()}.`}
            >
              <ResultsTable exp={latest} data={data} />
            </ChartFrame>
            <div className="mt-2"><LowerIsBetter /></div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
            <Link href={`/experiments/${latest.slug}`} className="inline-flex items-center gap-2 text-[16px] font-medium underline-offset-4 hover:underline">
              Read the experiment, and open every try <span aria-hidden>→</span>
            </Link>
          </div>

        </section>

        {/* Roadmap */}
        <section className="mx-auto max-w-6xl px-6 pt-24 sm:px-10 sm:pt-32" aria-labelledby="roadmap">
          <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-faint">Roadmap</p>
          <h2 id="roadmap" className="mt-4 max-w-3xl text-[32px] leading-[1.05] sm:text-[48px]">
            Measure first. Then protect the money. Then teach models to check.
          </h2>
          <div className="mt-10">
            <Roadmap stages={stages} />
          </div>
        </section>

        {/* Updates */}
        <section className="mx-auto grid max-w-6xl gap-8 px-6 pt-24 sm:px-10 sm:pt-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]" aria-labelledby="updates">
          <div>
            <h2 id="updates" className="text-[28px] leading-tight sm:text-[36px]">Updates</h2>
            <p className="mt-3 text-[15px] text-muted">Newest first.</p>
          </div>
          <Updates />
        </section>

        {/* Close */}
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-24 sm:px-10 sm:pt-32">
          <h2 className="max-w-3xl text-[32px] leading-[1.05] sm:text-[48px]">
            Before an AI agent touches a company’s money, it should pass Intact.
          </h2>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="https://github.com/abubakar2906/Intact" className="rounded-full bg-ink px-5 py-3 text-[15px] font-medium text-paper transition-opacity hover:opacity-85">Run it yourself on GitHub</a>
            <a href="https://x.com/kairo_v0" className="rounded-full px-5 py-3 text-[15px] font-medium text-ink ring-1 ring-line transition-colors hover:bg-wash">Follow along on X</a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
