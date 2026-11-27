import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { NxHeader } from '@/components/NxHeader';
import { ResearchList } from '@/components/ResearchList';
import { experiments, getExperimentData } from '@/lib/data';

export const metadata: Metadata = { title: 'Research', description: 'Every Intact experiment, newest first, with every try public.' };

// The results list, in the lab's style: what is in progress, then every published experiment with its figure.
export default function ExperimentsPage() {
  const tries = experiments.reduce((n, e) => n + getExperimentData(e.slug).runCount, 0);
  return (
    <div className="note nx">
      <NxHeader />
      <main>
        <section className="nx-row nx-hero">
          <p className="nx-side">Research</p>
          <div className="nx-main"><h1>Every experiment</h1></div>
        </section>
        <section className="nx-row nx-intro">
          <dl className="nx-side nx-facts">
            <div><dt>Published</dt><dd>{experiments.length}</dd></div>
            <div><dt>Tries</dt><dd>{tries}</dd></div>
          </dl>
          <div className="nx-main nx-prose">
            <p className="lede">Newest first. Each experiment asks a single question, written down before it runs, and publishes every try, good and bad.</p>
          </div>
        </section>
        <section className="nx-list nx-list-page" aria-label="Experiments">
          <ResearchList figures />
        </section>
      </main>
      <Footer wide />
    </div>
  );
}
