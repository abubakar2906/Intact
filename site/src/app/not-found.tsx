import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <>
    <main className="flex-1 pb-24">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 pt-20 sm:px-10">
        <h1 className="text-[36px] leading-tight sm:text-[48px]">There’s nothing at this address</h1>
        <p className="mt-3 text-[17px] text-muted">The experiment or run may have moved.</p>
        <Link href="/experiments" className="mt-8 inline-block text-[16px] font-medium underline underline-offset-4">See every experiment</Link>
      </div>
    </main>
    <Footer />
    </>
  );
}
