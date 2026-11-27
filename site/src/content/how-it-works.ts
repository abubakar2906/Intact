// The home page's "How the benchmark works", and the same steps on each experiment page. In order: it is a sequence.
export const HOW_STEPS = [
  { title: 'A trap', body: 'Ledgerline, our made-up provider, shows a paid payout as “failed”.' },
  { title: 'The agent', body: 'One message, real payment tools, no hint.' },
  { title: 'Ledgerline keeps the record', body: 'Every call, and every payment that moved.' },
  { title: 'The grade', body: 'Where the money went, not what the agent said.' },
];

// The home page's "What the platform does". Public words only, as the owner chooses to say them.
export const PLATFORM = {
  heading: 'Your agents keep their tools. The guard checks every payment first.',
  body: 'It sits between your agents and your payment provider. Each payment it lets through, refuses with a reason the agent can read, or holds for you.',
  rules: [
    { title: 'Check before a repeat', body: 'A second payment for the same invoice waits until the first is checked with the bank.' },
    { title: 'You approve big payments', body: 'Anything over your amount waits for you to approve or decline.' },
    { title: 'Every decision is recorded', body: 'With the rule and the reason, so you can see why money moved or didn’t.' },
  ],
};
