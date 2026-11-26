import Link from 'next/link';
import { UPDATES } from '@/content/updates';

const day = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function Updates() {
  return (
    <ol className="border-t border-line">
      {UPDATES.map((u) => {
        const inner = (
          <>
            <span className={`w-28 shrink-0 font-mono text-[13px] ${u.next ? 'text-ink' : 'text-faint'}`}>
              {u.next ? <span className="rounded-full border border-line px-2 py-0.5">Next</span> : <time dateTime={u.date}>{day(u.date!)}</time>}
            </span>
            <span className={`min-w-0 flex-1 text-[16px] ${u.next ? 'text-muted' : 'text-ink'}`}>{u.title}</span>
            {u.href && <span aria-hidden className="text-faint transition-transform group-hover:translate-x-0.5">{u.href.startsWith('http') ? '↗' : '→'}</span>}
          </>
        );
        const row = 'group flex items-baseline gap-4 py-4';
        return (
          <li key={u.title} className="border-b border-line">
            {u.href?.startsWith('http') ? (
              <a href={u.href} className={`${row} hover:bg-wash/60`}>{inner}</a>
            ) : u.href ? (
              <Link href={u.href} className={`${row} hover:bg-wash/60`}>{inner}</Link>
            ) : (
              <div className={row}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
