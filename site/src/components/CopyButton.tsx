'use client';

import { useState } from 'react';

// Copies text to the clipboard. Where the clipboard is not allowed, it selects the text so it can be copied by hand.
export function CopyButton({ text, targetId, label = 'Copy' }: { text: string; targetId?: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'select'>('idle');
  const fallback = () => {
    const el = targetId ? document.getElementById(targetId) : null;
    if (el) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    setState('select');
  };
  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard');
      await navigator.clipboard.writeText(text);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      fallback();
    }
  };
  return (
    <button type="button" onClick={copy} className="rounded-lg border border-line px-3 py-1.5 font-mono text-[12px] text-muted transition-colors hover:bg-wash hover:text-ink">
      <span aria-live="polite">{state === 'copied' ? 'Copied' : state === 'select' ? 'Selected, now copy it' : label}</span>
    </button>
  );
}
