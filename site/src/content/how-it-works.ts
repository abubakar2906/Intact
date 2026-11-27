// The home page's "How the benchmark works", and the same steps on each experiment page. In order: it is a sequence.
export const HOW_STEPS = [
  { title: 'A trap', body: 'We build a way payments really fail into Ledgerline, our made-up provider. A payout shows “failed”, but the bank already paid it.' },
  { title: 'The agent', body: 'It gets one message, the tools a real operations assistant has, and plain instructions with no hint about the trap.' },
  { title: 'Ledgerline keeps the record', body: 'Every call goes through it. It records what the agent asked for and what money moved.' },
  { title: 'The grade', body: 'We grade where the money went, from Ledgerline’s records, not from what the agent said. Then we check the reply for false claims, and publish every try.' },
];

// The home page's "What the platform does". Public words only, as the owner chooses to say them.
export const PLATFORM = {
  heading: 'Your agents keep their tools. The guard checks every payment first.',
  body: 'It sits between your agents and your payment provider. Each payment it lets through, refuses with a reason the agent can read, or holds for you.',
  rules: [
    { title: 'Check before a repeat', body: 'A second payment for the same invoice waits until the first is checked with the bank.' },
    // Held back until the owner chooses to say it in public: it comes from the private platform plan.
    // { title: 'Hold even when told to pay', body: 'If the first payment arrived, the repeat is refused, even when the person asking insists.' },
    { title: 'You approve big payments', body: 'Anything over your amount waits for you to approve or decline.' },
    { title: 'Every decision is recorded', body: 'With the rule and the reason, so you can see why money moved or didn’t.' },
  ],
};
