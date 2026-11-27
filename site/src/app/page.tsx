import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { Ladder } from '@/components/a/Ladder';
import { GuardFlow } from '@/components/GuardFlow';
import { ScrollScale } from '@/components/ScrollScale';
import { ScrollStory } from '@/components/ScrollStory';
import { TryField, type FieldTag } from '@/components/TryField';
import { HomeNav } from '@/components/HomeNav';
import { PLATFORM } from '@/content/how-it-works';
import { Updates } from '@/components/Updates';
import { ModelLogo } from '@/components/ModelName';
import { MODELS } from '@/content/models';
import { experiments, getExperimentData, method, rankModels } from '@/lib/data';
import { exhibitFacts, storyData } from '@/lib/exhibit';
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
  const story = storyData(latest, data, method.tools.map((t) => t.name), (id) => MODELS[id].name);

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
              <p className="home-lede">An open benchmark that puts agents in front of payment systems that get things wrong. And a platform that checks every payment your own agents make.</p>
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
        {/* Chapter 1: one real try, the agent's record beside the bank's. */}
        <section className="band" id="research" aria-labelledby="ch1">
          <div className="home-wrap">
            <div className="ch-head">
              <h2 id="ch1">One payment. Paid twice.</h2>
              <p>Chidi asks for his {facts ? `₦${facts.first.amountNaira.toLocaleString('en-NG')}` : 'money'} again, because Ledgerline says the transfer failed. The bank paid him days ago. This is one agent’s try, call by call, beside his bank statement.</p>
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

        {/* Chapter 2: how the benchmark grades a try, told as you scroll. */}
        <section className="home-wrap chapter" aria-labelledby="how-h">
          <div className="ch-head">
            <h2 id="how-h">How Intact grades it</h2>
            <p>The agent only acts through tools. Every call goes through Ledgerline, and the grade is read from where the money went, never from what the agent said.</p>
          </div>
          {story && <ScrollStory story={story} />}
        </section>

        {/* Chapter 3: what we found, every try. */}
        <section className="band" aria-labelledby="results">
          <div className="home-wrap">
            <div className="ch-head">
              <h2 id="results">What we found</h2>
              <p>Five open models, ten tries each, in four setups. How often each setup ended with the supplier {latest.wrong.toLowerCase()}:</p>
            </div>
            <Findings exp={latest} data={data} />
            <div className="home-ladder"><Ladder exp={latest} data={data} /></div>
            <Link href={`/experiments/${latest.slug}`} className="home-more">Open every try in experiment {n}</Link>
          </div>
        </section>

        {/* Chapter 4: what stops it. */}
        <section className="home-wrap chapter" id="platform" aria-labelledby="platform-h">
          <div className="ch-head">
            <h2 id="platform-h">{PLATFORM.heading}</h2>
            <p>{PLATFORM.body}</p>
          </div>
          <GuardFlow />
          <ul className="home-rules">
            {PLATFORM.rules.map((r) => (
              <li key={r.title}><b>{r.title}</b><span>{r.body}</span></li>
            ))}
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
          <p className="home-note">In the benchmark, a lock in the transfer tool stopped every repeat payment: {data.totals.D ? `${data.totals.D.wrong} of ${data.totals.D.n}` : 'none got through'}. The guard is in private testing now.</p>
        </section>

        {/* Chapter 5: everything is public. */}
        <section className="home-wrap chapter" aria-labelledby="updates">
          <div className="ch-head">
            <h2 id="updates">Every try is public</h2>
            <p>The question and how we would read it are written down before each run. Every transcript, good and bad, is in the repository.</p>
          </div>
          <dl className="public">
            <div><dt>{traps}</dt><dd>traps, each a way payments really fail</dd></div>
            <div><dt>{runCount}</dt><dd>tries, published in full</dd></div>
            <div><dt>{latest.models.length}</dt><dd>open models so far. Next: the models agents actually run on, up to Opus</dd></div>
          </dl>
          <div className="public-links">
            <Link href="/method" className="home-more">Read the method</Link>
            <a href={GITHUB} className="home-more">See the code and transcripts</a>
          </div>
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
