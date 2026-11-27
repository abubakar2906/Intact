'use client';

import { useEffect, useRef, useState } from 'react';

export type FieldSetup = { name: string; wrong: number[]; tries: number[] };
export type FieldTag = { setup: number; model?: number; text: string; tone: 'wrong' | 'plain' | 'kept'; logo?: React.ReactNode };

// Every try in an experiment drawn as a block, one plate per setup. A try that went wrong
// is raised and red. Models run along one edge of a plate and tries along the other, so each
// model's mistakes stand up as a ridge you can count. The numbers come straight from the results.
const GAP = 0.12;
const PLATE_GAP = 2.2;
const RAISED = 26;
const FLAT = 5;

// The one moment of motion, the first time the field scrolls into view. Times in ms.
// The plates settle in, then the paid-twice blocks rise, staggered by plate, then model, then try.
// Each plate's count goes up as its blocks rise. Then the tags fade in. All done in about 1.35 seconds.
const PLATE_STAGGER = 70;
const PLATE_DUR = 380;
const PLATE_DROP = 14; // in block-height units: how far above its place a plate starts
const RISE_AT = 320;
const BY_PLATE = 130;
const BY_MODEL = 40;
const BY_TRY = 12;
const RISE_DUR = 380;
const TAGS_AT = 1000;
const TAG_STAGGER = 50;
const TAG_DUR = 260; // matches the tag animation in globals.css

// A strong ease-out: quick to start, long gentle landing, no bounce.
const out = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4);

type Colours = { top: string; left: string; right: string; rim: string };
// The colours live in CSS (globals.css, --try-*) so the blocks follow light and dark like the rest.
const read = (el: Element, part: string): Colours => {
  const cs = getComputedStyle(el);
  const v = (side: string) => cs.getPropertyValue(`--try-${part}-${side}`).trim();
  return { top: v('top'), left: v('left'), right: v('right'), rim: v('rim') };
};

// still: reduced motion, so the end shows at once with nothing animated.
type Stage = 'idle' | 'run' | 'done' | 'still';

