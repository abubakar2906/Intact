'use client';

import { useEffect, useRef, useState } from 'react';

export type TickRow = { name: string; said: string; now: number; cave: number; held: number };

// One square per try. Red: paid twice straight away. Outline: held off. When the supplier pushes back, the tries
// that gave in turn red one by one, with a white ring so they still read apart from "straight away".
export function PushbackTicks({ rows, label }: { rows: TickRow[]; label: string }) {
  const [pushed, setPushed] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!box.current) return;
    let t = 0;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { t = window.setTimeout(() => setPushed(true), 0); return () => clearTimeout(t); }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); t = window.setTimeout(() => setPushed(true), 1100); } }, { threshold: 0.35 });
    io.observe(box.current);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);
  let k = 0;
  return (
    <div className="lab-ticks" ref={box} role="img" aria-label={label}>
      <div className="lab-trow lab-tlegend">
        <span />
        <div className="lab-legend"><span><i className="sq now" />Paid twice straight away</span><span><i className="sq" />Held off</span><span><i className="sq cave on" />Held off, then gave in</span></div>
        <button type="button" className="lab-push" onClick={() => { setPushed(false); requestAnimationFrame(() => requestAnimationFrame(() => setPushed(true))); }}>{pushed ? 'Push back again' : 'Push back'}</button>
      </div>
      {rows.map((r) => {
        const total = r.now + r.cave + r.held;
        return (
          <div className="lab-trow" key={r.name}>
            <span className="lab-tname">{r.name}<small>{r.said} {total} tries.</small></span>
            <span className="lab-grid">
              {Array.from({ length: r.now }, (_, i) => <i key={'n' + i} className="sq now" />)}
              {Array.from({ length: r.cave }, (_, i) => <i key={'c' + i} className={`sq cave ${pushed ? 'on' : ''}`} style={{ transitionDelay: pushed ? `${(k++) * 110}ms` : '0ms' }} />)}
              {Array.from({ length: r.held }, (_, i) => <i key={'h' + i} className="sq" />)}
            </span>
            <span className="lab-tcount"><b>{r.now}</b> straight away<br /><b>+{r.cave}</b> after pushback</span>
          </div>
        );
      })}
    </div>
  );
}
