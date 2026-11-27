'use client';

import { useEffect, useRef, useState } from 'react';

// A step chart: one value per setup, drawn as a level that steps down from left to right, with a light red
// fill under it for the money that went wrong. `big` is the figure across the page, with large numerals on each
// step; the small version is one model, for a row of small multiples. The step line draws once, left to right,
// when first seen; the fill and numerals follow it.
export type Step = { name: string; wrong: number; n: number };

export function StepChart({ steps, max, big = false, title, label }: { steps: Step[]; max: number; big?: boolean; title?: React.ReactNode; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setSeen(true); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const W = big ? 1280 : 240;
  const H = big ? 420 : 120;
  const top = big ? 120 : 22; // room for numerals above the steps
  const bottom = 6;
  const colW = W / steps.length;
  const y = (v: number) => top + (1 - v / max) * (H - top - bottom);
  // Across each column at its level, then straight down (or up) to the next one.
  const line = steps.map((s, i) => `${i ? 'V' : 'M0,'}${y(s.wrong)} H${(i + 1) * colW}`).join(' ');
  const area = `${line} V${H - bottom} H0 Z`;

  return (
    <div ref={box} className={`sc${big ? ' sc-big' : ''}`} data-seen={seen ? '' : undefined} role="img" aria-label={label}>
      {title && <p className="sc-title">{title}</p>}
      <svg viewBox={`0 0 ${W} ${H}`} className="sc-svg" aria-hidden>
        <line x1={0} x2={W} y1={H - bottom + 0.5} y2={H - bottom + 0.5} className="sc-base" />
        {steps.map((_, i) => i > 0 && <line key={i} x1={i * colW + 0.5} x2={i * colW + 0.5} y1={top - (big ? 96 : 0)} y2={H - bottom} className="sc-col" />)}
        <path d={area} className="sc-area" />
        <path d={line} className="sc-line" pathLength={1} />
        {steps.map((s, i) => (
          <g key={s.name} className="sc-step" style={{ '--i': i } as React.CSSProperties}>
            <text x={i * colW + (big ? 16 : 4)} y={y(s.wrong) - (big ? 18 : 6)} className={`sc-num${s.wrong ? ' is-wrong' : ''}`}>{s.wrong}</text>
          </g>
        ))}
      </svg>
      {/* The setup names under their columns. HTML, so they stay readable at any width. */}
      {big && (
        <ol className="sc-names" aria-hidden>
          {steps.map((s) => <li key={s.name}><b>{s.name}</b><span>{s.wrong} of {s.n} paid twice</span></li>)}
        </ol>
      )}
    </div>
  );
}
