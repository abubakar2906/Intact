import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

const GITHUB = 'https://github.com/abubakar2906/Intact';

// The nav for the experiment pages.
// `cta` is the one main button.
export function HomeNav({ cta }: { cta: { href: string; label: string } }) {
  const external = cta.href.startsWith('http');
  return (
    <nav className="home-nav" aria-label="Site">
      <Link href="/" className="home-brand"><span className="intact-mark" aria-hidden />Intact</Link>
      <ul>
        <li><Link href="/experiments">Research</Link></li>
        <li><Link href="/method">Method</Link></li>
      </ul>
      <div className="home-nav-right">
        {!external && <a href={GITHUB}>GitHub</a>}
        {external
          ? <a href={cta.href} className="home-btn home-btn-main home-btn-sm">{cta.label}</a>
          : <Link href={cta.href} className="home-btn home-btn-main home-btn-sm">{cta.label}</Link>}
        <ThemeToggle />
      </div>
    </nav>
  );
}
