import type { Experiment } from '@/content/experiments';
import type { ExperimentData } from '@/lib/data';
import { CountUp, Reveal } from './Reveal';

// What we found, as four figures in story order: how often agents paid twice under each setup.
// Read left to right, the number falls as the agent is told more, or stopped. Each counts up as it arrives.
export function Findings({ exp, data }: { exp: Experiment; data: ExperimentData }) {
  return (
    <Reveal className="finds">
      {exp.setups.map((s, i) => {
        const t = data.totals[s.id];
        return (
          <div key={s.id} className="find">
            <p className="find-fig"><CountUp to={t.wrong} delay={i * 140} className={t.wrong ? 'is-wrong' : ''} /><span>of {t.n}</span></p>
            <h3>{s.name}</h3>
            <p className="find-what">{s.what}</p>
          </div>
        );
      })}
    </Reveal>
  );
}
