import Image from 'next/image';
import { MODELS } from '@/content/models';

export function ModelLogo({ id, size = 20, className = '' }: { id: string; size?: number; className?: string }) {
  const m = MODELS[id];
  // Logos drawn in black are turned light in dark mode; the hue turn keeps any colour in them close to its own.
  return <Image src={m.logo} alt="" width={size} height={size} unoptimized className={`shrink-0 ${m.ink ? 'dark:invert dark:hue-rotate-180' : ''} ${className}`} />;
}

// `wrap` lets a long name break onto two lines on a phone, for tight tables.
export function ModelName({ id, size = 20, className = '', wrap = false }: { id: string; size?: number; className?: string; wrap?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${wrap ? 'leading-snug sm:whitespace-nowrap' : 'whitespace-nowrap'} ${className}`}>
      <ModelLogo id={id} size={size} />
      {MODELS[id].name}
    </span>
  );
}
