'use client';

import { useEffect, useRef, useState } from 'react';
import { HOW_STEPS } from '@/content/how-it-works';
import type { StoryData } from '@/lib/exhibit';

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const hhmm = (iso: string) => iso.slice(11, 16);

// How the benchmark works, told as you scroll. The steps scroll by on the left; a pinned stage on the
// right shows the record each step leaves, from one real published try. A step takes the stage when it
// crosses the middle of the screen. Inside a stage the parts arrive in order (one entrance per stage);
// leaving is quick and all at once. On a phone each stage sits under its own step instead of pinning.
// With reduced motion the stages simply swap.
export function ScrollStory({ story }: { story: StoryData }) {
  const [active, setActive] = useState(0);
  const steps = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step));
      },
      // A thin band across the middle of the screen: whichever step is in it owns the stage.
      { rootMargin: '-48% 0px -48% 0px' },
    );
    steps.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const stages = [<Trap key="trap" s={story} />, <Agent key="agent" s={story} />, <Calls key="calls" s={story} />, <Grade key="grade" s={story} />];

  return (
    <div className="story">
      <ol className="story-steps">
        {HOW_STEPS.map((step, i) => (
          <li key={step.title} ref={(el) => { steps.current[i] = el; }} data-step={i} className={`story-step${active === i ? ' is-active' : ''}`}>
            <div className="story-text">
              <span className="story-n">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
            {/* The phone's copy of this step's stage. Hidden on wide screens, where the pinned stage shows it. */}
            <div className="story-inline">{stages[i]}</div>
          </li>
        ))}
      </ol>
      <div className="story-stage" aria-hidden>
        <div className="story-frame">
          {stages.map((stage, i) => (
            <div key={i} className={`story-panel${active === i ? ' is-on' : ''}`}>{stage}</div>
          ))}
          <div className="story-dots">{stages.map((_, i) => <i key={i} className={active === i ? 'is-on' : ''} />)}</div>
        </div>
      </div>
    </div>
  );
}

// 1. The trap: two records of the same payment that disagree.
function Trap({ s }: { s: StoryData }) {
  return (
    <div className="st st-trap">
      <div className="st-card" style={{ '--k': 0 } as React.CSSProperties}>
        <p className="st-label">Ledgerline says</p>
        <p className="st-ref">{s.first.reference}</p>
        <p className="st-amt">{naira(s.first.amountNaira)}</p>
        <p className="st-pill">{s.saw ?? 'failed'}</p>
      </div>
      <div className="st-vs" style={{ '--k': 1 } as React.CSSProperties}>but</div>
      <div className="st-card" style={{ '--k': 2 } as React.CSSProperties}>
        <p className="st-label">The bank says</p>
        <p className="st-ref">{s.first.bank} ···· {s.first.account.slice(-4)}</p>
        <p className="st-amt">{naira(s.first.amountNaira)}</p>
        <p className="st-pill st-pill-done">credited {day(s.first.credited)}, {hhmm(s.first.credited)}</p>
      </div>
    </div>
  );
}

// 2. The agent: one message, and the tools it has. The one that would have saved it is marked.
function Agent({ s }: { s: StoryData }) {
  return (
    <div className="st st-agent">
      <div className="st-msg" style={{ '--k': 0 } as React.CSSProperties}>
        <p className="st-label">{s.from} writes</p>
        <p>“{s.message}”</p>
      </div>
      <p className="st-label" style={{ '--k': 1 } as React.CSSProperties}>The agent’s tools</p>
      <ul className="st-tools">
        {s.tools.map((t, i) => (
          <li key={t} className={t === 'verify_transfer' ? 'is-key' : undefined} style={{ '--k': 1 + i * 0.35 } as React.CSSProperties}>{t}</li>
        ))}
      </ul>
      <p className="st-foot" style={{ '--k': 2 + s.tools.length * 0.35 } as React.CSSProperties}><b>verify_transfer</b> asks the bank. Nothing tells the agent it needs to.</p>
    </div>
  );
}

// 3. The record: every call, in order, as Ledgerline saw it. The one that moved money twice is red.
function Calls({ s }: { s: StoryData }) {
  return (
    <div className="st st-calls">
      <p className="st-label" style={{ '--k': 0 } as React.CSSProperties}>{s.modelName}, {s.setupName.toLowerCase()}, try {s.sample}</p>
      <ol>
        {s.calls.map((c, i) => (
          <li key={i} className={c.bad ? 'is-wrong' : undefined} style={{ '--k': 0.6 + i } as React.CSSProperties}>
            <span className="st-n">{i + 1}</span>
            <code>{c.name} <span>{c.call}</span></code>
            <p>{c.result}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

// 4. The grade: read from where the money went, then the reply checked for false claims.
function Grade({ s }: { s: StoryData }) {
  const total = s.first.amountNaira + (s.resend?.amountNaira ?? 0);
  return (
    <div className="st st-grade">
      <p className="st-label" style={{ '--k': 0 } as React.CSSProperties}>{s.first.payee}’s account, invoice {s.first.reference.replace(/^TRF-/, '')}</p>
      <ul className="st-lines">
        <li style={{ '--k': 0.5 } as React.CSSProperties}><span>{day(s.first.credited)}</span><span>{s.first.reference}</span><b>+{naira(s.first.amountNaira)}</b></li>
        {s.resend && <li className="is-wrong" style={{ '--k': 1.3 } as React.CSSProperties}><span>{s.resend.credited ? day(s.resend.credited) : 'Later'}</span><span>{s.resend.reference}</span><b>+{naira(s.resend.amountNaira)}</b></li>}
      </ul>
      <div className="st-verdict" style={{ '--k': 2.2 } as React.CSSProperties}>
        <p className="st-total">{naira(total)}</p>
        <p>received for a {naira(s.first.amountNaira)} invoice</p>
        <p className="st-stamp">{s.wrongLabel}</p>
      </div>
      <dl className="st-checks" style={{ '--k': 3 } as React.CSSProperties}>
        <div><dt>Money</dt><dd className="is-wrong">{s.money}</dd></div>
        {s.truth && <div><dt>Truth</dt><dd>{s.truth}</dd></div>}
      </dl>
    </div>
  );
}
