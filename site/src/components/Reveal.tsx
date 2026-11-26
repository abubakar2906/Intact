'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

// Starts a chart's motion the first time it scrolls into view. Bars animate in CSS (.reveal-h, .reveal-w,
// .reveal-fill in globals.css); numbers count with <CountUp>. Without JavaScript everything shows its final value.
const RevealContext = createContext({ shown: true, stage: 0 });

export function Reveal({ stage = 0, className = '', children }: { stage?: number; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ shown: false, stage: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        // A stage only waits where the charts sit side by side. Stacked on a phone, each one starts as it arrives.
        setState({ shown: true, stage: window.matchMedia('(min-width: 768px)').matches ? stage : 0 });
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [stage]);
  return (
    <RevealContext.Provider value={state}>
      <div ref={ref} data-reveal="" data-shown={state.shown ? '' : undefined} className={className} style={{ '--stage': `${state.stage}ms` } as React.CSSProperties}>
        {children}
      </div>
    </RevealContext.Provider>
  );
}

const DURATION = 900;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

// A number that runs from `from` to `to` once its <Reveal> is shown. `hot` is the class while the number is above zero.
export function CountUp({ from = 0, to, delay = 0, hot = '', cold = '', className = '' }: { from?: number; to: number; delay?: number; hot?: string; cold?: string; className?: string }) {
  const { shown, stage } = useContext(RevealContext);
  const [value, setValue] = useState(to);
  // Until the first frame runs, the number stays hidden, so the final value never flashes before the count.
  const [ticked, setTicked] = useState(false);
  useEffect(() => {
    if (!shown) return;
    const still = from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const start = performance.now() + stage + delay;
    const tick = (now: number) => {
      const t = still ? 1 : Math.min(1, Math.max(0, (now - start) / DURATION));
      setValue(Math.round(from + (to - from) * ease(t)));
      setTicked(true);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown, stage, delay, from, to]);
  return (
    <span data-count="" data-waiting={shown && !ticked ? '' : undefined} className={`${className} ${value > 0 ? hot : cold}`}>
      {value}
    </span>
  );
}
