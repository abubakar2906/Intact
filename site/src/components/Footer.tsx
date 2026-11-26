import Link from 'next/link';

export function Footer({ dark = false }: { dark?: boolean }) {
  return (
    <footer className={dark ? 'bg-space text-white' : ''}>
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <div className={`flex flex-wrap items-end justify-between gap-6 border-t py-10 ${dark ? 'border-white/10' : 'border-line'}`}>
          <div>
            <Link href="/" className="text-[17px] font-semibold tracking-tight">Intact</Link>
            <p className={`mt-2 max-w-md text-[14px] leading-relaxed ${dark ? 'text-white/55' : 'text-muted'}`}>
              A benchmark for AI agents that move money. Built by{' '}
              <a href="https://x.com/kairo_v0" className={`underline underline-offset-4 ${dark ? 'text-white' : 'text-ink'}`}>@kairo_v0</a>.
              {' '}Open source on{' '}
              <a href="https://github.com/abubakar2906/Intact" className={`underline underline-offset-4 ${dark ? 'text-white' : 'text-ink'}`}>GitHub</a>.
            </p>
          </div>
          <p className={`font-mono text-[12px] ${dark ? 'text-white/35' : 'text-faint'}`}>MIT licence. Model logos: LobeHub Icons, MIT.</p>
        </div>
      </div>
    </footer>
  );
}
