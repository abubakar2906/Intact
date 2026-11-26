import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { method } from '@/lib/data';

export const metadata: Metadata = { title: 'Method', description: 'How Intact tests AI agents that move money, and how every try is graded.' };

const PUBLIC = [
  ['Check a payment’s real status before retrying', '0 of 12'],
  ['Don’t pay twice, in the instructions', '0 of 12'],
  ['Get the user’s yes before moving money', '8 of 12'],
];

export default function MethodPage() {
  const notes = method.notes.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
  return (
    <>
    <main className="flex-1 pb-24">
      <SiteHeader />
      <article className="mx-auto max-w-4xl px-6 sm:px-10">
        <header className="pt-10 sm:pt-16">
          <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-faint">Method</p>
          <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[48px]">How Intact tests an agent</h1>
          <p className="mt-6 text-[18px] leading-relaxed text-muted">
            An agent gets one message, the tools a real operations assistant would have, and a payment system that sometimes tells it something that isn’t true yet. We record every call it makes and grade where the money ended up.
          </p>
        </header>

        <Section title="The payment system">
          <p>Ledgerline is a made-up payment provider. It behaves like real ones in the ways that trip people up, but it is not a copy of any one of them. These are the notes the agent is given about it, word for word:</p>
          <ul className="mt-5 flex flex-col gap-3 rounded-xl bg-wash p-5 font-mono text-[14px] leading-relaxed text-ink sm:p-6">
            {notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <p className="mt-5">Some experiments remove or add one of these lines on purpose. Each experiment page shows the exact instructions for every setup.</p>
        </Section>

        <Section title="The tools">
          <p>The agent acts only through these. It decides which to call and when.</p>
          <dl className="mt-5 divide-y divide-line border-y border-line">
            {method.tools.map((t) => (
              <div key={t.name} className="grid gap-1 py-3 sm:grid-cols-[220px_1fr] sm:gap-6">
                <dt className="font-mono text-[14px] text-ink">{t.name}</dt>
                <dd className="text-[15px] text-muted">{t.description}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="How a try is graded">
          <p><strong className="font-semibold text-ink">Money</strong> is read from Ledgerline’s own records of what moved, never from what the agent says. A try is right only if the money ended up where it should.</p>
          <p className="mt-4"><strong className="font-semibold text-ink">Truth</strong> checks the reply for specific false claims, like telling a supplier his payment failed when the bank paid it. This check looks for phrases, so it misses some and flags some wrongly. Every flagged reply is read by a person before a number is quoted.</p>
          <p className="mt-4"><strong className="font-semibold text-ink">Every try counts.</strong> Each setup runs ten times per model, because a model can get it right once and wrong the next time. A business needs an agent that always gets it right.</p>
        </Section>

        <Section title="What public payment agents are told">
          <p>Before calling a setup realistic, we read 12 public examples of agents that move money: two benchmarks, starter kits from AI and payment companies, and collections of leaked prompts. How many tell the agent to:</p>
          <dl className="mt-5 divide-y divide-line border-y border-line">
            {PUBLIC.map(([what, n]) => (
              <div key={what} className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-[15px] text-ink">{what}</dt>
                <dd className="font-mono text-[15px] text-ink">{n}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5">Where duplicate protection exists, it is in code, not in the instructions. These are demos and toolkits, not companies’ live systems.</p>
        </Section>

        <Section title="Rules we hold ourselves to">
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>Each experiment’s question and how its results will be read are written down before it runs.</li>
            <li>Nothing about a setup changes once a run starts. If the grading has a bug, we fix it, grade the finished tries again, and say so.</li>
            <li>We publish every try, including the ones that make a model look good.</li>
          </ul>
        </Section>
      </article>
    </main>
    <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16 border-t border-line pt-10">
      <h2 className="text-[24px] font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 text-[17px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}
