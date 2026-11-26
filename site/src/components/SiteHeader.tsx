import Link from 'next/link';

// On the home page the header sits over the dark hero, so it inverts.
export function SiteHeader({ over = false }: { over?: boolean }) {
  const tone = over ? 'text-white' : 'text-ink';
  const link = over ? 'text-white/75 hover:text-white' : 'text-muted hover:text-ink';
  return (
    <header className={`relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10 ${tone}`}>
      <Link href="/" className="text-[19px] font-semibold tracking-tight">
        Intact
      </Link>
      <nav className="flex items-center gap-6 text-[15px]">
        <Link href="/experiments" className={link}>Results</Link>
        <Link href="/method" className={link}>Method</Link>
      </nav>
    </header>
  );
}
