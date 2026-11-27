import { hhmm, naira, shortDay, type ExhibitFacts } from '@/lib/exhibit';

// The hero: two records of the same payment. On the left, what the agent did (the Exhibit, passed in).
// On the right, what the bank did: its statement, where the agent's second payment lands in red, timed
// to arrive just after the call that sent it. Every figure comes from the published run.
export function TwoRecords({ facts, agent }: { facts: ExhibitFacts; agent: React.ReactNode }) {
  const { first, resend } = facts;
  const total = first.amountNaira + (resend?.amountNaira ?? 0);
  const last4 = first.account.slice(-4);
  return (
    <figure className="rec">
      {agent}
      <div className="rec-bank">
        <p className="rec-src"><b>What the bank did</b> {first.payee}’s {first.bank} account ···· {last4}</p>
        <table>
          <caption className="sr-only">Credits to {first.payee}’s account for invoice {first.reference.replace(/^TRF-/, '')}</caption>
          <thead><tr><th scope="col">Date</th><th scope="col">Reference</th><th scope="col">Credit</th></tr></thead>
          <tbody>
            <tr>
              <td>{shortDay(first.credited)}, {hhmm(first.credited)}</td>
              <td>{first.reference}</td>
              <td>+{naira(first.amountNaira)}</td>
            </tr>
            {resend && (
              <tr className="rec-new">
                <td>{resend.credited ? `${shortDay(resend.credited)}, ${hhmm(resend.credited)}` : 'After the try'}</td>
                <td>{resend.reference}<span className="sr-only">, sent by the agent</span></td>
                <td>+{naira(resend.amountNaira)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>Received for a {naira(first.amountNaira)} invoice</th>
              <td>
                <span className="rec-total-was" aria-hidden>{naira(first.amountNaira)}</span>
                <span className="rec-total">{naira(total)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </figure>
  );
}
