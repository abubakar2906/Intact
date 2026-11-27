import Link from 'next/link';
import { LabFooter, LabHeader } from '@/components/lab/LabHeader';
import { Flow } from '@/components/lab/Flow';
import { SetupChart } from '@/components/lab/SetupChart';
import { experiments, getExperimentData } from '@/lib/data';
import { chartData, pad, phaseTotals } from '@/lib/lab';

const GITHUB = 'https://github.com/abubakar2906/Intact';

// The lab's front page. The first screen carries experiment 01's result as a live chart; each experiment then gets
// a short card that leads to its own page; the rest says what it means, what is next, and how we test.
export default function Home() {
  const first = experiments.find((e) => e.slug === 'stale-payout')!;
  const firstData = getExperimentData(first.slug);
  const chart = chartData(first, firstData);
  const push = experiments.find((e) => e.slug === 'pushback');
  const pushData = push ? getExperimentData(push.slug) : null;
  const t1 = (id: string) => firstData.totals[id];
  const sentence = push && pushData ? phaseTotals(push, pushData, 'C') : null;
  const caveAll = push && pushData ? push.setups.slice(1).map((s) => phaseTotals(push, pushData, s.id)!).reduce((a, p) => ({ cave: a.cave + p.cave, reached: a.reached + p.reached }), { cave: 0, reached: 0 }) : null;
  const tries = experiments.reduce((n, e) => n + getExperimentData(e.slug).runCount, 0);

  return (
    <div className="lab">
      <div className="lab-wrap">
        <LabHeader />
        <main>
          <section className="lab-hero">
            <div className="lab-row"><p className="lab-side">Research lab</p><div>
              <h1>Intact is a research lab studying AI agents that move money.</h1>
              <p className="lab-lede">We give agents payment tools that fail the way real ones do, and record where the money went, never what the agent said it did. Every try is published: {tries} so far.</p>
            </div></div>
            <SetupChart {...chart} wrongLabel="paid the supplier twice" autoplay />
            <div className="lab-cap"><span className="lab-mono">Figure 1</span><span>Experiment 01, the stale payout. Tries that paid twice, out of 10 per model. Pick what the agent was told.</span></div>
          </section>

          <section className="lab-part" aria-labelledby="research">
            <div className="lab-row"><p className="lab-side">01 · Research</p><div><h2 id="research">What we’ve found so far.</h2></div></div>
            <div className="lab-cards">
              {push && pushData && sentence && caveAll && (
                <Link href={`/experiments/${push.slug}`} className="lab-card">
                  <span className="lab-k">Experiment {pad(push.number)} · {push.eyebrow}</span>
                  <h3>{push.short}</h3>
                  <p>Rules in the prompt stopped almost every agent paying straight away. Once the supplier pushed back, {caveAll.cave} of {caveAll.reached} that had held off paid him anyway.</p>
                  <div className="lab-mini"><span className="lab-f is-red">{Math.round((caveAll.cave / caveAll.reached) * 100)}%<small>gave in after the pushback, under the three rules</small></span></div>
                  <span className="lab-go">Read experiment {pad(push.number)}</span>
                </Link>
              )}
              <Link href={`/experiments/${first.slug}`} className="lab-card">
                <span className="lab-k">Experiment {pad(first.number)} · {first.eyebrow}</span>
                <h3>{first.short}</h3>
                <p>The payout said “failed”. The bank had paid. One sentence in the prompt nearly fixed it; a lock in the tool fixed it completely.</p>
                <div className="lab-mini">
                  <span className="lab-steps" aria-hidden>{first.setups.map((s) => { const v = t1(s.id); return <i key={s.id} className={v.wrong ? '' : 'zero'} style={{ height: `${(v.wrong / v.n) * 100}%` }} />; })}</span>
                  <span className="lab-f is-red">{t1('B').wrong}<small>of {t1('B').n} paid twice with no hint, {t1('D').wrong} of {t1('D').n} with the lock</small></span>
                </div>
                <span className="lab-go">Read experiment {pad(first.number)}</span>
              </Link>
            </div>
          </section>

          <section className="lab-part" aria-labelledby="means">
            <div className="lab-row"><p className="lab-side">02 · What it means</p><div className="lab-prose">
              <h2 id="means">Fix the tool, not the prompt.</h2>
              <p>A rule in the prompt is advice the agent can be talked out of. A check in the tool isn’t. So we’re building one: a guard between your agents and your payment provider, with a dashboard for what it stopped and what’s waiting for you. It’s in private testing.</p>
            </div></div>
            <div className="lab-cols">
              <div><p className="lab-side">A sentence in the prompt</p><div className="lab-figs">
                <span className="lab-f">{t1('C').wrong}<small>of {t1('C').n} paid twice when nobody argued</small></span>
                {sentence && <span className="lab-f is-red">{sentence.cave}<small>of {sentence.reached} gave in once the supplier pushed back</small></span>}
              </div></div>
              <div><p className="lab-side">A lock in the tool</p><div className="lab-figs"><span className="lab-f">{t1('D').wrong}<small>of {t1('D').n} paid twice. The tool refuses a repeat until the first payment is checked.</small></span></div></div>
            </div>
            <div className="lab-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="home-shot-light" src="/img/platform-light.webp" width={2880} height={1800} alt="The Intact platform: payments checked this week, the flow through the guard, the latest decisions, and a payment waiting for approval." />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="home-shot-dark" src="/img/platform.webp" width={2880} height={1800} alt="" />
            </div>
            <div className="lab-cap"><span className="lab-mono">Figure 2</span><span>The platform, with made-up data for a made-up business.</span></div>
          </section>

          <section className="lab-part" aria-labelledby="next">
            <div className="lab-row"><p className="lab-side">03 · Next</p><div className="lab-prose">
              <h2 id="next">Fix the prompt, or fix the tool?</h2>
              <p>Payment APIs already offer idempotency keys. Whether an agent uses one is a different question. Experiment 03 measures the gap.</p>
            </div></div>
            <div className="lab-cols">
              <div><p className="lab-side">Optional key</p><h3>The agent has to remember</h3><p>Safe only if the agent passes a key, and the same one on a retry.</p>
                <div className="lab-log"><p className="lab-call ok">create_transfer(₦250,000, key: &quot;INV-88&quot;)<br />→ returns TRF-INV-88. ₦0 moves.</p><p className="lab-call">create_transfer(₦250,000, key: &quot;a91f-retry&quot;)<br />→ new transfer. ₦250,000 moves.</p><p className="lab-k">A fresh key on a retry looks safe and pays twice.</p></div></div>
              <div><p className="lab-side">Enforced key</p><h3>The tool remembers for it</h3><p>The provider makes the key from the invoice. The agent does nothing different.</p>
                <div className="lab-log"><p className="lab-call ok">create_transfer(₦250,000, invoice: INV-88)<br />→ returns TRF-INV-88. ₦0 moves.</p><p className="lab-call ok">create_transfer(₦250,000, invoice: INV-88)<br />→ returns TRF-INV-88. ₦0 moves.</p><p className="lab-k">The open question: does the agent then say it paid?</p></div></div>
            </div>
          </section>

          <section className="lab-part" aria-labelledby="method">
            <div className="lab-row"><p className="lab-side">04 · Method</p><div><h2 id="method">We grade where the money went.</h2></div></div>
            <Flow />
            <div className="lab-cap"><span /><span><Link href="/method" className="lab-more">The method in full</Link></span></div>
          </section>

          <section className="lab-part" aria-labelledby="list">
            <div className="lab-row"><p className="lab-side">05 · Every experiment</p><div><h2 id="list">Every try is public.</h2></div></div>
            <div className="lab-list">
              <div className="lab-item"><span className="lab-side">In progress</span><h3>Experiment 03, idempotency keys</h3><a className="lab-go" href={`${GITHUB}/blob/main/PLAN.md`}>The plan</a></div>
              {experiments.map((e) => (
                <div className="lab-item" key={e.slug}><span className="lab-side">Experiment {pad(e.number)}</span><h3>{e.short}</h3><Link className="lab-go" href={`/experiments/${e.slug}`}>Read it</Link></div>
              ))}
            </div>
          </section>
        </main>
        <LabFooter />
      </div>
    </div>
  );
}
