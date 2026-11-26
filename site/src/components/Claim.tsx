// A claim with its key figure in red. If the figure isn't in the text, the claim shows plain rather than wrong.
// On the dark hero cards the figure takes the lighter red, which reads there.
export function Claim({ text, highlight, onDark = false }: { text: string; highlight: string; onDark?: boolean }) {
  const i = text.indexOf(highlight);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className={onDark ? 'text-redsoft' : 'text-red'}>{highlight}</span>
      {text.slice(i + highlight.length)}
    </>
  );
}
