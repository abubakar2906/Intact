import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { HomeNav } from '@/components/HomeNav';
import { Updates } from '@/components/Updates';
import { TwoRecords } from '@/components/a/TwoRecords';
import { Exhibit } from '@/components/b/Exhibit';
import { Play } from '@/components/Play';
import { TryLedger } from '@/components/ledger/TryLedger';
import { Statements } from '@/components/ledger/Statements';
import { experiments, getExperimentData, method } from '@/lib/data';
import { exhibitFacts } from '@/lib/exhibit';

const GITHUB = 'https://github.com/abubakar2906/Intact';
const X = 'https://x.com/kairo_v0';

// The home page as a lab's front page: the research first, set as a ledger on ruled paper.
// Every line and count is read from the published runs.
export default function Home() {
  const latest = experiments[0];
  const data = getExperimentData(latest.slug);
  const runCount = experiments.reduce((n, e) => n + getExperimentData(e.slug).runCount, 0);
  const traps = Object.values(method.scenarios).filter((s) => !s.followUp).length;
  const n = String(latest.number).padStart(2, '0');
  const first = latest.setups[0];
  const facts = exhibitFacts(latest, data);

  return (
    <div className="home lab">
      <header className="lab-top">
        <div className="home-wrap">
          <HomeNav home cta={{ href: `/experiments/${latest.slug}`, label: 'Read the research' }} />
          <div className="lab-hero">
            <h1>An AI lab for agents that move money.</h1>
            <p>We put agents in front of payment systems that get things wrong, and record where the money went.</p>
          </div>
        </div>
      </header>

      <main>
        {/* The latest research, as its ledger. */}
        <section className="home-wrap lab-part lab-first" id="research" aria-labelledby="latest">
          <p className="lab-kicker"><span>Experiment {n}</span><span>{latest.eyebrow}</span></p>
          <h2 id="latest"><Link href={`/experiments/${latest.slug}`}>{latest.claim}</Link></h2>
          <TryLedger exp={latest} data={data} setup={first.id} />
        </section>

        {/* One try, read closely. */}
        <section className="home-wrap lab-part" aria-labelledby="one">
          <h2 id="one" className="lab-h">One try, read closely</h2>
          {facts && (
            <Play>
              <TwoRecords
                facts={facts}
                agent={<Exhibit facts={facts} setupName={latest.setups.find((s) => s.id === facts.run.condition)?.name ?? facts.run.setupName} wrongLabel={latest.wrong} />}
              />
            </Play>
          )}
        </section>

        {/* The results, one statement per setup. */}
        <section className="home-wrap lab-part" aria-labelledby="results">
          <h2 id="results" className="lab-h">What stopped it</h2>
          <Statements exp={latest} data={data} />
          <Link href={`/experiments/${latest.slug}`} className="home-more">Every try in experiment {n}</Link>
        </section>

        {/* The research, as a ledger of its own. */}
        <section className="home-wrap lab-part" aria-labelledby="updates">
          <h2 id="updates" className="lab-h">Research</h2>
          <Updates />
          <dl className="lab-counts">
            <div><dt>{traps}</dt><dd>traps</dd></div>
            <div><dt>{runCount}</dt><dd>tries, every transcript public</dd></div>
            <div><dt>{latest.models.length}</dt><dd>models</dd></div>
          </dl>
          <div className="lab-links">
            <Link href="/method" className="home-more">Method</Link>
            <a href={GITHUB} className="home-more">Code and transcripts</a>
          </div>
        </section>

        {/* What we build from it: small, last. */}
        <section className="home-wrap lab-part" id="platform" aria-labelledby="build">
          <h2 id="build" className="lab-h">What we build from it</h2>
          <div className="lab-guard">
            <p>A guard between agents and their payment tools. It checks with the bank before any repeat payment.</p>
            <div className="lab-stamp-line" aria-label="A repeat payment, stopped by the guard">
              <span className="lg-no">0042</span>
              <span>Repeat payment for invoice INV-88</span>
              <span className="lab-stamp">Stopped. Already paid</span>
            </div>
            <a href={X} className="home-more">In private testing. Follow along on X</a>
          </div>
        </section>
      </main>
      <Footer wide />
    </div>
  );
}
