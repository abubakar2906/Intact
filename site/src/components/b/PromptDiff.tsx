import type { Experiment } from '@/content/experiments';
import { MODELS } from '@/content/models';
import { ModelLogo } from '@/components/ModelName';
import { method, rankModels, type ExperimentData } from '@/lib/data';

// Direction B: what changed from one setup to the next, as a diff of the agent's real instructions,
// beside what it did to the money. Sentences are compared, so a line added mid-paragraph still shows.
const sentences = (text: string) => text.split(/(?<=[.:])\s+|\n+/).map((s) => s.replace(/^-\s*/, '').trim()).filter(Boolean);

export function PromptDiff({ exp, data }: { exp: Experiment; data: ExperimentData }) {
  const models = rankModels(exp, data);
  // Each setup against the one before it, in story order.
  const changes: string[][] = [];
  let before: string[] = [];
  for (const [i, s] of exp.setups.entries()) {
    const now = sentences(method.prompts[s.id] ?? '');
    changes.push(i === 0 ? [] : now.filter((x) => !before.includes(x)));
    before = now;
  }
  return (
    <div className="pdiff">
      {exp.setups.map((s, i) => {
        const added = changes[i];
        // The lock lives in the tool, not the instructions, so its change is the tool's new behaviour.
        const tool = s.id === 'D' && method.conditions.D ? method.conditions.D.replace(/^guard:\s*/, '') : null;
        const t = data.totals[s.id];
        return (
          <section key={s.id} className="pdiff-row" aria-label={`${s.name}: ${t.wrong} of ${t.n} ${exp.wrong.toLowerCase()}`}>
            <div className="pdiff-text">
              <h3>{s.name}</h3>
              <div className="pdiff-code">
                {i === 0 && <p className="pdiff-same">The shop’s plain instructions. Nothing about stale statuses.</p>}
                {added.map((a) => <p key={a} className="pdiff-add"><span aria-hidden>+</span>{a}</p>)}
                {tool && <p className="pdiff-add"><span aria-hidden>+</span>The transfer tool {tool.replace(/^the transfer tool /, '')}.</p>}
                {i > 0 && !added.length && !tool && <p className="pdiff-same">No change to the instructions.</p>}
              </div>
            </div>
            <div className="pdiff-result">
              <p className="pdiff-count"><b className={t.wrong ? 'is-wrong' : ''}>{t.wrong}</b> of {t.n}</p>
              <ul className="pdiff-models" aria-hidden>
                {models.map((m) => {
                  const c = data.counts[m][s.id];
                  return (
                    <li key={m} title={`${MODELS[m].name}: ${c.wrong} of ${c.n}`}>
                      <ModelLogo id={m} size={14} />
                      <span className="pdiff-bar"><i style={{ width: `${c.n ? (c.wrong / c.n) * 100 : 0}%` }} /></span>
                      <span className="pdiff-n">{c.wrong}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
