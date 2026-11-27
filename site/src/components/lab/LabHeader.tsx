import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';

const GITHUB = 'https://github.com/abubakar2906/Intact';

export function LabHeader() {
  return (
    <header className="lab-top">
      <Link href="/" className="lab-brand"><span className="intact-mark" aria-hidden />Intact</Link>
      <nav aria-label="Site">
        <Link href="/experiments">Research</Link>
        <Link href="/method">Method</Link>
        <a href={GITHUB}>GitHub</a>
        <ThemeToggle />
      </nav>
    </header>
  );
}

export function LabFooter() {
  return (
    <footer className="lab-foot">
      <span>Intact, an AI lab for agents that move money. Built by <a href="https://x.com/kairo_v0">@kairo_v0</a>.</span>
      <span className="lab-mono">MIT licence. Model logos: LobeHub Icons, MIT.</span>
    </footer>
  );
}
