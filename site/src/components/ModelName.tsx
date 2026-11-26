import Image from 'next/image';
import { MODELS } from '@/content/models';

export function ModelName({ id, size = 20, className = '' }: { id: string; size?: number; className?: string }) {
  const m = MODELS[id];
  return (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap ${className}`}>
      <Image src={m.logo} alt="" width={size} height={size} unoptimized className="shrink-0" />
      {m.name}
    </span>
  );
}
