import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { ResultsTable } from '@/components/ResultsTable';
import { TryField, type FieldTag } from '@/components/TryField';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Updates } from '@/components/Updates';
import { MODELS } from '@/content/models';
import { experiments, getExperimentData, method, rankModels } from '@/lib/data';

const GITHUB = 'https://github.com/abubakar2906/Intact';
const X = 'https://x.com/kairo_v0';
const SHOT_ALT = 'The Intact platform: payments checked this week, the flow of money through the guard, the latest decisions, and a payment waiting for approval.';

export default function Home() {
  const latest = experiments[0];
  const data = getExperimentData(latest.slug);
  const runCount = experiments.reduce((n, e) => n + getExperimentData(e.slug).runCount, 0);
  const traps = Object.values(method.scenarios).filter((s) => !s.followUp).length;
  const n = String(latest.number).padStart(2, '0');

  // The hero draws every try of the latest experiment, best model first.
  const models = rankModels(latest, data);
  const setups = latest.setups.map((s) => ({
    name: s.name,
    wrong: models.map((m) => data.counts[m][s.id].wrong),
    tries: models.map((m) => data.counts[m][s.id].n),
  }));
  const worst = models.length - 1;
  const first = latest.setups[0].id;
  const index = (id: string) => latest.setups.findIndex((s) => s.id === id);
  const tags: FieldTag[] = [
    { setup: 0, model: worst, tone: 'wrong', text: `${MODELS[models[worst]].name} ${latest.wrong.toLowerCase()}, ${data.counts[models[worst]][first].wrong} of ${data.counts[models[worst]][first].n}` },
  ];
  if (index('C') >= 0) tags.push({ setup: index('C'), model: worst, tone: 'plain', text: '“Check with the bank first”' });
  if (index('D') >= 0) tags.push({ setup: index('D'), tone: 'kept', text: 'The lock: no repeats' });
  const label = `Every try from experiment ${n} as a block, in ${setups.length} setups. A raised red block is a try where the agent ${latest.wrong.toLowerCase()}. ` +
    latest.setups.map((s) => `${s.name}: ${data.totals[s.id].wrong} of ${data.totals[s.id].n}`).join('. ') + '.';

  return (
    <div className="home">
      <header className="home-hero">
        <div className="home-wrap">
          <nav className="home-nav" aria-label="Site">
            <Link href="/" className="home-brand"><span className="intact-mark" aria-hidden />Intact</Link>
            <ul>
              <li><a href="#research">Research</a></li>
              <li><a href="#platform">Platform</a></li>
              <li><Link href="/method">Method</Link></li>
              <li><a href="#updates">Updates</a></li>
            </ul>
            <div className="home-nav-right">
              <a href={GITHUB}>GitHub</a>
              <Link href={`/experiments/${latest.slug}`} className="home-btn home-btn-main home-btn-sm">See the results</Link>
              <ThemeToggle />
            </div>
          </nav>

          <div className="home-hero-grid">
            <div>
              <h1>AI agents pay twice. Intact measures it, and stops it.</h1>
              <p className="home-lede">An open benchmark that puts agents in front of payment systems that get things wrong. And a platform that checks every payment your own agents make.</p>
              <div className="home-ctas">
                <Link href={`/experiments/${latest.slug}`} className="home-btn home-btn-main">See the results</Link>
                <a href="#platform" className="home-btn home-btn-quiet">See the platform</a>
              </div>
              <p className="home-proof">{runCount} tries, {latest.models.length} models, every transcript public</p>
            </div>
            <TryField setups={setups} tags={tags} label={label} />
          </div>

          <figure className="home-shot" id="platform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="home-shot-light" src="/img/platform-light.webp" width={2880} height={1800} alt={SHOT_ALT} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="home-shot-dark" src="/img/platform.webp" width={2880} height={1800} alt={SHOT_ALT} loading="lazy" />
          </figure>
        </div>
      </header>

      <main>
        <section className="home-wrap home-part" aria-labelledby="both">
          <h2 id="both">We find where agents lose money. Then we build what stops it.</h2>
          <div className="home-two">
            <div id="research">
              <h3>The benchmark <span>open source</span></h3>
              <p>Agents get a payment provider, Ledgerline, that fails the way real ones do: stale statuses, late webhooks, a supplier who insists. We grade where the money went, not what the agent said.</p>
              <ul className="home-items">
                <li><b>{traps} traps</b><span>Each one a way payments really fail</span></li>
                <li><b>{runCount} tries</b><span>Published in full, good and bad</span></li>
                <li><b>Next</b><span>The models agents actually run on, up to Opus</span></li>
              </ul>
              <Link href="/method" className="home-more">Read the method</Link>
            </div>
            <div>
              <h3>The platform <span>private testing</span></h3>
              <p>Sits between your agents and your payment provider. Built from what the benchmark shows breaks.</p>
              <ul className="home-items">
                <li><b>The guard</b><span>Checks with the bank before any repeat payment</span></li>
                <li><b>Approvals</b><span>You decide on anything over your amount</span></li>
                <li><b>Activity</b><span>Every decision, with the reason behind it</span></li>
              </ul>
              <a href={X} className="home-more">Follow the build on X</a>
            </div>
          </div>
        </section>

        <section className="home-wrap home-part" aria-labelledby="results">
          <p className="home-kicker">Experiment {n}, {latest.eyebrow.toLowerCase()}</p>
          <h2 id="results">A payout shows “failed”. The bank already paid. Do agents pay again?</h2>
          <div className="home-results">
            <ResultsTable exp={latest} data={data} />
          </div>
          <Link href={`/experiments/${latest.slug}`} className="home-more">Open every try</Link>
        </section>

        <section className="home-wrap home-part home-updates" aria-labelledby="updates">
          <h2 id="updates">Updates</h2>
          <Updates />
        </section>

        <section className="home-wrap home-close">
          <h2>Before an AI agent touches a company’s money, it should pass Intact.</h2>
          <div className="home-ctas">
            <a href={GITHUB} className="home-btn home-btn-main">Run it on GitHub</a>
            <a href={X} className="home-btn home-btn-quiet">Follow along on X</a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
