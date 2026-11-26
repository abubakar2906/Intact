'use client';

import { useId, useRef, useState } from 'react';
import type { RoadmapStage } from '@/content/roadmap';
import { Flow } from './Flow';

// Three tabs, one panel each. Arrow keys move between tabs and open them; Home and End jump to the ends.
export function Roadmap({ stages }: { stages: RoadmapStage[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const base = useId();

  const go = (i: number) => {
    const next = (i + stages.length) % stages.length;
    setActive(next);
    tabs.current[next]?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    const moves: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: stages.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      go(moves[e.key]);
    }
  };

  return (
    <div>
      <div role="tablist" aria-label="Roadmap" className="grid grid-cols-3 gap-2" onKeyDown={onKey}>
        {stages.map((s, i) => {
          const on = i === active;
          return (
            <button
              key={s.id}
              ref={(el) => { tabs.current[i] = el; }}
              role="tab"
              type="button"
              id={`${base}-tab-${s.id}`}
              aria-selected={on}
              aria-controls={`${base}-panel-${s.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              className={`rounded-xl border px-3 py-3 text-left transition-colors sm:px-5 sm:py-4 ${on ? 'border-ink bg-ink text-paper' : 'border-line text-ink hover:bg-wash'}`}
            >
              <span className={`block font-mono text-[11px] uppercase tracking-[0.08em] sm:text-[12px] ${on ? 'text-paper/65' : 'text-faint'}`}>
                {s.stage} · {s.when}
              </span>
              <span className="mt-1 block font-display text-[19px] tracking-[-0.02em] sm:text-[24px]">{s.name}</span>
            </button>
          );
        })}
      </div>
      {stages.map((s, i) => (
        <div
          key={s.id}
          role="tabpanel"
          id={`${base}-panel-${s.id}`}
          aria-labelledby={`${base}-tab-${s.id}`}
          hidden={i !== active}
          tabIndex={0}
          className="mt-3 grid gap-10 rounded-2xl border border-line p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14"
        >
          <div>
            <p className="max-w-xl text-[18px] leading-relaxed text-ink sm:text-[19px]">{s.what}</p>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <List title="What exists today" items={s.today} />
              <List title="What comes next" items={s.next} />
            </div>
          </div>
          <div className="rounded-xl bg-wash p-5 sm:p-6">
            <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.08em] text-faint">How it fits together</p>
            <Flow {...s.diagram} vertical />
          </div>
        </div>
      ))}
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-[15px] font-medium tracking-normal text-ink [font-family:var(--font-sans)]">{title}</h3>
      <ul className="mt-3 flex flex-col gap-2.5 border-t border-line pt-3">
        {items.map((t) => (
          <li key={t} className="flex gap-2.5 text-[15px] leading-relaxed text-muted">
            <span aria-hidden className="mt-[0.7em] size-1 shrink-0 rounded-full bg-faint" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
