import Link from 'next/link';

export function Footer() {
  return (
    <footer>
      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-line py-10">
          <div>
            <Link href="/" className="font-display text-[18px] font-medium tracking-[-0.03em]">Intact</Link>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">
              A benchmark for AI agents that move money. Built by{' '}
              <a href="https://x.com/kairo_v0" className="text-ink underline underline-offset-4">@kairo_v0</a>.
              {' '}Open source on{' '}
              <a href="https://github.com/abubakar2906/Intact" className="text-ink underline underline-offset-4">GitHub</a>.
            </p>
          </div>
          <p className="font-mono text-[12px] text-faint">MIT licence. Model logos: LobeHub Icons, MIT.</p>
        </div>
      </div>
    </footer>
  );
}
