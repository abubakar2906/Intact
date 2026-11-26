import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter_Tight, Martian_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
// Headlines only. Closer than Geist to the Swiss grotesks (Suisse Int'l) that big, regular-weight headlines want.
const interTight = Inter_Tight({ variable: '--font-inter-tight', subsets: ['latin'] });
const martian = Martian_Mono({ variable: '--font-martian', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Intact', template: '%s · Intact' },
  description: 'A benchmark for AI agents that move money. We give agents a payment system that sometimes gets things wrong, and check where the money ends up.',
};

// Runs while the page is parsed, before the first paint, so a saved dark theme never flashes light.
// The key matches THEME_KEY in components/ThemeToggle.tsx.
const THEME_SCRIPT = `(function(){document.documentElement.setAttribute("data-js","");try{if(localStorage.getItem("intact-theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${interTight.variable} ${martian.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        {children}
      </body>
    </html>
  );
}
