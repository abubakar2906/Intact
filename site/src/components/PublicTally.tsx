import { PUBLIC_PROMPTS } from '@/content/public-prompts';
import { Reveal } from './Reveal';

// One row per rule: a square per public example, filled where that example gives the rule.
// The filled squares fill in one by one as the tally scrolls into view.
export function PublicTally() {
  const { sources, rows } = PUBLIC_PROMPTS;
  return (
    <Reveal>
    <dl className="divide-y divide-line border-y border-line">
      {rows.map((r) => (
        <div key={r.what} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
          <dt className="text-[15px] text-ink">{r.what}</dt>
          <dd className="flex items-center gap-3">
            <span className="flex gap-[3px]" aria-hidden>
              {Array.from({ length: sources }, (_, i) => (
                <span key={i} className={`size-2.5 rounded-[2px] sm:size-3 ${i < r.count ? 'bg-ink reveal-fill' : 'bg-track'}`} style={i < r.count ? ({ '--delay': `${i * 70}ms` } as React.CSSProperties) : undefined} />
              ))}
            </span>
            <span className="w-16 text-right font-mono text-[14px] text-ink">{r.count} of {sources}</span>
          </dd>
        </div>
      ))}
    </dl>
    </Reveal>
  );
}
