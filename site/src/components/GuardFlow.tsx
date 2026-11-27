'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// The platform in one picture: payments an agent asks for travel to the guard, and each ends where the guard
// sends it. Grey goes on to the bank, green is kept from paying twice, amber waits for a person. The payments
// are the dashboard demo's own (a made-up business). Plays once when it comes into view; Play again replays it.
// With reduced motion every payment shows where it ended.
type Fate = 'sent' | 'kept' | 'wait';
const PAYMENTS: { who: string; what: string; amount: string; fate: Fate; outcome: string }[] = [
  { who: 'Lagos Logistics', what: 'invoice LL-560', amount: '₦86,000', fate: 'sent', outcome: 'Sent' },
  { who: 'Ada Nwosu', what: 'refund for order 4471', amount: '₦18,500', fate: 'sent', outcome: 'Sent' },
  { who: 'Chidi’s Farm Produce', what: 'invoice INV-88, again', amount: '₦250,000', fate: 'kept', outcome: 'Stopped. INV-88 arrived on 21 Nov' },
  { who: 'Kemi Textiles', what: 'invoice KT-2209', amount: '₦1,200,000', fate: 'wait', outcome: 'Waiting for you. Over ₦500,000' },
];
// When each payment sets off, in ms. The gaps shrink, so the four read as one stream, not a queue.
const START = [0, 520, 960, 1500];
const TO_GATE = 760;
const ON = 680;

// Where a payment is: waiting at the start, at the gate, or where it ended.
type Spot = 'start' | 'gate' | 'end';

export function GuardFlow() {
  const box = useRef<HTMLDivElement>(null);
  const [spots, setSpots] = useState<Spot[]>(() => PAYMENTS.map(() => 'start'));
  const timers = useRef<number[]>([]);

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setSpots(PAYMENTS.map(() => 'end')); return; }
    setSpots(PAYMENTS.map(() => 'start'));
    PAYMENTS.forEach((p, i) => {
      timers.current.push(window.setTimeout(() => setSpots((s) => s.map((x, k) => (k === i ? 'gate' : x))), 60 + START[i]));
      // A payment the guard stops stays at the gate; the rest go on once the guard has let them through.
      timers.current.push(window.setTimeout(() => setSpots((s) => s.map((x, k) => (k === i ? 'end' : x))), 60 + START[i] + TO_GATE + (p.fate === 'kept' ? 120 : 220)));
    });
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); play(); } }, { threshold: 0.5 });
    io.observe(el);
    const t = timers.current;
    return () => { io.disconnect(); t.forEach(clearTimeout); };
  }, [play]);

  return (
    <div ref={box} className="gf" role="img" aria-label={'Four payments go through the guard. ' + PAYMENTS.map((p) => `${p.who}, ${p.amount}: ${p.outcome}.`).join(' ')}>
      <div className="gf-head" aria-hidden>
        <span>Your agents ask to pay</span>
        <span className="gf-gate-label">The guard</span>
        <span>Where it went</span>
      </div>
      <div className="gf-lanes" aria-hidden style={{ '--to-gate': `${TO_GATE}ms`, '--on': `${ON}ms` } as React.CSSProperties}>
        <div className="gf-gate"><i /></div>
        {PAYMENTS.map((p, i) => (
          <div key={p.who} className={`gf-lane gf-${p.fate}`} data-spot={spots[i]}>
            <div className="gf-token">
              <b>{p.who}</b>
              <span>{p.what}</span>
              <em>{p.amount}</em>
            </div>
            <p className="gf-outcome"><i />{p.outcome}</p>
          </div>
        ))}
      </div>
      <button type="button" className="gf-replay" onClick={play}>Play again</button>
    </div>
  );
}
