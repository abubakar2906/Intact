'use client';

import { useEffect, useRef, useState } from 'react';

// Holds the CSS animations inside it paused until it scrolls into view, then lets them play once.
// For moments below the fold that would otherwise finish before anyone sees them. Without JavaScript
// nothing is paused (the rule in globals.css needs data-js), so everything simply shows.
export function Play({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setOn(true); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className} data-play={on ? 'on' : 'wait'}>{children}</div>;
}
