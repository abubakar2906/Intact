'use client';

import { useEffect, useRef, useState } from 'react';

// Figure: every try as one hairline tick, one row per setup, grouped by model.
// A try that paid twice stands tall and red; one handed to a person is amber; one that got it right is a short
// grey tick. The ticks rise from the baseline the first time the figure is seen, left to right, row after row.
// Hovering a model's group shows that model in every row and dims the rest.
export type TickRow = { id: string; name: string; wrong: number; n: number; tries: { model: number; verdict: 'wrong' | 'right' | 'escalated' | 'error' }[] };

// Two drawings of the same figure: wide, with names and counts beside each row, and narrow for phones,
// with them above each row. The page shows one or the other with CSS.
const GEOM = {
  wide: { W: 1040, LABEL: 196, COUNT: 96, ROW: 76, TALL: 34, SHORT: 11, GROUP_GAP: 14, TOP: 28 },
  narrow: { W: 360, LABEL: 0, COUNT: 0, ROW: 78, TALL: 26, SHORT: 9, GROUP_GAP: 8, TOP: 0 },
};

export function TryTicks({ rows, models, label, narrow = false }: { rows: TickRow[]; models: string[]; label: string; narrow?: boolean }) {
  const { W, LABEL, COUNT, ROW, TALL, SHORT, GROUP_GAP, TOP } = GEOM[narrow ? 'narrow' : 'wide'];
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setSeen(true); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Ticks are spaced evenly across the plot, with a small gap between models.
  const perModel = Math.max(...rows.map((r) => Math.max(...models.map((_, m) => r.tries.filter((t) => t.model === m).length))));
  const plot = W - LABEL - COUNT;
  const step = (plot - GROUP_GAP * (models.length - 1)) / (perModel * models.length);
  const xOf = (m: number, k: number) => LABEL + m * (perModel * step + GROUP_GAP) + k * step + step / 2;
  const H = rows.length * ROW + TOP;

  return (
    <div ref={box} className={`tt ${narrow ? 'only-narrow' : 'only-wide'}`} data-seen={seen ? '' : undefined} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} className="tt-svg">
        {/* Model names over their groups. */}
        {!narrow && models.map((name, m) => (
          <text key={name} x={xOf(m, 0) - step / 2} y={12} className={`tt-model${hover === m ? ' is-on' : ''}`}>{name}</text>
        ))}
        {rows.map((r, ri) => {
          const base = TOP + ri * ROW + ROW - 22;
          // Narrow: the name and count sit on a line above the marks.
          const textY = narrow ? base - TALL - 10 : base - 4;
          const counters = models.map(() => 0);
          return (
            <g key={r.id}>
              <text x={0} y={textY} className="tt-name">{r.name}</text>
              <line x1={LABEL - (narrow ? 0 : step / 2)} x2={narrow ? W : W - COUNT + 12} y1={base + 0.5} y2={base + 0.5} className="tt-base" />
              {r.tries.map((t, i) => {
                const k = counters[t.model]++;
                const h = t.verdict === 'wrong' ? TALL : t.verdict === 'error' ? 3 : SHORT;
                const x = xOf(t.model, k);
                const order = t.model * perModel + k;
                return (
                  <line key={i} x1={x} x2={x} y1={base} y2={base - h}
                    className={`tt-tick tt-${t.verdict}${hover !== null && hover !== t.model ? ' is-dim' : ''}`}
                    style={{ '--d': `${ri * 140 + order * 9}ms` } as React.CSSProperties} />
                );
              })}
              <text x={W} y={textY} textAnchor="end" className="tt-count">
                <tspan className={r.wrong ? 'is-wrong' : undefined}>{r.wrong}</tspan>
                <tspan className="tt-of"> / {r.n}</tspan>
              </text>
            </g>
          );
        })}
        {/* Hover areas, one per model group, the full height of the figure. */}
        {models.map((name, m) => (
          <rect key={name} x={xOf(m, 0) - step / 2 - GROUP_GAP / 2} y={0} width={perModel * step + GROUP_GAP} height={H} fill="transparent"
            onMouseEnter={() => setHover(m)} onMouseLeave={() => setHover(null)} />
        ))}
      </svg>
    </div>
  );
}
