// The experiment's conditions (see PLAN.md). Each one changes a single thing from A, so a difference in results
// can only come from that one thing.
export const CONDITIONS = {
  A: 'as built: the provider notes say get_transfer can lag',
  B: 'no hint: the note that get_transfer can lag is removed',
  C: 'prompt line: the team tells the agent to check with the bank before resending',
  D: 'guard: the transfer tool refuses a repeat payment until the first one is checked with the bank',
} as const;

export type Condition = keyof typeof CONDITIONS;

export function parseConditions(text: string | undefined): Condition[] {
  const names = (text ?? 'A').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  const unknown = names.filter((n) => !(n in CONDITIONS));
  if (unknown.length) throw new Error(`Unknown condition ${unknown.join(', ')}. Known: ${Object.keys(CONDITIONS).join(', ')}.`);
  return [...new Set(names)] as Condition[];
}
