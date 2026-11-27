import { HOW_STEPS } from '@/content/how-it-works';
import { describeCall } from '@/lib/describe';
import type { ExhibitFacts } from '@/lib/exhibit';

// Direction B: the anatomy of one real try. Each step beside the record it leaves, in the shapes
// the benchmark actually uses: the two records, the message and tools, the calls, the grade.
export function HowItWorks({ facts, tools }: { facts?: ExhibitFacts | null; tools?: string[] }) {
  if (!facts) return null;
  const { run, first } = facts;
  const calls = run.steps.filter((s) => s.kind === 'tool');
  const art = [
    <pre key="trap" className="code">{`Ledgerline  get_transfer("${first.reference}")
  status: "failed"

The bank    verify_transfer("${first.reference}")
  bank_status: "success"
  credited_at: ${first.credited.slice(0, 16).replace('T', ' ')}`}</pre>,
    <div key="agent" className="code">
      <p className="code-msg">“{run.message}”</p>
      <p className="code-dim">tools: {(tools ?? []).join(', ')}</p>
    </div>,
    <pre key="record" className="code">{calls.map((s, i) => `${i + 1}  ${s.name}  ${s.name === 'send_reply' ? '' : describeCall(s.name, s.args)}`).join('\n')}</pre>,
    <div key="grade" className="code">
      <p className={run.money.ok ? '' : 'is-wrong'}>money: {run.money.note}</p>
      {run.truth && <p className={run.truth.ok ? 'code-dim' : 'is-wrong'}>truth: {run.truth.note}</p>}
    </div>,
  ];
  return (
    <ol className="how-b">
      {HOW_STEPS.map((s, i) => (
        <li key={s.title}>
          <div className="how-b-text">
            <span className="how-n">{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
          {art[i]}
        </li>
      ))}
    </ol>
  );
}
