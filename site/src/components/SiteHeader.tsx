import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

// Over a dark hero card the header is white; everywhere else it follows the theme.
export function SiteHeader({ over = false }: { over?: boolean }) {
  const tone = over ? 'text-white' : 'text-ink';
  const link = over ? 'text-white/75 hover:text-white' : 'text-muted hover:text-ink';
  return (
    <header className={`relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-10 sm:py-6 ${tone}`}>
      <Link href="/" className="font-display text-[20px] font-medium tracking-[-0.03em]">
        Intact
      </Link>
      <nav className="flex items-center gap-5 text-[15px] sm:gap-6">
        <Link href="/experiments" className={link}>Results</Link>
        <Link href="/method" className={link}>Method</Link>
        <ThemeToggle over={over} />
      </nav>
    </header>
  );
}
