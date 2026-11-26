import Link from 'next/link';
import { SiteHeader } from './SiteHeader';

// The home page's opening, after Vending-Bench: one dark panel, one question, one way in.
// The picture is the trap itself: what the payment system says, against what the bank did.
export function Hero({ href }: { href: string }) {
  return (
    <div className="px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="relative overflow-hidden rounded-2xl bg-night text-white">
        <SiteHeader over />
        <div className="mx-auto grid max-w-6xl gap-14 px-6 pb-14 pt-10 sm:px-10 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-white/55">A benchmark for AI agents that move money</p>
            <h1 className="mt-5 text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[64px]">
              Do AI agents keep money intact?
            </h1>
            <p className="mt-6 max-w-[34rem] text-[18px] leading-relaxed text-white/70 sm:text-[19px]">
              We give agents a payment system that sometimes gets things wrong, the way real ones do, and check where the money ends up.
            </p>
            <Link href={href} className="mt-9 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-white/90">
              Read the first finding <span aria-hidden>→</span>
            </Link>
          </div>
          <Statement />
        </div>
      </div>
    </div>
  );
}

function Statement() {
  return (
    <figure className="font-mono">
      <div className="overflow-hidden rounded-xl border border-white/12 bg-white/[0.04]">
        <Line who="Ledgerline, the payment system" what="TRF-INV-88 · ₦250,000" status="Failed" dim />
        <Line who="Access Bank" what="Credited 21 Nov, 14:02" status="Paid" />
        <Line who="The agent" what="Sends ₦250,000 again" status="Paid twice" red />
      </div>
      <figcaption className="mt-4 text-[13px] leading-relaxed text-white/50">
        The agent sees the first line. The money followed the second.
      </figcaption>
    </figure>
  );
}

function Line({ who, what, status, dim = false, red = false }: { who: string; what: string; status: string; dim?: boolean; red?: boolean }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-white/10 px-5 py-4 first:border-t-0 sm:px-6">
      <div className="min-w-0">
        <p className="text-[12px] uppercase tracking-[0.08em] text-white/45">{who}</p>
        <p className={`mt-1.5 text-[15px] sm:text-[16px] ${red ? 'text-redsoft' : 'text-white/90'}`}>{what}</p>
      </div>
      <span
        className={`rounded px-2.5 py-1 text-[12px] font-medium uppercase tracking-[0.06em] ${
          red ? 'bg-red text-white' : dim ? 'border border-white/25 text-white/70 line-through decoration-white/40' : 'bg-white text-ink'
        }`}
      >
        {status}
      </span>
    </div>
  );
}
