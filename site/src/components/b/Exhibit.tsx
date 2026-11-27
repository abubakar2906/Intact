import { ModelLogo } from '@/components/ModelName';
import { MODELS } from '@/content/models';
import { describeCall, describeResult, MOVES_MONEY } from '@/lib/describe';
import { hhmm, shortDay, type ExhibitFacts } from '@/lib/exhibit';

// The agent's own tool calls are the evidence, so one try is set large, in order, with a note
// beside each step saying what the agent could not see. The left half of the hero (TwoRecords).
// The notes are worked out from the run and the scenario's bank record, never typed per try.
// `fullReply` shows the agent's whole reply, for a try where what it said is the point.
export function Exhibit({ facts, setupName, wrongLabel, fullReply = false }: { facts: ExhibitFacts; setupName: string; wrongLabel: string; fullReply?: boolean }) {
  const { run, first } = facts;
  const tools = run.steps.filter((s) => s.kind === 'tool');
  const sentAt = tools.findIndex((t) => t.name === 'create_transfer');
  const note = (name: string, args: Record<string, unknown>, i: number): string | null => {
    if (name === 'verify_transfer' && args.reference === first.reference && sentAt >= 0 && sentAt < i) return 'It checked with the bank after resending. Already credited.';
    if (name === 'get_transfer' && args.reference === first.reference) return `Out of date. The bank credited this on ${shortDay(first.credited)} at ${hhmm(first.credited)}.`;
    if (name === 'create_transfer') return `The second payment. ${first.payee} was already paid.`;
    if (name === 'verify_transfer' && args.reference !== first.reference) return facts.checkedFirstWithBank ? 'It asked the bank about the new payment.' : 'It asked the bank about the new payment. Never the first.';
    if (name === 'verify_transfer') return 'The bank’s answer: already credited.';
    if (name === 'send_reply') return `${first.payee} has now been paid twice for one invoice.`;
    return null;
  };
  // The reply, cut to its first two sentences: enough to show what the agent claimed.
  const reply = !run.reply ? null : fullReply ? run.reply : run.reply.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  // The replay: steps arrive in the order the agent made them, with shrinking gaps, so it reads as one run.
  const DELAY = [0, 220, 420, 590, 730, 850, 950];
  const d = (i: number) => `${DELAY[Math.min(i, DELAY.length - 1)] + 120 * Math.max(0, i - DELAY.length + 1)}ms`;
  let n = 0;
  return (
    <figure className="exb">
      <figcaption className="exb-who">
        <ModelLogo id={run.model} size={18} />
        <b>What the agent did</b>
        <span>{MODELS[run.model].name}, {setupName.toLowerCase()}, try {run.sample}</span>
      </figcaption>
      <div className="exb-msg" style={{ '--d': d(0) } as React.CSSProperties}>
        <p className="exb-from">{run.from.split(',')[0]} writes</p>
        <p>“{run.message}”</p>
      </div>
      <ol className="exb-steps">
        {tools.map((s, i) => {
          n++;
          const bad = run.verdict === 'wrong' && MOVES_MONEY.includes(s.name) && !(s.result && typeof s.result === 'object' && 'error' in s.result);
          const text = note(s.name, s.args, i);
          return (
            <li key={i} className={bad ? 'is-wrong' : undefined} style={{ '--d': d(n) } as React.CSSProperties}>
              <span className="exb-n">{n}</span>
              <div className="exb-call">
                <code>{s.name} <span>{s.name === 'send_reply' ? '' : describeCall(s.name, s.args)}</span></code>
                <p className={s.name === 'send_reply' && fullReply ? 'exb-full' : undefined}>{s.name === 'send_reply' && reply ? `“${reply}”` : describeResult(s.name, s.result).text}{bad && <b className="exb-tag">{wrongLabel}</b>}</p>
              </div>
              {text ? <p className="exb-note">{text}</p> : <span />}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
