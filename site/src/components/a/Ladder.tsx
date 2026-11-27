import type { Experiment } from '@/content/experiments';
import { MODELS } from '@/content/models';
import { rankModels, type ExperimentData, type Verdict } from '@/lib/data';
import { ModelLogo } from '@/components/ModelName';
import { CountUp, Reveal } from '@/components/Reveal';

const LABEL: Record<Verdict, string> = { wrong: 'paid twice', right: 'got it right', escalated: 'handed it to a person', error: 'never finished' };

// Direction A: what each setup told the agent, and every try under it, one square each.
// Read down: the more the agent is told or stopped, the less red. Grouped by model, best first.
// Each row fills in as it scrolls into view: its paid-twice squares turn red model by model, and its count
// ticks up with them. Without JavaScript, or with reduced motion, the row simply shows its result.
export function Ladder({ exp, data }: { exp: Experiment; data: ExperimentData }) {
  const models = rankModels(exp, data);
  return (
    <div className="ladder">
      <div className="ladder-head" aria-hidden>
        <span />
        <span className="ladder-models">
          {models.map((m) => <span key={m}><ModelLogo id={m} size={16} />{MODELS[m].name}</span>)}
        </span>
        <span />
      </div>
      {exp.setups.map((s) => {
        const t = data.totals[s.id];
        return (
          <Reveal key={s.id} className="ladder-row">
            <div className="ladder-what">
              <h3>{s.name}</h3>
              <p>{s.what}</p>
            </div>
            <div className="ladder-tries" role="img" aria-label={`${s.name}: ${t.wrong} of ${t.n} tries ${exp.wrong.toLowerCase()}. ` + models.map((m) => `${MODELS[m].name} ${data.counts[m][s.id].wrong} of ${data.counts[m][s.id].n}`).join(', ')}>
              {models.map((m, mi) => {
                let red = 0;
                return (
                  <span key={m} className="ladder-model">
                    {(data.tries[m]?.[s.id] ?? []).map((tr) => (
                      <i key={tr.id} className={`sq-${tr.verdict}${tr.verdict === 'wrong' ? ' reveal-fill' : ''}`} title={`${MODELS[m].name}, try ${tr.sample}: ${LABEL[tr.verdict]}`}
                        style={tr.verdict === 'wrong' ? ({ '--delay': `${mi * 90 + red++ * 28}ms` } as React.CSSProperties) : undefined} />
                    ))}
                  </span>
                );
              })}
            </div>
            <p className="ladder-count"><b className={t.wrong ? 'is-wrong' : ''}><CountUp to={t.wrong} /></b> of {t.n}</p>
          </Reveal>
        );
      })}
    </div>
  );
}
