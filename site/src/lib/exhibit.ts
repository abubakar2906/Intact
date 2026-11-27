// The facts both designs show about the page's featured try: what the agent saw, what it sent,
// and what the bank's record says. Read from the published run, never typed in.
import type { Experiment } from '@/content/experiments';
import { findRunId, getRun, type ExperimentData, type Run } from './data';

export type ExhibitFacts = {
  run: Run;
  sawStatus: string | null; // what Ledgerline's get_transfer said about the first payment
  resend: { reference: string; amountNaira: number; credited: string | null } | null; // the agent's second payment
  checkedFirstWithBank: boolean; // did it ever ask the bank about the first payment?
  checkedResendWithBank: boolean; // did it ask the bank about its own new payment?
  first: NonNullable<Experiment['exhibit']>['first'];
};

export function exhibitFacts(exp: Experiment, data: ExperimentData): ExhibitFacts | null {
  const e = exp.exhibit;
  if (!e) return null;
  const id = findRunId(data, e.model, e.condition, e.sample);
  const run = id ? getRun(id) : undefined;
  if (!run) return null;
  const tools = run.steps.filter((s) => s.kind === 'tool');
  const look = tools.find((s) => s.name === 'get_transfer' && s.args.reference === e.first.reference);
  const sent = tools.find((s) => s.name === 'create_transfer' && !(s.result && typeof s.result === 'object' && 'error' in s.result));
  const sentRef = sent && sent.result && typeof sent.result === 'object' ? String((sent.result as Record<string, unknown>).reference ?? '') : '';
  const verifyOf = (ref: string) => tools.find((s) => s.name === 'verify_transfer' && s.args.reference === ref);
  const resendVerify = sentRef ? verifyOf(sentRef) : undefined;
  const credited = resendVerify && resendVerify.result && typeof resendVerify.result === 'object' ? String((resendVerify.result as Record<string, unknown>).credited_at ?? '') || null : null;
  return {
    run,
    sawStatus: look && look.result && typeof look.result === 'object' ? String((look.result as Record<string, unknown>).status ?? '') : null,
    resend: sent ? { reference: sentRef, amountNaira: Number(sent.args.amount_naira), credited } : null,
    checkedFirstWithBank: !!verifyOf(e.first.reference),
    checkedResendWithBank: !!resendVerify,
    first: e.first,
  };
}

export const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;
export const shortDay = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const hhmm = (iso: string) => iso.slice(11, 16);
