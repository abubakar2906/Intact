'use client';

import { useEffect, useRef, useState } from 'react';

// Data drawn as an image. Each try is one strand of ink growing up from the ground. A try that paid twice is red,
// and as it grows a second strand peels away from it: the second payment. The shapes are seeded from the try's
// id, so the drawing is the same on every visit and changes only when the data does. Strands grow once, when
// first seen, from left to right; each second strand peels off after its first has grown.
export type Strand = { id: string; verdict: 'wrong' | 'right' | 'escalated' | 'error' };

// A small seeded random, so the same try always gets the same shape.
function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function StrandField({ strands, w = 320, h = 420, delay = 0, label, small = false }: {
  strands: Strand[]; w?: number; h?: number; delay?: number; label: string; small?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setSeen(true); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pad = small ? 6 : 10;
  const gap = (w - pad * 2) / Math.max(1, strands.length - 1);
  return (
    <div ref={box} className={`sf${small ? ' sf-small' : ''}`} data-seen={seen ? '' : undefined} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${w} ${h}`} className="sf-svg" aria-hidden>
        <line x1={0} x2={w} y1={h - 0.5} y2={h - 0.5} className="sf-ground" />
        {strands.map((s, i) => {
          const r = seeded(s.id);
          const x = pad + i * gap;
          const tall = s.verdict === 'wrong' ? 0.78 + r() * 0.18 : s.verdict === 'error' ? 0.08 : 0.34 + r() * 0.3;
          const len = tall * (h - 8);
          const sway = (r() - 0.5) * (small ? 10 : 26);
          const top = h - len;
          const d = `M${x},${h} C${x},${h - len * 0.45} ${x + sway * 0.4},${h - len * 0.8} ${x + sway},${top}`;
          const at = delay + i * (small ? 22 : 14);
          // The second payment: leaves the strand about halfway up and curves away from it.
          const splitY = h - len * 0.52;
          const dir = r() > 0.5 ? 1 : -1;
          const peel = `M${x + sway * 0.12},${splitY} C${x + sway * 0.3 + dir * 4},${h - len * 0.75} ${x + sway + dir * (small ? 6 : 14)},${top + len * 0.12} ${x + sway + dir * (small ? 9 : 22)},${top + len * 0.06}`;
          return (
            <g key={s.id}>
              <path d={d} pathLength={1} className={`sf-strand sf-${s.verdict}`} style={{ '--d': `${at}ms` } as React.CSSProperties} />
              {s.verdict === 'wrong' && <path d={peel} pathLength={1} className="sf-strand sf-peel" style={{ '--d': `${at + 520}ms` } as React.CSSProperties} />}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
