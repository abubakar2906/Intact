import type { Run } from '@/lib/data';
import { describeCall, describeResult, MOVES_MONEY } from '@/lib/describe';

// One run, step by step: what the agent called, what came back, and what it finally said.
// No hooks, so it renders the same on the server (run pages, story beats) and in the browser (the try drawer).
export function RunCard({ run, wrongLabel = 'Paid twice', compact = false }: { run: Run; wrongLabel?: string; compact?: boolean }) {
  // In a run graded wrong, the money moves that went through are the ones that did the damage.
  // True for every scenario published so far, where any extra payment is the mistake.
  const bad = (name: string, result: unknown) =>
    run.verdict === 'wrong' && MOVES_MONEY.includes(name) && !(result && typeof result === 'object' && 'error' in result);
  let n = 0;
  return (
    <div className="flex flex-col gap-8">
      <ol className="min-w-0 overflow-hidden rounded-xl border border-line">
        {run.steps.map((s, i) => {
          if (s.kind === 'message') {
            return (
              <li key={i} className="border-t border-line bg-wash px-5 py-4 first:border-t-0 sm:px-6">
                <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-faint">The supplier answers</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink">“{s.text}”</p>
              </li>
            );
          }
          if (s.kind === 'text') {
            n++;
            return (
              <li key={i} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 border-t border-line px-5 py-4 first:border-t-0 sm:grid-cols-[40px_1fr] sm:px-6">
                <span className="font-mono text-[14px] text-faint">{n}</span>
                <span className="font-mono text-[15px] text-muted">replies in plain text, without the reply tool</span>
              </li>
            );
          }
          n++;
          const out = describeResult(s.name, s.result);
          const isBad = bad(s.name, s.result);
          return (
            <li
              key={i}
              className={`grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-line px-5 py-4 first:border-t-0 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-center sm:px-6 ${isBad ? 'bg-redwash' : ''}`}
            >
              <span className={`font-mono text-[14px] ${isBad ? 'text-red' : 'text-faint'}`}>{n}</span>
              <code className={`min-w-0 break-words font-mono text-[15px] sm:text-[16px] ${isBad ? 'text-red' : 'text-ink'}`}>
                {s.name} <span className={isBad ? 'text-red/80' : 'text-muted'}>{describeCall(s.name, s.args)}</span>
              </code>
              <span className={`col-start-2 font-mono text-[14px] sm:col-start-3 break-words sm:text-right ${isBad ? 'text-red' : out.error ? 'text-muted italic' : 'text-muted'}`}>
                {out.text}
                {isBad && (
                  <span className="ml-2.5 inline-block rounded bg-red px-2 py-1 align-[1px] font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-paper">
                    {wrongLabel}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {run.reply && (
        <figure>
          <figcaption className="font-mono text-[12px] uppercase tracking-[0.08em] text-faint">
            {run.ending === 'replied in plain text' ? 'What it wrote' : 'Its reply'}
          </figcaption>
          <blockquote className={`mt-4 whitespace-pre-line break-words font-code text-ink ${compact ? 'text-[15px] leading-[1.75]' : 'text-[16px] leading-[1.8] sm:text-[18px]'}`}>
            {run.reply.replace('\n\n[after the person answered]\n\n', '\n\n· · ·\n\n')}
          </blockquote>
        </figure>
      )}
      {!run.reply && run.ending === 'escalated' && (
        <p className="font-mono text-[14px] text-muted">It handed the case to a person instead of replying.</p>
      )}
      {run.error && <p className="font-mono text-[14px] text-muted">This try never finished: {run.error}</p>}
    </div>
  );
}
