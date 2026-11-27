import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { NxHeader } from '@/components/NxHeader';
import { Exhibit } from '@/components/b/Exhibit';
import { Play } from '@/components/Play';
import { PublicTally } from '@/components/PublicTally';
import { HOW_STEPS } from '@/content/how-it-works';
import { MODELS } from '@/content/models';
import { PUBLIC_PROMPTS } from '@/content/public-prompts';
import { experiments, getExperimentData, method } from '@/lib/data';
import { exhibitFacts } from '@/lib/exhibit';

export const metadata: Metadata = { title: 'Method', description: 'How Intact tests AI agents that move money, and how every try is graded.' };

const REPO = 'https://github.com/abubakar2906/Intact';

// The method, as a research note on the lab's sidebar grid.
export default function MethodPage() {
  const exp = experiments[0];
  const data = getExperimentData(exp.slug);
  const samples = data.samples;
  const notes = method.notes.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
  const traps = Object.entries(method.scenarios);
  const facts = exhibitFacts(exp, data);
  const setupName = (id: string) => exp.setups.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="note nx">
      <NxHeader />
      <main>
        <section className="nx-row nx-hero">
          <p className="nx-side">Method</p>
          <div className="nx-main"><h1>How Intact tests an agent</h1></div>
        </section>

        <section className="nx-row nx-intro">
          <dl className="nx-side nx-facts">
            <div><dt>Traps</dt><dd>{traps.filter(([, s]) => !s.followUp).length}</dd></div>
            <div><dt>Tools</dt><dd>{method.tools.length}</dd></div>
            <div><dt>Tries each</dt><dd>{samples}</dd></div>
          </dl>
          <div className="nx-main nx-prose">
            <p className="lede">
              An agent gets one message, the tools a real operations assistant would have, and a payment system that sometimes tells it something that isn’t true yet.
              We record every call it makes and grade where the money ended up.
            </p>
            <ol className="nx-steps">
              {HOW_STEPS.map((s) => <li key={s.title}><span><b>{s.title}.</b> {s.body}</span></li>)}
            </ol>
          </div>
        </section>

        <section className="nx-row nx-section">
          <p className="nx-side">01</p>
          <div className="nx-main nx-prose">
            <h2>The payment system</h2>
            <p>Ledgerline is a made-up payment provider. It behaves like real ones in the ways that trip people up, but it is not a copy of any one of them. These are the notes the agent is given about it, word for word:</p>
            <ul className="nx-mono-list">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
            <p>Some experiments remove or add one of these lines on purpose. Each experiment page shows the exact instructions for every setup.</p>
          </div>
        </section>

        <section className="nx-row nx-section">
          <p className="nx-side">02</p>
          <div className="nx-main nx-prose">
            <h2>The tools</h2>
            <p>The agent acts only through these. It decides which to call and when.</p>
            <dl className="nx-defs">
              {method.tools.map((t) => <div key={t.name}><dt>{t.name}</dt><dd>{t.description}</dd></div>)}
            </dl>
          </div>
        </section>

        <section className="nx-row nx-section">
          <p className="nx-side">03</p>
          <div className="nx-main nx-prose">
            <h2>The traps</h2>
            <p>Each trap is a way payments really fail. The agent is never told which one it is in.</p>
            <dl className="nx-defs nx-defs-wide">
              {traps.map(([id, s]) => <div key={id}><dt>{s.title}</dt><dd>{s.trap}</dd></div>)}
            </dl>
          </div>
        </section>

        <section className="nx-row nx-section">
          <p className="nx-side">04</p>
          <div className="nx-main nx-prose">
            <h2>How a try is graded</h2>
            <p><b>Money</b> is read from Ledgerline’s own records of what moved, never from what the agent says. A try is right only if the money ended up where it should.</p>
            <p><b>Truth</b> checks the reply for specific false claims, like telling a supplier his payment failed when the bank paid it. This check looks for phrases, so it misses some and flags some wrongly. Every flagged reply is read by a person before a number is quoted.</p>
            <p><b>Every try counts.</b> Each setup runs {samples} times per model, because a model can get it right once and wrong the next time. A business needs an agent that always gets it right.</p>
          </div>
        </section>
        {facts && (
          <figure className="nx-fig nx-fig-narrow">
            <Play>
              <Exhibit facts={facts} setupName={setupName(facts.run.condition)} wrongLabel={exp.wrong} />
            </Play>
            <figcaption className="nx-cap"><span className="nx-side">Figure 1</span><span className="nx-main">One try as Ledgerline recorded it: {MODELS[facts.run.model].name}, {setupName(facts.run.condition).toLowerCase()}, try {facts.run.sample}. Graded on money: {facts.run.money.note}.</span></figcaption>
          </figure>
        )}

        <section className="nx-row nx-section">
          <p className="nx-side">05</p>
          <div className="nx-main nx-prose">
            <h2>What public payment agents are told</h2>
            <p>Before calling a setup realistic, we read {PUBLIC_PROMPTS.sources} public examples of agents that move money: two benchmarks, starter kits from AI and payment companies, and collections of leaked prompts. How many tell the agent to:</p>
          </div>
        </section>
        <figure className="nx-fig nx-fig-narrow">
          <PublicTally />
          <figcaption className="nx-cap"><span className="nx-side">Figure 2</span><span className="nx-main">One square per example, filled where the instructions say it. Where duplicate protection exists, it is in code, not in the instructions. <a href={`${REPO}/blob/main/docs/public-prompts.md`}>Every source, with the lines quoted</a>.</span></figcaption>
        </figure>

        <section className="nx-row nx-section nx-end">
          <p className="nx-side">06</p>
          <div className="nx-main nx-prose">
            <h2>Rules we hold ourselves to</h2>
            <ol className="nx-steps">
              <li>Each experiment’s question and how its results will be read are written down before it runs.</li>
              <li>Nothing about a setup changes once a run starts. If the grading has a bug, we fix it, grade the finished tries again, and say so.</li>
              <li>We publish every try, including the ones that make a model look good.</li>
            </ol>
          </div>
        </section>
      </main>
      <Footer wide />
    </div>
  );
}
