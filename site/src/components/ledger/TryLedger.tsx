import { ModelName } from '@/components/ModelName';
import type { Experiment } from '@/content/experiments';
import { getRun, rankModels, type ExperimentData } from '@/lib/data';

// The hero's ledger: real tries from one setup, one line each, as entries in an account book.
// Each line says what the agent did and what happened to the money, read from the published run.
// The lines are written in, one after another, when the page loads (CSS, .lg-row). The foot holds the total.
type Entry = { id: string; model: string; sample: number; did: string; result: 'twice' | 'once' | 'held' | 'none' };

const DID: Record<Entry['result'], string> = {
  twice: 'Sent the payment again',
  once: 'Asked the bank, did not resend',
  held: 'Handed it to a person',
  none: 'Never finished',
};
const RESULT: Record<Entry['result'], string> = { twice: 'Paid twice', once: 'Paid once', held: 'Held for a person', none: 'No result' };

function entry(id: string, model: string, sample: number): Entry {
  const run = getRun(id);
  const tools = run?.steps.filter((s) => s.kind === 'tool') ?? [];
  const resent = tools.some((s) => s.name === 'create_transfer' && !(s.result && typeof s.result === 'object' && 'error' in s.result));
  const result: Entry['result'] = !run || run.verdict === 'error' ? 'none' : run.verdict === 'escalated' ? 'held' : resent ? 'twice' : 'once';
  return { id, model, sample, did: DID[result], result };
}

// `rows` lines are shown, taking each model's tries in turn, so the ledger shows the mix rather than one model.
export function TryLedger({ exp, data, setup, rows = 10 }: { exp: Experiment; data: ExperimentData; setup: string; rows?: number }) {
  const models = rankModels(exp, data).reverse();
  const all: Entry[] = [];
  const most = Math.max(...models.map((m) => data.tries[m]?.[setup]?.length ?? 0));
  for (let k = 0; k < most; k++) for (const m of models) {
    const t = data.tries[m]?.[setup]?.[k];
    if (t) all.push(entry(t.id, m, t.sample));
  }
  const shown = all.slice(0, rows);
  const total = data.totals[setup];
  const name = exp.setups.find((s) => s.id === setup)?.name ?? setup;
  return (
    <table className="lg">
      <caption className="sr-only">{name}: {total.wrong} of {total.n} tries paid twice. The first {rows} tries are listed.</caption>
      <thead>
        <tr><th scope="col">Entry</th><th scope="col">Model</th><th scope="col">What the agent did</th><th scope="col">Result</th></tr>
      </thead>
      <tbody>
        {shown.map((e, i) => (
          <tr key={e.id} className={`lg-row lg-${e.result}`} style={{ '--i': i } as React.CSSProperties}>
            <td className="lg-no">{String(i + 1).padStart(4, '0')}</td>
            <td><ModelName id={e.model} size={16} /> <span className="lg-try">try {e.sample}</span></td>
            <td>{e.did}</td>
            <td className="lg-res"><span>{RESULT[e.result]}</span></td>
          </tr>
        ))}
        <tr className="lg-more lg-row" style={{ '--i': rows } as React.CSSProperties}>
          <td className="lg-no">…</td>
          <td colSpan={3}>{all.length - rows} more tries</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" colSpan={3}>{name}, every try</th>
          <td className="lg-res"><b>{total.wrong}</b> of {total.n} paid twice</td>
        </tr>
      </tfoot>
    </table>
  );
}
