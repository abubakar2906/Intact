'use client';

import { useLayoutEffect } from 'react';

// Light by default. The choice is kept in localStorage and put on <html> by the script in layout.tsx before the
// first paint, so the page never flashes the wrong theme. Which icon and label show is decided by CSS from that
// attribute, so the server and the browser render the same thing.
export const THEME_KEY = 'intact-theme';

export function ThemeToggle({ over = false }: { over?: boolean }) {
  // In development React clears <html>'s attributes on its second mount. This puts the theme back.
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(THEME_KEY) === 'dark') document.documentElement.dataset.theme = 'dark';
    } catch {}
  }, []);

  const toggle = () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`grid size-9 place-items-center rounded-full transition-colors ${over ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-muted hover:bg-wash hover:text-ink'}`}
    >
      <span className="sr-only dark:hidden">Switch to dark theme</span>
      <span className="sr-only hidden dark:inline">Switch to light theme</span>
      {/* A moon in light mode, a sun in dark mode: the icon shows where the button takes you. */}
      <svg aria-hidden viewBox="0 0 24 24" className="size-[18px] dark:hidden" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
      <svg aria-hidden viewBox="0 0 24 24" className="hidden size-[18px] dark:block" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
    </button>
  );
}
