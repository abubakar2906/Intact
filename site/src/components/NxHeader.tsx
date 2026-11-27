import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

const GITHUB = 'https://github.com/abubakar2906/Intact';

// The header for pages in the lab's style: the mark and name, a few links, the theme switch, and a hairline under it.
export function NxHeader() {
  return (
    <header className="nx-top">
      <Link href="/" className="note-brand"><span className="intact-mark" aria-hidden />Intact</Link>
      <nav aria-label="Site">
        <Link href="/experiments">Research</Link>
        <Link href="/method">Method</Link>
        <a href={GITHUB}>GitHub</a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
