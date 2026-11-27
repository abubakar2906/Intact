import { ModelLogo } from '@/components/ModelName';
import type { Experiment } from '@/content/experiments';
import { MODELS } from '@/content/models';
import { rankModels, type ExperimentData } from '@/lib/data';

// The results as statements: one per setup, in the order the story reads. Each lists every model's count
// and closes with the setup's total, the way a statement closes with its balance. Red is a try that paid twice.
export function Statements({ exp, data }: { exp: Experiment; data: ExperimentData }) {
  const models = rankModels(exp, data).reverse();
  return (
    <div className="stmts">
      {exp.setups.map((s) => {
        const t = data.totals[s.id];
        return (
          <section key={s.id} className="stmt" aria-label={`${s.name}: ${t.wrong} of ${t.n} paid twice`}>
            <h3>{s.name}</h3>
            <p className="stmt-what">{s.what}</p>
            <ul>
              {models.map((m) => {
                const c = data.counts[m][s.id];
                return (
                  <li key={m}>
                    <span className="stmt-model"><ModelLogo id={m} size={14} />{MODELS[m].name}</span>
                    <span className={c.wrong ? 'is-wrong' : undefined}>{c.wrong}<i>/{c.n}</i></span>
                  </li>
                );
              })}
            </ul>
            <p className="stmt-total"><b className={t.wrong ? 'is-wrong' : undefined}>{t.wrong}</b> of {t.n} paid twice</p>
          </section>
        );
      })}
    </div>
  );
}
