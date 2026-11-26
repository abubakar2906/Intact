'use client';

import { useEffect, useRef } from 'react';

// The home page sky: a faint Milky Way band in deep blue and violet, drifting very slowly, over a still star field.
// Kept cheap on purpose. The fine stars are drawn once to a canvas; everything that moves is a soft gradient moved
// with transform only, so the GPU does it and an old laptop stays cool. Reduced motion (globals.css) stops it all.

// A fixed seed, so the twinkling stars sit in the same place on the server and in the browser.
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}
const rand = seeded(26);
const TWINKLE = Array.from({ length: 42 }, () => ({
  left: rand() * 100,
  top: rand() * 100,
  size: 1 + rand() * 1.6,
  delay: rand() * 6,
  duration: 3 + rand() * 4,
}));

export function Galaxy() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = c.getBoundingClientRect();
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      const r = seeded(7);
      const count = Math.round((width * height) / 1800);
      for (let i = 0; i < count; i++) {
        const x = r() * width;
        const y = r() * height;
        // Stars crowd towards the band, which runs from lower left to upper right.
        const band = Math.abs((y - height * 0.62) + (x - width * 0.5) * 0.36) / height;
        if (r() < band * 1.4) continue;
        const a = 0.15 + r() * 0.55;
        ctx.fillStyle = r() < 0.15 ? `rgba(190,200,255,${a})` : `rgba(255,255,255,${a})`;
        ctx.fillRect(x, y, r() < 0.92 ? 1 : 1.6, r() < 0.92 ? 1 : 1.6);
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-space">
      {/* Nebulae: deep blue and violet clouds, drifting over a minute or more. */}
      <div className="absolute -left-[20%] top-[10%] h-[90%] w-[70%] animate-[drift_70s_ease-in-out_infinite_alternate] rounded-full bg-[radial-gradient(closest-side,rgba(40,52,160,0.45),transparent)]" />
      <div className="absolute right-[-15%] top-[-20%] h-[90%] w-[65%] animate-[drift_90s_ease-in-out_infinite_alternate-reverse] rounded-full bg-[radial-gradient(closest-side,rgba(88,36,150,0.42),transparent)]" />
      <div className="absolute bottom-[-30%] left-[30%] h-[80%] w-[60%] animate-[drift_80s_ease-in-out_infinite_alternate] rounded-full bg-[radial-gradient(closest-side,rgba(20,70,140,0.35),transparent)]" />
      {/* The band itself, with faint streaks through it, sliding very slowly along its length. */}
      <div className="absolute left-[-30%] top-[38%] h-[46%] w-[160%] -rotate-[20deg]">
        <div className="absolute inset-0 animate-[slide-band_120s_linear_infinite_alternate] bg-[linear-gradient(180deg,transparent,rgba(70,90,210,0.16)_30%,rgba(150,120,235,0.22)_50%,rgba(70,90,210,0.16)_70%,transparent)]" />
        <div className="absolute inset-0 animate-[slide-band_160s_linear_infinite_alternate-reverse] bg-[repeating-linear-gradient(90deg,rgba(210,215,255,0.045)_0_1px,transparent_1px_9px)] [mask-image:linear-gradient(180deg,transparent,black_35%,black_65%,transparent)]" />
        <div className="absolute inset-x-0 top-[36%] h-[28%] bg-[linear-gradient(180deg,transparent,rgba(5,6,12,0.32)_45%,rgba(5,6,12,0.32)_55%,transparent)]" />
      </div>
      <canvas ref={canvas} className="absolute inset-0 size-full" />
      {TWINKLE.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white animate-[twinkle_var(--d)_ease-in-out_infinite]"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s`, ['--d' as string]: `${s.duration}s` }}
        />
      ))}
      {/* Fade into the page below, so the sky ends softly. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(transparent,var(--color-space))]" />
    </div>
  );
}
