import { Fluid } from './Fluid';
import { SiteHeader } from './SiteHeader';

// A rounded dark card inset from the window's edges, with the header over it in white. Dark in both themes.
export function HeroCard({ still = false, className = '', children }: { still?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className="px-3 pt-3 sm:px-4 sm:pt-4">
      <section className={`relative isolate flex flex-col overflow-hidden rounded-2xl bg-space text-white ${className}`}>
        <Fluid still={still} time={still ? 38 : 0} />
        <SiteHeader over />
        {children}
      </section>
    </div>
  );
}
