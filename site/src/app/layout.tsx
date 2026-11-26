import type { Metadata } from 'next';
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
        {children}
      </body>
    </html>
  );
}
