import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono, Martian_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const martian = Martian_Mono({ variable: '--font-martian', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Intact', template: '%s · Intact' },
  description: 'A benchmark for AI agents that move money. We give agents a payment system that sometimes gets things wrong, and check where the money ends up.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${martian.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <div className="flex-1">{children}</div>
        <footer className="mx-auto mt-24 w-full max-w-6xl px-6 sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6 border-t border-line py-10">
          <div>
            <Link href="/" className="text-[17px] font-semibold tracking-tight">Intact</Link>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">
              A benchmark for AI agents that move money. Built by{' '}
              <a href="https://x.com/kairo_v0" className="text-ink underline underline-offset-4">@kairo_v0</a>.
            </p>
          </div>
          <p className="font-mono text-[12px] text-faint">Model logos: LobeHub Icons, MIT licence.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
