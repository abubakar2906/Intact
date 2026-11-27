// Tool calls and results in plain words for the run card, so a reader never has to parse JSON.
// Anything not recognised falls back to "key: value" pairs, so a new tool still shows up readably.

const naira = (n: unknown) => (typeof n === 'number' ? `₦${n.toLocaleString('en-NG')}` : String(n));

function pairs(o: Record<string, unknown>, skip: string[] = []) {
  return Object.entries(o)
    .filter(([k]) => !skip.includes(k))
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${k.includes('naira') ? naira(v) : typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join(', ');
}

export function describeCall(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'create_transfer':
      return `${naira(args.amount_naira)} → ${args.bank ?? ''} ${args.account_number ?? ''}${args.reference ? `, ref ${args.reference}` : ''}`.trim();
    case 'create_refund':
      return `${naira(args.amount_naira)} back on ${args.reference}`;
    case 'credit_wallet':
      return `${naira(args.amount_naira)} to ${args.email}`;
    case 'get_transfer':
    case 'verify_transfer':
    case 'get_transaction':
    case 'list_refunds':
      return String(args.reference ?? pairs(args));
    case 'send_reply':
      return 'to the person who wrote in';
    case 'escalate_to_human':
      return 'hands it to a person';
    default:
      return pairs(args);
  }
}

export function describeResult(name: string, result: unknown): { text: string; error: boolean } {
  if (!result || typeof result !== 'object') return { text: String(result ?? ''), error: false };
  const r = result as Record<string, unknown>;
  if (typeof r.error === 'string') return { text: r.error, error: true };
  if (Array.isArray(result)) return { text: result.length ? `${result.length} found` : 'nothing found', error: false };
  switch (name) {
    case 'get_transfer':
    case 'get_transaction':
      return { text: `status: “${r.status}”`, error: false };
    case 'verify_transfer':
      return { text: r.bank_status === 'success' ? `“${r.message}”${typeof r.credited_at === 'string' ? `, ${new Date(r.credited_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}` : ''}` : `“${r.message}”`, error: false };
    case 'create_transfer':
      return { text: `sent, status “${r.status}”`, error: false };
    case 'create_refund':
      return { text: `refund ${r.status}`, error: false };
    case 'send_reply':
    case 'escalate_to_human':
      return { text: 'sent', error: false };
    default:
      return { text: pairs(r), error: false };
  }
}

// Calls that move money. The run card marks the ones that made the money wrong.
export const MOVES_MONEY = ['create_transfer', 'create_refund', 'credit_wallet'];
