// A claim with its key figure in red. If the figure isn't in the text, the claim shows plain rather than wrong.
export function Claim({ text, highlight }: { text: string; highlight: string }) {
  const i = text.indexOf(highlight);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-red">{highlight}</span>
      {text.slice(i + highlight.length)}
    </>
  );
}
