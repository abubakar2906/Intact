'use client';

import { useEffect, useRef, useState } from 'react';

// Figure: what one sentence did to each model. Each row runs from 0 to 10 tries. The red dot is the model with
// no hint; the ring is the same model told to check with the bank first; a short grey mark is the note in the docs.
// When the figure is first seen, each ring starts on the red dot and slides to where the sentence left it,
// so the distance it travels is the effect. Values sit beside the marks.
export type SentenceRow = { name: string; logo: string; ink: boolean; before: number; note: number; after: number; n: number };

// Wide: names on the left of each row. Narrow (phones): each name sits above its row.
const GEOM = {
  // LABEL puts the 0 axis where the page's text column starts (column 4 of 12).
  wide: { W: 1040, LABEL: 263, PAD_L: 0, PAD_R: 40, ROW: 56, NAME_DY: 0 },
  narrow: { W: 360, LABEL: 0, PAD_L: 12, PAD_R: 16, ROW: 76, NAME_DY: -26 },
};

// `noteMark` draws the grey mark for the note in the docs; off when the ring itself is the note.
export function OneSentence({ rows, label, narrow = false, noteMark = true }: { rows: SentenceRow[]; label: string; narrow?: boolean; noteMark?: boolean }) {
  const { W, LABEL, PAD_L, PAD_R, ROW, NAME_DY } = GEOM[narrow ? 'narrow' : 'wide'];
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setSeen(true); } }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const max = 10;
  const x = (v: number) => LABEL + PAD_L + (v / max) * (W - LABEL - PAD_L - PAD_R);
  const H = rows.length * ROW + 40 + (narrow ? 14 : 0);
  return (
    <div ref={box} className={`os ${narrow ? 'only-narrow' : 'only-wide'}`} data-seen={seen ? '' : undefined} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} className="os-svg" aria-hidden>
        {[0, 5, 10].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={0} y2={H - 28} className="os-grid" />
            <text x={x(t)} y={H - 8} textAnchor="middle" className="os-axis">{t}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const y = i * ROW + ROW / 2 + (narrow ? 14 : 0);
          const shift = x(r.before) - x(r.after);
          return (
            <g key={r.name} style={{ '--i': i } as React.CSSProperties}>
              <image href={r.logo} x={0} y={y - 8 + NAME_DY} width={16} height={16} className={r.ink ? 'os-ink' : undefined} />
              <text x={26} y={y + 5 + NAME_DY} className="os-name">{r.name}</text>
              <line x1={x(r.after)} x2={x(r.before)} y1={y} y2={y} className="os-span" />
              {noteMark && <line x1={x(r.note)} x2={x(r.note)} y1={y - 7} y2={y + 7} className="os-note" />}
              <circle cx={x(r.before)} cy={y} r={6} className="os-before" />
              <text x={x(r.before)} y={narrow ? y + 22 : y - 13} textAnchor="middle" className="os-val os-val-before">{r.before}</text>
              <g className="os-move" style={{ '--shift': `${shift}px` } as React.CSSProperties}>
                {/* Where nothing changed, the ring sits on its red dot and is filled red, so the dot still shows. */}
                <circle cx={x(r.after)} cy={y} r={6} className={`os-after${r.after === r.before ? ' is-same' : ''}`} />
                <text x={x(r.after)} y={narrow ? y + 22 : y - 13} textAnchor="middle" className="os-val">{r.after}</text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
