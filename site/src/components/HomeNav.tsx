import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

const GITHUB = 'https://github.com/abubakar2906/Intact';

// The nav for pages in the new look: the home page and the experiment pages.
// On the home page the section links jump within the page. Elsewhere they go back to it.
// `cta` is the one main button: the latest results on the home page, the code everywhere else.
export function HomeNav({ home = false, cta }: { home?: boolean; cta: { href: string; label: string } }) {
  const at = (id: string) => (home ? `#${id}` : `/#${id}`);
  const external = cta.href.startsWith('http');
  return (
    <nav className="home-nav" aria-label="Site">
      <Link href="/" className="home-brand"><span className="intact-mark" aria-hidden />Intact</Link>
      <ul>
        <li><a href={at('research')}>Research</a></li>
        <li><a href={at('platform')}>Platform</a></li>
        <li><Link href="/method">Method</Link></li>
        <li><a href={at('updates')}>Updates</a></li>
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
