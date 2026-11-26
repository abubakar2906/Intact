// The one frame every chart and results table sits in: a title, a line saying what is measured, and which way is good.
export function ChartFrame({
  title,
  definition,
  lowerIsBetter = false,
  aside,
  level = 3,
  className = '',
  children,
}: {
  title: React.ReactNode;
  definition: React.ReactNode;
  lowerIsBetter?: boolean;
  aside?: React.ReactNode; // a figure shown at the top right, like the setup's total
  level?: 2 | 3;
  className?: string;
  children: React.ReactNode;
}) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <figure className={`flex min-w-0 flex-col ${className}`}>
      <figcaption className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Heading className={level === 2 ? 'text-[26px] leading-tight sm:text-[32px]' : 'text-[19px] leading-snug'}>{title}</Heading>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{definition}</p>
          {lowerIsBetter && <LowerIsBetter />}
        </div>
        {aside && <div className="shrink-0 text-right">{aside}</div>}
      </figcaption>
      <div className="mt-6 min-w-0 flex-1">{children}</div>
    </figure>
  );
}

export function LowerIsBetter() {
  return (
    <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[12px] text-faint">
      <svg aria-hidden viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" />
      </svg>
      Lower is better
    </p>
  );
}

// A setup's total, for a frame's top right. Red only when money went wrong.
export function Total({ wrong, n, size = 'md' }: { wrong: number; n: number; size?: 'md' | 'lg' }) {
  return (
    <>
      <p className={`font-mono font-medium leading-none tracking-tight ${size === 'lg' ? 'text-[40px]' : 'text-[30px]'} ${wrong ? 'text-red' : 'text-ink'}`}>{wrong}</p>
      <p className="mt-1.5 font-mono text-[12px] text-faint">of {n}</p>
    </>
  );
}
