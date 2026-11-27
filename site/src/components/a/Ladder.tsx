import type { Experiment } from '@/content/experiments';
import { MODELS } from '@/content/models';
import { rankModels, type ExperimentData, type Verdict } from '@/lib/data';
import { ModelLogo } from '@/components/ModelName';

const LABEL: Record<Verdict, string> = { wrong: 'paid twice', right: 'got it right', escalated: 'handed it to a person', error: 'never finished' };

// Direction A: what each setup told the agent, and every try under it, one square each.
// Read down: the more the agent is told or stopped, the less red. Grouped by model, best first.
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
          <div key={s.id} className="ladder-row">
            <div className="ladder-what">
              <h3>{s.name}</h3>
              <p>{s.what}</p>
            </div>
            <div className="ladder-tries" role="img" aria-label={`${s.name}: ${t.wrong} of ${t.n} tries ${exp.wrong.toLowerCase()}. ` + models.map((m) => `${MODELS[m].name} ${data.counts[m][s.id].wrong} of ${data.counts[m][s.id].n}`).join(', ')}>
              {models.map((m) => (
                <span key={m} className="ladder-model">
                  {(data.tries[m]?.[s.id] ?? []).map((tr) => <i key={tr.id} className={`sq-${tr.verdict}`} title={`${MODELS[m].name}, try ${tr.sample}: ${LABEL[tr.verdict]}`} />)}
                </span>
              ))}
            </div>
            <p className="ladder-count"><b className={t.wrong ? 'is-wrong' : ''}>{t.wrong}</b> of {t.n}</p>
          </div>
        );
      })}
    </div>
  );
}
