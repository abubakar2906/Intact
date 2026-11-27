import type { Metadata } from 'next';
import { Geist, Geist_Mono, Google_Sans_Flex, Inter_Tight, Martian_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
// Headlines only. Closer than Geist to the Swiss grotesks (Suisse Int'l) that big, regular-weight headlines want.
const interTight = Inter_Tight({ variable: '--font-inter-tight', subsets: ['latin'] });
const martian = Martian_Mono({ variable: '--font-martian', subsets: ['latin'] });
// The home page: soft curves (the ROND axis), still bold enough to carry a headline.
const soft = Google_Sans_Flex({ variable: '--font-soft', subsets: ['latin'], axes: ['ROND'] });

export const metadata: Metadata = {
  title: { default: 'Intact', template: '%s · Intact' },
  description: 'A benchmark for AI agents that move money. We give agents a payment system that sometimes gets things wrong, and check where the money ends up.',
};

// Runs while the page is parsed, before the first paint, so a saved dark theme never flashes light.
// The key matches THEME_KEY in components/ThemeToggle.tsx.
// White is the default. Dark only when someone picks it.
const THEME_SCRIPT = `(function(){var d=document.documentElement;d.setAttribute("data-js","");try{var t=localStorage.getItem("intact-theme");if(t==="dark")d.setAttribute("data-theme","dark")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${interTight.variable} ${martian.variable} ${soft.variable}`}
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
