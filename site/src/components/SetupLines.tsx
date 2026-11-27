'use client';

import { useEffect, useRef, useState } from 'react';

// How the count changes from one setup to the next. A lead chart for all models (out of 50), then one small
// chart per model on the same 0 to 10 scale, so the split reads at a glance: some models drop at the docs note,
// others only at the one sentence. Lines are ink; the wash under them is red, because the height is money paid
// twice. Hovering a setup highlights it in every chart. The lines draw once, left to right, when first seen.
export type LineSetup = { id: string; name: string; short: string; total: { wrong: number; n: number } };
export type LineModel = { id: string; name: string; logo: React.ReactNode; counts: { wrong: number; n: number }[] };

const geom = (w: number, h: number, pad: { l: number; r: number; t: number; b: number }, cols: number, max: number) => {
  const x = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / (cols - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
  return { x, y };
};

function Panel({ values, max, w, h, pad, active, setActive, drawn, big = false, labels, dims }: {
  values: { wrong: number; n: number }[]; max: number; w: number; h: number; pad: { l: number; r: number; t: number; b: number };
  active: number | null; setActive: (i: number | null) => void; drawn: boolean; big?: boolean; labels?: string[]; dims?: string;
}) {
  const { x, y } = geom(w, h, pad, values.length, max);
  const pts = values.map((v, i) => [x(i), y(v.wrong)] as const);
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`).join(' ');
  const area = `${line} L${x(values.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const ticks = big ? [0, max / 2, max] : [0, max];
  const colW = (w - pad.l - pad.r) / (values.length - 1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`sl-svg${big ? ' sl-big' : ''}`} data-drawn={drawn ? '' : undefined} aria-hidden>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className="sl-grid" />
          <text x={pad.l - 10} y={y(t) + 4} textAnchor="end" className="sl-tick">{t}</text>
        </g>
      ))}
      {active !== null && <line x1={x(active)} x2={x(active)} y1={pad.t - 6} y2={y(0)} className="sl-cross" />}
      <path d={area} className="sl-area" />
      <path d={line} className="sl-line" pathLength={1} />
      {pts.map(([px, py], i) => (
        <g key={i} className={`sl-pt${values[i].wrong ? ' is-wrong' : ''}${active === i ? ' is-on' : ''}`} style={{ '--i': i } as React.CSSProperties}>
          <circle cx={px} cy={py} r={big ? 6 : 4.5} />
          {(big || active === i) && <text x={px} y={py - (big ? 16 : 11)} textAnchor="middle" className="sl-val">{values[i].wrong}</text>}
        </g>
      ))}
      {labels && labels.map((l, i) => <text key={l} x={x(i)} y={h - (big ? 14 : 8)} textAnchor="middle" className={`sl-x${active === i ? ' is-on' : ''}`}>{l}</text>)}
      {dims && <text x={w - pad.r} y={pad.t - 14} textAnchor="end" className="sl-tick">{dims}</text>}
      {/* Hit areas: one column per setup, wider than any mark. */}
      {values.map((_, i) => (
        <rect key={i} x={x(i) - colW / 2} y={0} width={colW} height={h} fill="transparent" onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} />
      ))}
    </svg>
  );
}

export function SetupLines({ setups, models, wrongLabel }: { setups: LineSetup[]; models: LineModel[]; wrongLabel: string }) {
  const [active, setActive] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setDrawn(true); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const n = setups[0]?.total.n ?? 50;
  const label = `${wrongLabel}, by setup. All models: ` + setups.map((s) => `${s.name} ${s.total.wrong} of ${s.total.n}`).join(', ') + '. ' +
    models.map((m) => `${m.name}: ` + m.counts.map((c, i) => `${setups[i].short} ${c.wrong} of ${c.n}`).join(', ')).join('. ') + '.';
  return (
    <div ref={box} className="sl" role="img" aria-label={label}>
      <div className="sl-lead">
        {/* Setup names sit over their columns: the lead chart's columns are at 4.8%, then every 30.13%, of its width. */}
        <div className="sl-heads" aria-hidden>
          {setups.map((s, i) => (
            <p key={s.id} className={active === i ? 'is-on' : undefined} style={{ left: `${4.8 + (i * 90.4) / (setups.length - 1)}%` }}>
              <span className="sl-long">{s.name}</span><span className="sl-short">{s.short}</span>
            </p>
          ))}
        </div>
        <Panel values={setups.map((s) => s.total)} max={n} w={1000} h={300} pad={{ l: 48, r: 48, t: 40, b: 24 }} active={active} setActive={setActive} drawn={drawn} big dims={`All models, out of ${n}`} />
      </div>
      <ul className="sl-small">
        {models.map((m) => (
          <li key={m.id}>
            <p className="sl-name">{m.logo}{m.name}</p>
            <Panel values={m.counts} max={10} w={240} h={150} pad={{ l: 28, r: 14, t: 18, b: 30 }} active={active} setActive={setActive} drawn={drawn} labels={setups.map((s) => s.short)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
