import { HOW_STEPS } from '@/content/how-it-works';

// How the benchmark works, in four steps. The base version: the steps as a plain ordered list.
// Each design direction replaces how it is drawn, not what it says.
export function HowItWorks() {
  return (
    <ol className="how">
      {HOW_STEPS.map((s, i) => (
        <li key={s.title}>
          <span className="how-n">{i + 1}</span>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
        </li>
      ))}
    </ol>
  );
}
