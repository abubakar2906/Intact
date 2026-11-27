import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Ladder } from '@/components/a/Ladder';
import { GuardFlow } from '@/components/GuardFlow';
import { ScrollScale } from '@/components/ScrollScale';
import { TryField, type FieldTag } from '@/components/TryField';
import { HomeNav } from '@/components/HomeNav';
import { PLATFORM } from '@/content/how-it-works';
import { Updates } from '@/components/Updates';
import { ModelLogo } from '@/components/ModelName';
import { MODELS } from '@/content/models';
import { experiments, getExperimentData, method, rankModels } from '@/lib/data';
import { exhibitFacts } from '@/lib/exhibit';
import { TwoRecords } from '@/components/a/TwoRecords';
import { Exhibit } from '@/components/b/Exhibit';
import { Findings } from '@/components/Findings';
import { Play } from '@/components/Play';

const GITHUB = 'https://github.com/abubakar2906/Intact';
const X = 'https://x.com/kairo_v0';
const HEADLINE_MODEL = 'qwen/qwen3.8-27b';
const SHOT_ALT = 'The Intact platform: payments checked this week, the flow of money through the guard, the latest decisions, and a payment waiting for approval.';

export default function Home() {
  const latest = experiments[0];
  const data = getExperimentData(latest.slug);
  const runCount = experiments.reduce((n, e) => n + getExperimentData(e.slug).runCount, 0);
  const traps = Object.values(method.scenarios).filter((s) => !s.followUp).length;
  const n = String(latest.number).padStart(2, '0');
  const facts = exhibitFacts(latest, data);

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
  // The headline tag names one model, picked by its id rather than its rank, so it stays put if the ranking moves.
  // If a later experiment leaves that model out, the tag falls back to the worst one.
  const headline = models.includes(HEADLINE_MODEL) ? models.indexOf(HEADLINE_MODEL) : worst;
  const hid = models[headline];
  const tags: FieldTag[] = [
    { setup: 0, model: headline, tone: 'wrong', logo: <ModelLogo id={hid} size={16} />, text: `${MODELS[hid].name} ${latest.wrong.toLowerCase()}, ${data.counts[hid][first].wrong} of ${data.counts[hid][first].n}` },
  ];
  if (index('C') >= 0) tags.push({ setup: index('C'), model: worst, tone: 'plain', text: '“Check with the bank first”' });
  if (index('D') >= 0) tags.push({ setup: index('D'), tone: 'kept', text: 'The lock: no repeats' });
  const label = `Every try from experiment ${n} as a block, in ${setups.length} setups. A raised red block is a try where the agent ${latest.wrong.toLowerCase()}. ` +
    latest.setups.map((s) => `${s.name}: ${data.totals[s.id].wrong} of ${data.totals[s.id].n}`).join('. ') + '.';

  return (
    <div className="home">
      <header className="home-hero">
        <div className="home-wrap">
          <HomeNav home cta={{ href: `/experiments/${latest.slug}`, label: 'See the results' }} />

          <div className="home-hero-grid">
            <div>
              <h1>AI agents pay twice. Intact measures it, and stops it.</h1>
              <div className="home-ctas">
                <Link href={`/experiments/${latest.slug}`} className="home-btn home-btn-main">See the results</Link>
                <a href="#platform" className="home-btn home-btn-quiet">See the platform</a>
              </div>
              <p className="home-proof">{runCount} tries, {latest.models.length} models, every transcript public</p>
            </div>
            <TryField setups={setups} tags={tags} label={label} />
          </div>

        </div>
      </header>

      <main>
        {/* The problem: one real try, the agent's calls beside the bank's record. */}
        <section className="band" id="research" aria-labelledby="problem">
          <div className="home-wrap">
            <div className="ch-head">
              <p className="ch-eyebrow">The problem</p>
              <h2 id="problem">The status said failed. The bank had already paid.</h2>
            </div>
            {facts && (
              <Play>
                <TwoRecords
                  facts={facts}
                  agent={<Exhibit facts={facts} setupName={latest.setups.find((s) => s.id === facts.run.condition)?.name ?? facts.run.setupName} wrongLabel={latest.wrong} />}
                />
              </Play>
            )}
          </div>
        </section>

        {/* The fix: the guard, live, and the dashboard. */}
        <section className="home-wrap chapter" id="platform" aria-labelledby="fix">
          <div className="ch-head">
            <p className="ch-eyebrow">The fix</p>
            <h2 id="fix">Check with the bank before paying again.</h2>
          </div>
          <GuardFlow />
          <ul className="home-rules home-rules-short">
            {PLATFORM.rules.map((r) => <li key={r.title}>{r.title}</li>)}
          </ul>
          <ScrollScale className="home-shot-wrap">
          <figure className="home-shot">
            {/* Both pictures load up front and sit in the same spot. The dark one lies on top and fades in and out
                with the theme, so a switch never waits on a download. The light one stays opaque underneath. */}
            <div className="home-shot-stack">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="home-shot-light" src="/img/platform-light.webp" width={2880} height={1800} alt={SHOT_ALT} fetchPriority="high" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="home-shot-dark" src="/img/platform.webp" width={2880} height={1800} alt="" aria-hidden />
            </div>
          </figure>
          </ScrollScale>
        </section>

        {/* The results: every try. */}
        <section className="band" aria-labelledby="results">
          <div className="home-wrap">
            <div className="ch-head">
              <p className="ch-eyebrow">The results</p>
              <h2 id="results">How often agents {latest.wrong.toLowerCase()}</h2>
            </div>
            <Findings exp={latest} data={data} />
            <div className="home-ladder home-ladder-short"><Ladder exp={latest} data={data} /></div>
            <Link href={`/experiments/${latest.slug}`} className="home-more">Open every try</Link>
          </div>
        </section>

        {/* What is public. */}
        <section className="home-wrap chapter" aria-labelledby="updates">
          <dl className="public">
            <div><dt>{traps}</dt><dd>traps</dd></div>
            <div><dt>{runCount}</dt><dd>tries, every transcript public</dd></div>
            <div><dt>{latest.models.length}</dt><dd>models</dd></div>
          </dl>
          <div className="public-links">
            <Link href="/method" className="home-more">Method</Link>
            <a href={GITHUB} className="home-more">Code and transcripts</a>
          </div>
          <h2 id="updates" className="sr-only">Updates</h2>
          <div className="home-updates"><Updates /></div>
        </section>

        <section className="home-wrap home-close">
          <span className="gate-object" aria-hidden />
          <h2>Before an AI agent touches a company’s money, it should pass Intact.</h2>
          <div className="home-ctas">
            <a href={GITHUB} className="home-btn home-btn-main">Run it on GitHub</a>
            <a href={X} className="home-btn home-btn-quiet">Follow along on X</a>
          </div>
        </section>
      </main>
      <Footer wide />
    </div>
  );
}
