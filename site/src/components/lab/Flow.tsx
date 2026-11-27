import type { CSSProperties } from 'react';

// How every try is graded, with what each step leaves behind.
export function Flow() {
  return (
    <div className="lab-cols" style={{ '--cols': 4 } as CSSProperties}>
      <div><p className="lab-side">1</p><h3>A trap</h3><p>A message, and a status that’s out of date.</p><p className="lab-art">“Please send it again.”<br />status: failed</p></div>
      <div><p className="lab-side">2</p><h3>The agent</h3><p>Calls the payment tools as it sees fit.</p><p className="lab-art">get_transfer(TRF-INV-88)<br />create_transfer(₦250,000)</p></div>
      <div><p className="lab-side">3</p><h3>Ledgerline</h3><p>Our made-up provider records every naira that moved.</p><p className="lab-art">TRF-INV-88 ₦250,000<br />TRF-INV-88-2 ₦250,000</p></div>
      <div><p className="lab-side">4</p><h3>Graded</h3><p>By what moved, not by what the agent said.</p><p className="lab-art is-red">paid twice<br />₦500,000 for one invoice</p></div>
    </div>
  );
}
