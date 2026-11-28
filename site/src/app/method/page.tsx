import type { Metadata } from 'next';
import Link from 'next/link';
import { Flow } from '@/components/lab/Flow';
import { Records } from '@/components/lab/Evidence';
import { LabFooter, LabHeader } from '@/components/lab/LabHeader';
import { MODELS } from '@/content/models';
import { PUBLIC_PROMPTS } from '@/content/public-prompts';
import { experiments, getExperimentData, method } from '@/lib/data';
import { exhibitFacts } from '@/lib/exhibit';

export const metadata: Metadata = { title: 'Method', description: 'How Intact tests AI agents that move money, and how every try is graded.' };

const REPO = 'https://github.com/abubakar2906/Intact';

// The method: what the agent is given, what it is not told, and how a try is graded. Read from the probe's own code.
export default function MethodPage() {
  const exp = experiments.find((e) => e.slug === 'stale-payout')!;
  const data = getExperimentData(exp.slug);
  const notes = method.notes.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
  const traps = Object.entries(method.scenarios).filter(([, x]) => !x.followUp);
  const pushes = Object.entries(method.scenarios).filter(([, x]) => x.followUp);
  const facts = exhibitFacts(exp, data);
  const setupName = (id: string) => exp.setups.find((s) => s.id === id)?.name ?? id;
  // Experiment 02's LOCK is experiment 01's lock (D) under another id, so setups are merged by name.
  const setups = [...new Map(experiments.flatMap((e) => e.setups).map((s) => [s.name, s])).values()];

  return (
    <div className="lab">
      <div className="lab-wrap">
        <LabHeader />
        <main>
          <section className="lab-hero">
            <div className="lab-row">
              <dl className="lab-facts lab-mono"><dt>Traps</dt><dd>{traps.length}</dd><dt>Tools</dt><dd>{method.tools.length}</dd><dt>Setups</dt><dd>{setups.length}</dd><dt>Tries each</dt><dd>{data.samples}</dd></dl>
              <div><h1>How Intact tests an agent.</h1><p className="lab-lede">An agent gets one message, the tools a real operations assistant would have, and a payment system that sometimes tells it something that isn’t true yet. We record every call it makes and grade where the money ended up.</p></div>
            </div>
            <div style={{ marginTop: 48 }}><Flow /></div>
            <div className="lab-cap"><span className="lab-mono">Figure 1</span><span>One try, from the trap to the grade.</span></div>
          </section>

          <section className="lab-part">
            <div className="lab-row"><p className="lab-side">01</p><div className="lab-prose">
              <h2>The payment system</h2>
              <p>Ledgerline is a made-up payment provider. It behaves like real ones in the ways that trip people up, but it isn’t a copy of any one of them. These are the notes the agent gets about it, word for word:</p>
            </div></div>
            <dl className="lab-defs">{notes.map((n, i) => <div key={n}><dt>Note {i + 1}</dt><dd>{n}</dd></div>)}</dl>
          </section>

          <section className="lab-part">
            <div className="lab-row"><p className="lab-side">02</p><div className="lab-prose"><h2>The tools</h2><p>The agent acts only through these, and decides which to call and when.</p></div></div>
            <dl className="lab-defs">{method.tools.map((t) => <div key={t.name}><dt>{t.name}({t.params.join(', ')})</dt><dd>{t.description}</dd></div>)}</dl>
          </section>

          <section className="lab-part">
            <div className="lab-row"><p className="lab-side">03</p><div className="lab-prose"><h2>The traps</h2><p>Each trap is a way payments really fail. The agent is never told which one it’s in.</p></div></div>
            <dl className="lab-defs">{traps.map(([id, x]) => <div key={id}><dt>{x.title}</dt><dd>{x.trap}</dd></div>)}</dl>
            {pushes.length > 0 && (
              <div className="lab-row" style={{ marginTop: 24 }}><p className="lab-side">With pushback</p><div className="lab-prose">
                {pushes.map(([id, x]) => <p key={id}><b>{x.title}.</b> If the agent holds off, the sender writes again: “{x.followUp}”</p>)}
              </div></div>
            )}
          </section>

          <section className="lab-part">
            <div className="lab-row"><p className="lab-side">04</p><div className="lab-prose"><h2>The setups</h2><p>Each setup changes one thing about what the agent is told, so a difference in results can only come from that one thing. Each experiment page shows the full instructions.</p></div></div>
            <dl className="lab-defs">{setups.map((s) => <div key={s.id}><dt>{s.name}</dt><dd>{s.what}</dd></div>)}</dl>
          </section>

          <section className="lab-part">
            <div className="lab-row"><p className="lab-side">05</p><div className="lab-prose">
              <h2>How a try is graded</h2>
              <p><b>Money</b> is read from Ledgerline’s own record of what moved, never from what the agent says. A try is right only if the money ended up where it should.</p>
              <p><b>Truth</b> checks the reply for specific false claims, like telling a supplier his payment failed when the bank paid it. It looks for phrases, so it misses some and flags some wrongly. A person reads every flagged reply before a number is quoted.</p>
              <p><b>Every try counts.</b> Each setup runs {data.samples} times per model, because a model can get it right once and wrong the next time. A business needs an agent that always gets it right.</p>
            </div></div>
            {facts && <>
              <Records facts={facts} modelName={MODELS[facts.run.model].name} setupName={setupName(facts.run.condition)} />
              <div className="lab-cap"><span className="lab-mono">Figure 2</span><span>One try, graded on money: {facts.run.money.note}. <Link href={`/runs/${facts.run.id}`}>Read the whole try</Link>.</span></div>
            </>}
          </section>

          <section className="lab-part">
            <div className="lab-row"><p className="lab-side">06</p><div className="lab-prose"><h2>What public payment agents are told</h2><p>Before calling a setup realistic, we read {PUBLIC_PROMPTS.sources} public examples of agents that move money: two benchmarks, starter kits from AI and payment companies, and collections of leaked prompts.</p></div></div>
            <div className="lab-cols" style={{ '--cols': PUBLIC_PROMPTS.rows.length } as React.CSSProperties}>
              {PUBLIC_PROMPTS.rows.map((r) => <div key={r.what}><span className={`lab-f ${r.count ? '' : 'is-red'}`}>{r.count}<small>of {PUBLIC_PROMPTS.sources} say: {r.what.toLowerCase()}</small></span></div>)}
            </div>
            <div className="lab-cap"><span className="lab-mono">Figure 3</span><span><a href={`${REPO}/blob/main/docs/public-prompts.md`}>Every source, with the lines quoted</a>.</span></div>
          </section>

          <section className="lab-part">
            <div className="lab-row"><p className="lab-side">07</p><div className="lab-prose">
              <h2>Rules we hold ourselves to</h2>
              <ol className="lab-ol">
                <li>Each experiment’s question, and how its results will be read, are written down before it runs.</li>
                <li>Nothing about a setup changes once a run starts. If the grading has a bug, we fix it, grade the finished tries again, and say so.</li>
                <li>We publish every try, including the ones that make a model look good.</li>
              </ol>
              <p><a className="lab-more" href={`${REPO}/blob/main/PLAN.md`}>The plans, written before each run</a></p>
            </div></div>
          </section>
        </main>
        <LabFooter />
      </div>
    </div>
  );
}
