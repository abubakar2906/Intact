import { MODELS } from '@/content/models';
import { hhmm, naira, shortDay, type ExhibitFacts } from '@/lib/exhibit';

// Direction A, "Two records". The trap is a disagreement between two records: what Ledgerline told
// the agent, and what the bank actually did. Shown side by side, with the agent's second payment
// landing on the bank statement in red. Every figure comes from the published run.
export function TwoRecords({ facts, setupName, payer }: { facts: ExhibitFacts; setupName: string; payer: string }) {
  const { run, first, resend } = facts;
  const model = MODELS[run.model].name;
  const total = first.amountNaira + (resend?.amountNaira ?? 0);
  const last4 = first.account.slice(-4);
  const told = facts.sawStatus ? `Ledgerline told it the first payment “${facts.sawStatus}”.` : '';
  const checked = facts.checkedResendWithBank && !facts.checkedFirstWithBank
    ? 'Then it asked the bank about the new payment, never the first.'
    : facts.checkedFirstWithBank ? 'It asked the bank about the first payment too.' : 'It never asked the bank.';
  return (
    <figure className="rec">
      <div className="rec-said">
        <p className="rec-src">What Ledgerline told the agent</p>
        <p className="rec-ref">{first.reference}</p>
        <p className="rec-amt">{naira(first.amountNaira)}</p>
        <p className="rec-status"><span>{facts.sawStatus ?? 'unknown'}</span></p>
        <p className="rec-foot">The status was out of date.</p>
      </div>
      <div className="rec-bank">
        <p className="rec-src">What the bank did: {first.payee}’s {first.bank} account ···· {last4}</p>
        <table>
          <caption className="sr-only">Credits to {first.payee}’s account for invoice {first.reference.replace(/^TRF-/, '')}</caption>
          <thead><tr><th scope="col">Date</th><th scope="col">Reference</th><th scope="col">From</th><th scope="col">Credit</th></tr></thead>
          <tbody>
            <tr>
              <td>{shortDay(first.credited)}, {hhmm(first.credited)}</td>
              <td>{first.reference}</td>
              <td>{payer}</td>
              <td>+{naira(first.amountNaira)}</td>
            </tr>
            {resend && (
              <tr className="rec-new">
                <td>{resend.credited ? `${shortDay(resend.credited)}, ${hhmm(resend.credited)}` : 'After the try'}</td>
                <td>{resend.reference}</td>
                <td>{payer}, sent by the agent</td>
                <td>+{naira(resend.amountNaira)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={3}>Received for a {naira(first.amountNaira)} invoice</th>
              <td>
                <span className="rec-total-was" aria-hidden>{naira(first.amountNaira)}</span>
                <span className="rec-total">{naira(total)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <figcaption>
        {model}, {setupName.toLowerCase()}, try {run.sample}. {told} It sent {naira(resend?.amountNaira ?? 0)} again. {checked}
      </figcaption>
    </figure>
  );
}
