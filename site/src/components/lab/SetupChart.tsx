'use client';

import { useEffect, useRef, useState } from 'react';

export type ChartModel = { name: string; logo: string; ink: boolean };
export type ChartSetup = { name: string; said: string; wrong: number[]; n: number[] };

// One bar per model, one button per setup. Picking a setup moves the bars to that setup's counts.
// With `autoplay`, it steps through every setup once when it first comes into view, then hands over to the reader.
export function SetupChart({ models, setups, wrongLabel, autoplay = false, label }: { models: ChartModel[]; setups: ChartSetup[]; wrongLabel: string; autoplay?: boolean; label: string }) {
  const [i, setI] = useState(0);
  const [shownTotal, setShownTotal] = useState(() => setups[0].wrong.reduce((a, b) => a + b, 0));
  const touched = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const s = setups[i];
  const total = s.wrong.reduce((a, b) => a + b, 0);
  const of = s.n.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...setups.flatMap((x) => x.n));

  // The big number counts to its new value, so a change reads as a change.
  useEffect(() => {
    const from = shownTotal;
    if (from === total) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = still ? 1 : Math.min(1, (t - t0) / 700);
      setShownTotal(Math.round(from + (total - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  useEffect(() => {
    if (!autoplay || !box.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timers: number[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setups.forEach((_, k) => { if (k) timers.push(window.setTimeout(() => !touched.current && setI(k), 1800 * k)); });
      timers.push(window.setTimeout(() => !touched.current && setI(0), 1800 * setups.length + 600));
    }, { threshold: 0.4 });
    io.observe(box.current);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, [autoplay, setups]);

  const pick = (k: number) => { touched.current = true; setI(k); };

  return (
    <div className="lab-chart" ref={box} role="group" aria-label={label}>
      <div className="lab-chart-top">
        <p className={`lab-total ${total ? 'is-red' : ''}`} aria-live="polite">{shownTotal}<small>of {of} tries {wrongLabel.toLowerCase()}</small></p>
        <div>
          <div className="lab-seg" role="group" aria-label="What the agent was told">
            {setups.map((x, k) => <button key={x.name} type="button" aria-pressed={k === i} onClick={() => pick(k)}>{x.name}</button>)}
          </div>
          <p className="lab-said">{s.said}</p>
        </div>
      </div>
      <div className="lab-bars">
        {models.map((m, j) => (
          <div className="lab-bar" key={m.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="lab-who"><img src={m.logo} alt="" className={m.ink ? 'lab-ink' : ''} /><span>{m.name}</span></span>
            <span className="lab-track"><span className="lab-fill" style={{ width: `${(s.wrong[j] / max) * 100}%` }} /></span>
            <span className="lab-num">{s.wrong[j]}<small>/{s.n[j]}</small></span>
          </div>
        ))}
      </div>
    </div>
  );
}
