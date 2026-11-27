import type { Metadata } from 'next';
import Link from 'next/link';
import { LabFooter, LabHeader } from '@/components/lab/LabHeader';
import { experiments, formatDate, getExperimentData } from '@/lib/data';
import { pad } from '@/lib/lab';

export const metadata: Metadata = { title: 'Research', description: 'Every Intact experiment, newest first, with every try public.' };

export default function ExperimentsPage() {
  return (
    <div className="lab">
      <div className="lab-wrap">
        <LabHeader />
        <main>
          <section className="lab-hero">
            <div className="lab-row"><p className="lab-side">Research</p><div><h1>Every experiment.</h1><p className="lab-lede">Newest first. Each one asks a single question, written down before it runs, and publishes every try.</p></div></div>
            <div className="lab-list" style={{ marginTop: 48 }}>
              <div className="lab-item"><span className="lab-side">In progress</span><h3>Experiment 03, idempotency keys</h3><a className="lab-go" href="https://github.com/abubakar2906/Intact/blob/main/PLAN.md">The plan</a></div>
              {experiments.map((e) => {
                const d = getExperimentData(e.slug);
                return (
                  <div className="lab-item" key={e.slug}>
                    <span className="lab-side">Experiment {pad(e.number)}<br />{formatDate(e.date)}<br />{d.runCount} tries</span>
                    <div><h3>{e.short}</h3><p style={{ color: 'var(--l-ink-2)', marginTop: 6, maxWidth: 700 }}>{e.claim}</p></div>
                    <Link className="lab-go" href={`/experiments/${e.slug}`}>Read it</Link>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
        <LabFooter />
      </div>
    </div>
  );
}
