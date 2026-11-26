import Image from 'next/image';
import Link from 'next/link';
import { Galaxy } from '@/components/Galaxy';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { experiments, getExperimentData } from '@/lib/data';

const ROADMAP = [
  { stage: 'v0', name: 'Measure', when: 'Now', body: 'Put agents in front of the ways payments really fail, and record where the money ends up. The first experiment is out.' },
  { stage: 'v1', name: 'Protect', when: 'Next', body: 'A guard between any agent and the money, so the agent can be wrong and the money still stays right. In the first experiment, a simple lock already stopped every double payment.' },
  { stage: 'v2', name: 'Improve', when: 'Later', body: 'Every graded try is a lesson. Use them to train models that check before they pay.' },
];

const VISION = [
  { title: 'A test any team can run', body: 'More traps from real payment rails: reversals, partial refunds, retries, chargebacks. Plug in your own agent and get a report before it touches real money.' },
  { title: 'A guard in front of the money', body: 'Checks like “verify before you resend” enforced in code, not left to a prompt. Tested on the same traps it guards against.' },
  { title: 'Training that sticks', body: 'Graded runs from Intact become training data that teaches models to check first, measured on the same benchmark.' },
];

export default function Home() {
  const first = experiments[experiments.length - 1];
  const data = getExperimentData(first.slug);
  const total = (id: string) => data.totals[id];
  const STATS = [
    { label: 'No hint', ...total('B') },
    { label: 'One sentence in the prompt', ...total('C') },
    { label: 'A lock in the payment tool', ...total('D') },
  ];
  const runCount = experiments.reduce((n, e) => n + getExperimentData(e.slug).runCount, 0);

  return (
    <div className="flex-1 bg-space text-white">
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <Galaxy />
        <SiteHeader over />
        <div className="relative mx-auto max-w-6xl px-6 pb-28 pt-20 sm:px-10 sm:pb-36 sm:pt-32">
          <p className="font-mono text-[13px] uppercase tracking-[0.12em] text-white/50">An open benchmark for AI agents that move money</p>
          <h1 className="mt-6 max-w-4xl text-[46px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[80px]">
            Do AI agents keep money intact?
          </h1>
          <p className="mt-7 max-w-2xl text-[18px] leading-relaxed text-white/65 sm:text-[20px]">
            We give agents a payment system that gets things wrong the way real ones do, and check where the money ends up.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href={`/experiments/${first.slug}`} className="rounded-lg bg-white px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-white/85">
              See the first results
            </Link>
            <Link href="/method" className="rounded-lg px-5 py-3 text-[15px] font-medium text-white/80 ring-1 ring-white/20 transition-colors hover:bg-white/5 hover:text-white">
              How it works
            </Link>
          </div>
          <p className="mt-10 font-mono text-[13px] text-white/40">{runCount} tries · {first.models.length} models · every transcript public</p>
        </div>
      </section>

      {/* Roadmap */}
      <section className="mx-auto max-w-6xl px-6 pt-16 sm:px-10">
        <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">The roadmap</h2>
        <ol className="relative mt-12 grid gap-12 md:grid-cols-3 md:gap-10">
          <span aria-hidden className="absolute left-[7px] top-2 hidden h-px w-[calc(100%-14px)] bg-white/15 md:block" />
          {ROADMAP.map((r, i) => (
            <li key={r.stage} className="relative">
              <span aria-hidden className={`relative block size-[15px] rounded-full ${i === 0 ? 'bg-white shadow-[0_0_0_5px_rgba(255,255,255,0.12),0_0_24px_rgba(150,140,255,0.7)]' : 'bg-space ring-1 ring-white/35'}`} />
              <p className="mt-6 font-mono text-[13px] text-white/45">{r.stage} · {r.when}</p>
              <h3 className="mt-2 text-[22px] font-semibold">{r.name}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-white/60">{r.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* First results */}
      <section className="mx-auto max-w-6xl px-6 pt-32 sm:px-10">
        <p className="font-mono text-[13px] uppercase tracking-[0.12em] text-white/45">Experiment {String(first.number).padStart(2, '0')} · {first.eyebrow}</p>
        <h2 className="mt-5 max-w-3xl text-[30px] font-semibold leading-[1.1] tracking-tight sm:text-[42px]">
          A payout shows “failed”. The bank already paid. Do agents pay again?
        </h2>
        <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-white/60">
          Five open models, ten tries each, in four setups. How often they paid the supplier twice:
        </p>
        <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="bg-space p-6 sm:p-8">
              <dt className="text-[15px] text-white/60">{s.label}</dt>
              <dd className="mt-3 flex items-baseline gap-2 font-mono">
                <span className={`text-[52px] font-medium leading-none tracking-tight ${s.wrong ? 'text-redsoft' : 'text-white'}`}>{s.wrong}</span>
                <span className="text-[15px] text-white/45">of {s.n}</span>
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-2">
          <Snippet src="/img/stale-payout.png" width={1200} height={1295} alt="Chart: with no hint, AI agents paid the supplier twice in 29 of 50 tries; with one sentence, 1 of 50; with a lock in the tool, 0." caption="Every model, every setup" />
          <Snippet src="/img/paid-then-checked.png" width={1200} height={1134} alt="One run step by step: told to check with the bank before resending, gpt-oss-120b resent first, checked second, then called the duplicate a favour." caption="The one slip under the one-sentence rule" />
        </div>
        <Link href={`/experiments/${first.slug}`} className="mt-10 inline-flex items-center gap-2 text-[16px] font-medium text-white underline-offset-4 hover:underline">
          See every result, and every try <span aria-hidden>→</span>
        </Link>
      </section>

      {/* More from the results */}
      <section className="mx-auto max-w-6xl px-6 pt-32 sm:px-10">
        <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">What else the results show</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {first.beats.map((b) => (
            <div key={b.heading}>
              <h3 className="text-[18px] font-semibold">{b.heading}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-white/60">{b.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 rounded-2xl p-6 ring-1 ring-white/12 sm:p-8">
          <div className="max-w-xl">
            <p className="text-[17px] font-medium">Every try is public.</p>
            <p className="mt-2 text-[15px] leading-relaxed text-white/60">
              Open any of the {runCount} tries to read what the agent called, what came back, and what it told the supplier. Next experiment: what happens when the supplier pushes back, and the money rules real toolkits give their agents.
            </p>
          </div>
          <Link href="/experiments" className="rounded-lg bg-white px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-white/85">
            All results
          </Link>
        </div>
      </section>

      {/* Vision */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-32 sm:px-10">
        <p className="font-mono text-[13px] uppercase tracking-[0.12em] text-white/45">Where this goes</p>
        <h2 className="mt-5 max-w-3xl text-[30px] font-semibold leading-[1.1] tracking-tight sm:text-[42px]">
          Before an AI agent touches a company’s money, it should pass Intact.
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {VISION.map((v) => (
            <div key={v.title} className="border-t border-white/12 pt-6">
              <h3 className="text-[18px] font-semibold">{v.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-white/60">{v.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap gap-3">
          <a href="https://github.com/abubakar2906/Intact" className="rounded-lg bg-white px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-white/85">Run it yourself on GitHub</a>
          <a href="https://x.com/kairo_v0" className="rounded-lg px-5 py-3 text-[15px] font-medium text-white/80 ring-1 ring-white/20 transition-colors hover:bg-white/5 hover:text-white">Follow along on X</a>
        </div>
      </section>
      <Footer dark />
    </div>
  );
}

function Snippet({ src, width, height, alt, caption }: { src: string; width: number; height: number; alt: string; caption: string }) {
  return (
    <figure>
      <Image src={src} width={width} height={height} alt={alt} className="w-full rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_30px_80px_-20px_rgba(70,80,200,0.35)]" />
      <figcaption className="mt-3 font-mono text-[13px] text-white/45">{caption}</figcaption>
    </figure>
  );
}
