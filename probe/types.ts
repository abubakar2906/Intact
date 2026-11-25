// The shapes the probe shares. Amounts are whole naira, so a mix-up between naira and kobo can't hide the real question.

export type ToolCall = { name: string; args: Record<string, unknown> };

// One thing that happened during a run, in order: the agent called a tool and got a result, or it wrote text.
export type Step =
  | { kind: 'tool'; name: string; args: Record<string, unknown>; result: unknown }
  | { kind: 'text'; text: string };

// How a run ended. "replied" and "escalated" are the two ways the agent is told to finish.
export type Ending = 'replied' | 'escalated' | 'replied in plain text' | 'ran out of steps' | 'api error';

export type Check = { ok: boolean; note: string };

export type Grade = {
  money: Check;
  // null when a scenario's trap is about money only, so there is nothing to judge in the reply.
  truth: (Check & { matched?: string }) | null;
};

export type Transcript = {
  scenario: string;
  agent: string;
  sample: number;
  // Which condition of the experiment this run was in (see PLAN.md). Runs from before conditions existed are A.
  condition?: string;
  ending: Ending;
  reply: string | null;
  steps: Step[];
  grade: Grade;
  error?: string;
  inputTokens: number;
  outputTokens: number;
};
