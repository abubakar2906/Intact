'use client';

import { useEffect, useRef, useState } from 'react';

export type FieldSetup = { name: string; wrong: number[]; tries: number[] };
export type FieldTag = { setup: number; model?: number; text: string; tone: 'wrong' | 'plain' | 'kept' };

// Every try in an experiment drawn as a block, one plate per setup. A try that went wrong
// is raised and red. Models run along one edge of a plate and tries along the other, so each
// model's mistakes stand up as a ridge you can count. The numbers come straight from the results.
const GAP = 0.12;
const PLATE_GAP = 2.2;
const RAISED = 26;
const FLAT = 5;

type Colours = { top: string; left: string; right: string; rim: string };
// The colours live in CSS (globals.css, --try-*) so the blocks follow light and dark like the rest.
const read = (el: Element, part: string): Colours => {
  const cs = getComputedStyle(el);
  const v = (side: string) => cs.getPropertyValue(`--try-${part}-${side}`).trim();
  return { top: v('top'), left: v('left'), right: v('right'), rim: v('rim') };
};

export function TryField({ setups, tags, label }: { setups: FieldSetup[]; tags: FieldTag[]; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const models = setups[0].tries.length;
  const rows = Math.max(...setups.flatMap((s) => s.tries));
  const plateStep = models + PLATE_GAP;

  // Only its change matters: setting it re-renders, and the draw below runs again.
  const [, setTheme] = useState('');

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Redraw when the theme changes, since a canvas does not follow CSS on its own.
    const html = document.documentElement;
    const watch = () => setTheme(html.dataset.theme ?? '');
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, []);

  // Size the blocks to the space we have, so the last plate is never cut off.
  const iMin = -0.35, jMin = -0.35;
  const iMax = (setups.length - 1) * plateStep + models + 0.35, jMax = rows + 0.35;
  const W = size ? Math.min(30, ((size.w - 24) / ((iMax - jMin) - (iMin - jMax))) * 2) : 0;
  const ox = size ? size.w / 2 - ((iMax - jMin) + (iMin - jMax)) * W / 4 : 0;
  const oy = size ? Math.max(56, (size.h - (iMax + jMax) * W / 4) / 2 - 10) : 0;
  const P = (i: number, j: number, z: number): [number, number] => [ox + (i - j) * W / 2, oy + (i + j) * W / 4 - z * (W / 30)];

  useEffect(() => {
    const cv = canvas.current;
    if (!cv || !size) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = size.w * dpr;
    cv.height = size.h * dpr;
    const c = cv.getContext('2d');
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, size.w, size.h);
    const colours = { flat: read(cv, 'flat'), wrong: read(cv, 'wrong'), plate: read(cv, 'plate') };
    const glow = getComputedStyle(cv).getPropertyValue('--try-glow').trim();

    const poly = (pts: [number, number][], fill: string) => {
      c.beginPath();
      pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.fillStyle = fill;
      c.fill();
    };
    const block = (i0: number, j0: number, i1: number, j1: number, z0: number, z1: number, col: Colours) => {
      const a = P(i0, j0, z1), b = P(i1, j0, z1), d = P(i1, j1, z1), e = P(i0, j1, z1);
      poly([e, d, P(i1, j1, z0), P(i0, j1, z0)], col.left);
      poly([b, d, P(i1, j1, z0), P(i1, j0, z0)], col.right);
      poly([a, b, d, e], col.top);
      // A hairline on the two back edges of the top face, where the light catches it.
      c.beginPath();
      c.moveTo(...e); c.lineTo(...a); c.lineTo(...b);
      c.strokeStyle = col.rim;
      c.lineWidth = 1;
      c.stroke();
    };

    const cubes: { i: number; j: number; up: boolean }[] = [];
    setups.forEach((s, k) => {
      s.tries.forEach((n, m) => {
        // Mistakes sit at the back of each column, so the raised blocks never hide the rest.
        for (let t = 0; t < n; t++) cubes.push({ i: k * plateStep + m, j: t, up: t < s.wrong[m] });
      });
    });
    setups.forEach((_, k) => block(k * plateStep - 0.35, -0.35, k * plateStep + models + 0.35, rows + 0.35, -8, 0, colours.plate));
    cubes.sort((a, b) => a.i + a.j - (b.i + b.j));
    for (const { i, j, up } of cubes) {
      if (up) { c.save(); c.shadowColor = glow; c.shadowBlur = 14; }
      block(i + GAP, j + GAP, i + 1 - GAP, j + 1 - GAP, 0, up ? RAISED : FLAT, up ? colours.wrong : colours.flat);
      if (up) c.restore();
    }
  });

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const at = ([x, y]: [number, number]) => ({ left: x, top: y });


  // Keep a tag inside the box. Its width is a guess from its length, close enough to stop clipping.
  const inside = ([x, y]: [number, number], text: string) => {
    const half = (text.length * 6.6 + 40) / 2;
    return { left: Math.min(Math.max(x, half + 4), (size?.w ?? 0) - half - 4), top: y };
  };

  return (
    <div className="try-field-wrap">
    <div ref={box} className="try-field" role="img" aria-label={label}>
      <canvas ref={canvas} aria-hidden />
      {size && setups.map((s, k) => (
        <div key={s.name} className="try-plate" aria-hidden style={at(P(k * plateStep + models + 0.8, rows + 0.6, -14))}>
          {s.name}<b>{sum(s.wrong)} of {sum(s.tries)}</b>
        </div>
      ))}
      {size && tags.map((t, k) => {
        const s = setups[t.setup];
        const m = t.model ?? models - 1;
        const top = t.model !== undefined && s.wrong[m] > 0 ? RAISED : FLAT;
        const j = t.model !== undefined ? 0.5 : rows * 0.6;
        return (
          <div key={t.text} className={`try-tag try-tag-${t.tone}${k ? ' try-tag-extra' : ''}`} aria-hidden style={inside(P(t.setup * plateStep + m + 0.5, j, top + 44), t.text)}>
            <i />{t.text}
          </div>
        );
      })}
    </div>
    {/* On a phone the plates sit too close for their labels, so they move into a list below. */}
    <ul className="try-legend" aria-hidden>
      {setups.map((s) => <li key={s.name}>{s.name}<b>{sum(s.wrong)} of {sum(s.tries)}</b></li>)}
    </ul>
    </div>
  );
}
