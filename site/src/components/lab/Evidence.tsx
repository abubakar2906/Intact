// The evidence figures, read from the published runs: three records for one try, and the moment an agent gave in.
import type { ExhibitFacts } from '@/lib/exhibit';
import { naira, shortDay, hhmm } from '@/lib/exhibit';
import type { Run } from '@/lib/data';

export function Records({ facts, modelName, setupName }: { facts: ExhibitFacts; modelName: string; setupName: string }) {
  const f = facts.first;
  return (
    <div className="lab-records">
      <div className="lab-rec"><p className="lab-k">What the agent saw</p><p className="lab-big">{facts.sawStatus ? facts.sawStatus[0].toUpperCase() + facts.sawStatus.slice(1) : 'Failed'}</p>
        <dl><dt>Tool</dt><dd>get_transfer</dd><dt>Ref</dt><dd>{f.reference}</dd><dt>Amount</dt><dd>{naira(f.amountNaira)}</dd></dl><span className="lab-stamp">status: {facts.sawStatus ?? 'failed'}</span></div>
      <div className="lab-rec"><p className="lab-k">What the bank said</p><p className="lab-big">Credited</p>
        <dl><dt>Bank</dt><dd>{f.bank} ·· {f.account.slice(-4)}</dd><dt>When</dt><dd>{shortDay(f.credited)}, {hhmm(f.credited)}</dd><dt>To</dt><dd>{f.payee}</dd></dl><span className="lab-stamp">{facts.checkedFirstWithBank ? 'checked' : 'never asked'}</span></div>
      <div className="lab-rec"><p className="lab-k">What the agent did</p><p className="lab-big is-red">{facts.resend ? `Paid ${naira(facts.resend.amountNaira)} again` : 'Held off'}</p>
        <dl><dt>Tool</dt><dd>{facts.resend ? 'create_transfer' : '—'}</dd><dt>Model</dt><dd>{modelName}, {setupName.toLowerCase()}</dd><dt>Result</dt><dd>{facts.resend ? `${naira(f.amountNaira + facts.resend.amountNaira)} for one invoice` : 'paid once'}</dd></dl>
        {facts.resend && <span className="lab-stamp is-red">paid twice</span>}</div>
    </div>
  );
}

// The sentence where the agent tells the supplier the money arrived, or else its first sentence.
const firstSentence = (t: string) => {
  const sentences = t.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+/g) ?? [t];
  const pick = sentences.find((x) => /credited|arrived|received|successful/i.test(x)) ?? sentences[0];
  return pick.trim().slice(0, 240);
};
const money = (v: unknown) => naira(Number(v));

// The pushback, as it happened: the check the agent made, what it told the supplier, his reply, and what it did next.
export function CaveChat({ run, modelName, setupName }: { run: Run; modelName: string; setupName: string }) {
  const push = run.steps.findIndex((s) => s.kind === 'message');
  if (push < 0) return null;
  const before = run.steps.slice(0, push);
  const after = run.steps.slice(push + 1);
  const check = [...before].reverse().find((s) => s.kind === 'tool' && s.name === 'verify_transfer');
  const told = [...before].reverse().find((s) => s.kind === 'text' || (s.kind === 'tool' && s.name === 'send_reply'));
  const toldText = !told ? '' : told.kind === 'text' ? told.text : told.kind === 'tool' ? String(told.args.message ?? '') : '';
  const msg = run.steps[push];
  const paid = after.find((s) => s.kind === 'tool' && s.name === 'create_transfer');
  const res = paid && paid.kind === 'tool' && paid.result && typeof paid.result === 'object' ? (paid.result as Record<string, unknown>) : null;
  const checkRes = check && check.kind === 'tool' && check.result && typeof check.result === 'object' ? (check.result as Record<string, unknown>) : null;
  return (
    <div className="lab-lines">
      {check && check.kind === 'tool' && <div className="lab-ln"><span className="lab-k">{modelName}, {setupName.toLowerCase()}</span><p className="lab-call ok">verify_transfer({String(check.args.reference)}) → {checkRes?.bank_status === 'success' ? 'credited' : String(checkRes?.bank_status ?? '')}{checkRes?.credited_at ? `, ${shortDay(String(checkRes.credited_at))}` : ''}</p></div>}
      {toldText && <div className="lab-ln"><span className="lab-k">Agent to supplier</span><p>“{firstSentence(toldText)}”</p></div>}
      {msg.kind === 'message' && <div className="lab-ln is-sup"><span className="lab-k">Supplier</span><p>“{msg.text}”</p></div>}
      {paid && paid.kind === 'tool' && <div className="lab-ln"><span className="lab-k">Agent</span><p className="lab-call">create_transfer({money(paid.args.amount_naira)}, ref {String(paid.args.reference ?? '')}) → {String(res?.status ?? '')}</p></div>}
    </div>
  );
}
