'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Run, Try, Verdict } from '@/lib/data';
import { MODELS } from '@/content/models';
import { RunCard } from './RunCard';
import { ModelName } from './ModelName';

type Props = {
  models: string[];
  setups: { id: string; name: string }[];
  tries: Record<string, Record<string, Try[]>>;
  wrongLabel: string;
};

const SQUARE: Record<Verdict, string> = {
  wrong: 'bg-red',
  right: 'bg-right',
  escalated: 'bg-paper ring-[1.5px] ring-inset ring-muted',
  error: 'bg-paper ring-1 ring-inset ring-line',
};

export function TryGrid({ models, setups, tries, wrongLabel }: Props) {
  const VERDICT: Record<Verdict, string> = { wrong: wrongLabel.toLowerCase(), right: 'got it right', escalated: 'handed it to a person', error: 'never finished (network error)' };
  const [open, setOpen] = useState<{ id: string; label: string } | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    fetch(`/runs/${open.id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Run) => live && setRun(data))
      .catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [open]);

  const show = (e: React.MouseEvent<HTMLAnchorElement>, id: string, label: string) => {
    // Cmd, Ctrl, Shift and middle clicks keep the link's own behaviour: the run opens as its own page.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    opener.current = e.currentTarget;
    setRun(null);
    setFailed(false);
    setOpen({ id, label });
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[13px] text-muted" aria-hidden>
        {(['wrong', 'right', 'escalated', 'error'] as Verdict[]).map((v) => (
          <span key={v} className="inline-flex items-center gap-2"><span className={`size-3.5 rounded-[3px] ${SQUARE[v]}`} />{VERDICT[v]}</span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr>
              <th className="pb-3" />
              {setups.map((s) => (
                <th key={s.id} className="pb-3 pl-4 font-mono text-[12px] font-normal uppercase tracking-[0.08em] text-faint">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m} className="border-t border-line">
                <td className="py-4 pr-4"><ModelName id={m} size={18} className="text-[15px] font-medium" /></td>
                {setups.map((s) => (
                  <td key={s.id} className="py-4 pl-4">
                    <span className="flex gap-1">
                      {(tries[m]?.[s.id] ?? []).map((t) => {
                        const label = `${MODELS[m].name}, ${s.name}, try ${t.sample}: ${VERDICT[t.verdict]}${t.untrue ? ', and said something false' : ''}`;
                        return (
                          <Link
                            key={t.id}
                            href={`/runs/${t.id}`}
                            prefetch={false}
                            onClick={(e) => show(e, t.id, label)}
                            aria-label={label}
                            title={label}
                            className={`relative size-[18px] rounded-[3px] transition-transform duration-100 hover:scale-125 ${SQUARE[t.verdict]}`}
                          >
                            {t.untrue && <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper" />}
                          </Link>
                        );
                      })}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 font-mono text-[13px] text-faint">A white dot means the reply also said something false. Click any square to read that try.</p>

      <dialog
        ref={dialog}
        onClose={() => { setOpen(null); opener.current?.focus(); }}
        onClick={(e) => { if (e.target === dialog.current) close(); }}
        className="ml-auto mr-0 h-dvh max-h-dvh w-full max-w-[760px] bg-paper p-0 backdrop:bg-ink/40 open:animate-[slide_220ms_ease-out]"
      >
        <div className="flex min-h-full flex-col">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-paper px-6 py-5 sm:px-8">
            <p className="text-[15px] font-medium leading-snug">{open?.label}</p>
            <button type="button" onClick={close} className="shrink-0 rounded-md px-2 py-1 font-mono text-[13px] text-muted hover:bg-wash hover:text-ink">Close</button>
          </div>
          <div className="flex-1 px-6 py-8 sm:px-8">
            {!run && !failed && <p className="font-mono text-[14px] text-faint">Loading the transcript…</p>}
            {failed && <p className="font-mono text-[14px] text-muted">Couldn’t load this try. <Link className="underline" href={`/runs/${open?.id}`}>Open it as a page</Link>.</p>}
            {run && (
              <>
                <RunCard run={run} wrongLabel={wrongLabel} compact />
                <Link href={`/runs/${run.id}`} className="mt-10 inline-block font-mono text-[13px] text-muted underline underline-offset-4 hover:text-ink">
                  Open as its own page, to share it
                </Link>
              </>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
