// The home page roadmap. Plans, not claims: what exists is said plainly, what comes next is said as a plan.
// Figures are passed in from the generated data, never written here.

import type { FlowNode } from '@/components/Flow';

export type RoadmapStage = {
  id: string;
  name: string;
  when: string;
  stage: string;
  what: string;
  today: string[];
  next: string[];
  diagram: { nodes: FlowNode[]; links?: ('to' | 'both')[]; loop?: string; result?: FlowNode };
};

export type RoadmapFigures = {
  scenarios: number; // traps with one message each
  runs: number; // published tries
  firstExperiment: { number: number; slug: string; name: string };
  lock: { wrong: number; n: number }; // the lock in the tool, in the first experiment
};

const two = (n: number) => String(n).padStart(2, '0');

export function roadmap(f: RoadmapFigures): RoadmapStage[] {
  return [
    {
      id: 'measure',
      name: 'Measure',
      when: 'Now',
      stage: 'v0',
      what: 'Put agents in front of the ways payments really fail, and grade where the money went. Not what the agent said it did: what actually moved. Every try is published, good or bad.',
      today: [
        'Ledgerline, a made-up payment provider that gets things wrong the way real ones do',
        `${f.scenarios} scenarios, each one a way payments really fail`,
        `Experiment ${two(f.firstExperiment.number)}, the ${f.firstExperiment.name.toLowerCase()}, with every try public`,
        `${f.runs} public transcripts`,
      ],
      next: [
        'Frontier models, on the same traps',
        'The run where the supplier pushes back',
        'More traps: reversals, partial refunds, retries, chargebacks',
        'Plug in your own agent and get a report',
      ],
      diagram: {
        nodes: [
          { label: 'A trap', note: 'a message, and a status that is out of date' },
          { label: 'The agent', note: 'calls the payment tools as it sees fit' },
          { label: 'Ledgerline', note: 'records every payment that moved' },
        ],
        result: { label: 'Graded', note: 'where the money went, not what the agent said', strong: true },
      },
    },
    {
      id: 'protect',
      name: 'Protect',
      when: 'Next',
      stage: 'v1',
      what: 'A guard that sits between any agent and the money, so the agent can be wrong and the money still stays right. The checks live in code, not in the prompt, so no wording can talk its way past them.',
      today: [
        `In experiment ${two(f.firstExperiment.number)}, a simple lock in the payment tool stopped every double payment: ${f.lock.wrong} of ${f.lock.n} tries`,
        'The lock refuses a repeat payment until the first one has been checked',
      ],
      next: [
        'A stronger guard that also refuses when the bank says the first payment arrived',
        'Published as open source, for any agent framework',
        'Tested on the same traps it guards against',
      ],
      diagram: {
        nodes: [
          { label: 'The agent', note: 'asks to pay' },
          { label: 'The guard', note: 'checks the first payment with the bank, in code', strong: true },
          { label: 'The bank', note: 'pays only if nothing was paid already' },
        ],
      },
    },
    {
      id: 'improve',
      name: 'Improve',
      when: 'Later',
      stage: 'v2',
      what: 'Every graded try is a training example: a situation, what the agent did, and whether the money ended up right. Used well, they can teach a model to check before it pays.',
      today: [
        `${f.runs} graded tries, each with its full transcript`,
        'A grade for each one, read from where the money went',
      ],
      next: [
        'Train an open model to check before paying',
        'Measure it on the same benchmark, against the models it learned from',
        'Publish the model, the data and the results',
      ],
      diagram: {
        nodes: [
          { label: 'Graded runs', note: 'from Intact' },
          { label: 'Training', note: 'an open model learns to check first' },
          { label: 'Re-test on Intact', note: 'the same traps, the same grading', strong: true },
        ],
        loop: 'new graded runs feed the next round',
      },
    },
  ];
}