export function TryField({ setups, tags, label }: { setups: FieldSetup[]; tags: FieldTag[]; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const counts = useRef<(HTMLSpanElement | null)[]>([]);
  const legend = useRef<(HTMLSpanElement | null)[]>([]);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  // When the motion started, or Infinity once it is over (or skipped). null until the field is seen.
  const started = useRef<number | null>(null);
  const draw = useRef<(now: number) => boolean>(() => false);
  // When the last tag has finished fading in, in ms from the start.
  const lastTag = useRef(TAGS_AT + (tags.length - 1) * TAG_STAGGER + TAG_DUR);

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

    // Play once, the first time enough of the field is on screen. With reduced motion, show the end at once.
    let frame = 0;
    let timer = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        started.current = -Infinity;
        setStage('still');
        return;
      }
      started.current = performance.now();
      setStage('run');
      // The canvas finishes first. The stage stays 'run' until the last tag has faded in too.
      const tick = (now: number) => {
        if (draw.current(now)) frame = requestAnimationFrame(tick);
        else timer = window.setTimeout(() => setStage('done'), Math.max(0, (started.current ?? 0) + lastTag.current - now));
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { ro.disconnect(); mo.disconnect(); io.disconnect(); cancelAnimationFrame(frame); clearTimeout(timer); };
  }, []);

  // Size the blocks to the space we have, so the last plate is never cut off.
  const iMin = -0.35, jMin = -0.35;
  const iMax = (setups.length - 1) * plateStep + models + 0.35, jMax = rows + 0.35;
  const W = size ? Math.min(30, ((size.w - 24) / ((iMax - jMin) - (iMin - jMax))) * 2) : 0;
  const ox = size ? size.w / 2 - ((iMax - jMin) + (iMin - jMax)) * W / 4 : 0;
  const oy = size ? Math.max(56, (size.h - (iMax + jMax) * W / 4) / 2 - 10) : 0;
  const P = (i: number, j: number, z: number): [number, number] => [ox + (i - j) * W / 2, oy + (i + j) * W / 4 - z * (W / 30)];

  // Rebuilt after every render, so it always has the current size and theme. Returns true while there is more to animate.
  // Effects run in order, so this is in place before the redraw below.
  useEffect(() => {
    draw.current = (now: number) => {
      const cv = canvas.current;
      if (!cv || !size) return false;
      const dpr = window.devicePixelRatio || 1;
      if (cv.width !== size.w * dpr || cv.height !== size.h * dpr) {
        cv.width = size.w * dpr;
        cv.height = size.h * dpr;
      }
      const c = cv.getContext('2d');
      if (!c) return false;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, size.w, size.h);
      if (started.current === null) return false;
      const t = now - started.current;
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

      // How far each plate has settled (0 to 1), and how far each raised block has risen.
      const settle = setups.map((_, k) => out((t - k * PLATE_STAGGER) / PLATE_DUR));
      const cubes: { k: number; i: number; j: number; up: number }[] = [];
      const risen = setups.map(() => 0);
      let busy = settle.some((s) => s < 1);
      setups.forEach((s, k) => {
        s.tries.forEach((n, m) => {
          // Mistakes sit at the back of each column, so the raised blocks never hide the rest.
          for (let j = 0; j < n; j++) {
            let up = 0;
            if (j < s.wrong[m]) {
              const p = (t - RISE_AT - k * BY_PLATE - m * BY_MODEL - j * BY_TRY) / RISE_DUR;
              up = out(p);
              if (p < 1) busy = true;
              if (p >= 0.5) risen[k]++;
            }
            cubes.push({ k, i: k * plateStep + m, j, up });
          }
        });
      });

      // The counts under each plate follow the blocks, one at a time.
      risen.forEach((n, k) => {
        for (const el of [counts.current[k], legend.current[k]]) if (el && el.textContent !== String(n)) el.textContent = String(n);
      });

      const lift = (k: number) => (1 - settle[k]) * PLATE_DROP;
      setups.forEach((_, k) => {
        if (settle[k] <= 0) return;
        c.globalAlpha = settle[k];
        block(k * plateStep - 0.35, -0.35, k * plateStep + models + 0.35, rows + 0.35, -8 + lift(k), lift(k), colours.plate);
      });
      cubes.sort((a, b) => a.i + a.j - (b.i + b.j));
      for (const { k, i, j, up } of cubes) {
        if (settle[k] <= 0) continue;
        c.globalAlpha = settle[k];
        const top = up > 0 ? FLAT + (RAISED - FLAT) * up : FLAT;
        // A rising block turns red, and starts to glow, as soon as it leaves the plate.
        const red = up > 0.15;
        if (red) { c.save(); c.shadowColor = glow; c.shadowBlur = 14 * up; }
        block(i + GAP, j + GAP, i + 1 - GAP, j + 1 - GAP, lift(k), top + lift(k), red ? colours.wrong : colours.flat);
        if (red) c.restore();
      }
      c.globalAlpha = 1;
      return busy;
    };
  });

  // Redraw on every render (size or theme changed). While the motion runs, the loop draws instead.
  useEffect(() => {
    if (stage !== 'run') draw.current(Infinity);
  });

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const at = ([x, y]: [number, number]) => ({ left: x, top: y });

  // Keep a tag inside the box. Its width is a guess from its length, close enough to stop clipping.
  const inside = ([x, y]: [number, number], text: string, logo: boolean) => {
    const half = (text.length * 6.6 + (logo ? 48 : 40)) / 2;
    return { left: Math.min(Math.max(x, half + 4), (size?.w ?? 0) - half - 4), top: y };
  };

  return (
    <div className="try-field-wrap" data-stage={stage}>
    <div ref={box} className="try-field" role="img" aria-label={label}>
      <canvas ref={canvas} aria-hidden />
      {size && setups.map((s, k) => (
        <div key={s.name} className="try-plate" aria-hidden style={{ ...at(P(k * plateStep + models + 0.8, rows + 0.6, -14)), '--in': `${k * PLATE_STAGGER}ms` } as React.CSSProperties}>
          {s.name}<b><span ref={(el) => { counts.current[k] = el; }}>{sum(s.wrong)}</span> of {sum(s.tries)}</b>
        </div>
      ))}
      {size && tags.map((t, k) => {
        const s = setups[t.setup];
        const m = t.model ?? models - 1;
        const top = t.model !== undefined && s.wrong[m] > 0 ? RAISED : FLAT;
        const j = t.model !== undefined ? 0.5 : rows * 0.6;
        return (
          <div key={t.text} className={`try-tag try-tag-${t.tone}${k ? ' try-tag-extra' : ''}`} aria-hidden
            style={{ ...inside(P(t.setup * plateStep + m + 0.5, j, top + 44), t.text, !!t.logo), '--in': `${TAGS_AT + k * TAG_STAGGER}ms` } as React.CSSProperties}>
            {t.logo ?? <i />}{t.text}
          </div>
        );
      })}
    </div>
    {/* On a phone the plates sit too close for their labels, so they move into a list below. */}
    <ul className="try-legend" aria-hidden style={{ '--in': `${RISE_AT}ms` } as React.CSSProperties}>
      {setups.map((s, k) => <li key={s.name}>{s.name}<b><span ref={(el) => { legend.current[k] = el; }}>{sum(s.wrong)}</span> of {sum(s.tries)}</b></li>)}
    </ul>
    </div>
  );
}

