'use client';

import { useEffect, useRef } from 'react';

// Grows its child from slightly smaller to full size as it rises into view, tied to the scroll position,
// the way a product shot settles into place. Transform only, one frame at a time, nothing with reduced motion.
export function ScrollScale({ from = 0.94, className = '', children }: { from?: number; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = innerHeight;
      // 0 when the top edge enters the bottom of the screen, 1 when it reaches the top fifth.
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.8)));
      const eased = 1 - Math.pow(1 - p, 3);
      el.style.transform = `scale(${from + (1 - from) * eased})`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, [from]);
  return <div ref={ref} className={className} style={{ transformOrigin: '50% 0%', willChange: 'transform' }}>{children}</div>;
}
