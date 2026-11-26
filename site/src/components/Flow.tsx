// A small diagram of boxes and arrows, drawn in HTML so it reflows: a row on wide screens, a column on narrow ones.
// No colour: a box that matters more gets a darker border, nothing else.

export type FlowNode = { label: string; note?: string; strong?: boolean };

type Props = {
  nodes: FlowNode[];
  links?: ('to' | 'both')[]; // the arrow after each node but the last; 'to' by default
  result?: FlowNode; // a box under the row that everything feeds into
  loop?: string; // an arrow from the last box back to the first, with this label
  vertical?: boolean; // always a column, for narrow places
};

export function Flow({ nodes, links = [], result, loop, vertical = false }: Props) {
  const row = vertical ? 'flex-col' : 'flex-col lg:flex-row';
  return (
    <div className="text-left">
      <div className={`flex items-stretch ${row}`}>
        {nodes.map((n, i) => (
          <div key={n.label} className={`flex items-stretch ${row} ${vertical ? '' : 'lg:flex-1'}`}>
            <Box node={n} className={vertical ? '' : 'lg:flex-1'} />
            {i < nodes.length - 1 && <Arrow both={links[i] === 'both'} turn={vertical ? 'down' : 'auto'} />}
          </div>
        ))}
      </div>
      {loop && (
        <>
          {/* On a row: a line that runs under the boxes and back to the first. On a column: a plain note. */}
          <div aria-hidden className={`relative mx-[12%] h-6 rounded-b-xl border-x border-b border-faint/60 ${vertical ? 'hidden' : 'hidden lg:block'}`}>
            <span className="absolute -left-[5px] -top-[1px] size-0 border-x-[5px] border-b-[7px] border-x-transparent border-b-faint/60" />
          </div>
          <p className={`mt-3 flex items-center gap-2 font-mono text-[12px] text-muted ${vertical ? '' : 'lg:justify-center'}`}>
            <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v2.5h-2.5" />
            </svg>
            {loop}
          </p>
        </>
      )}
      {result && (
        <>
          <Arrow turn="down" />
          <Box node={result} />
        </>
      )}
    </div>
  );
}

function Box({ node, className = '' }: { node: FlowNode; className?: string }) {
  return (
    <div className={`min-w-0 rounded-xl border bg-paper px-4 py-3 ${node.strong ? 'border-ink' : 'border-line'} ${className}`}>
      <p className="text-[15px] font-medium leading-snug text-ink">{node.label}</p>
      {node.note && <p className="mt-1 text-[13px] leading-snug text-muted">{node.note}</p>}
    </div>
  );
}

function Arrow({ both = false, turn }: { both?: boolean; turn: 'down' | 'auto' }) {
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center text-faint ${turn === 'auto' ? 'h-7 lg:h-auto lg:w-8' : 'h-7'}`}>
      <svg viewBox="0 0 24 12" className={`h-3 w-6 ${turn === 'down' ? 'rotate-90' : 'rotate-90 lg:rotate-0'}`} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 6h20M18 2l4 4-4 4" />
        {both && <path d="M6 2 2 6l4 4" />}
      </svg>
    </span>
  );
}
