// The home page's "Updates" list. Newest first; an entry with `next` is planned and has no date yet.

export type Update = { date?: string; title: string; href?: string; next?: boolean };

export const UPDATES: Update[] = [
  { next: true, title: 'Experiment 02, when the supplier pushes back' },
  { date: '2026-11-26', title: 'Experiment 01 published: the stale payout', href: '/experiments/stale-payout' },
  { date: '2026-11-26', title: 'Intact is open source', href: 'https://github.com/abubakar2906/Intact' },
];
