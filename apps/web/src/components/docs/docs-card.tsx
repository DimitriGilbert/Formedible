import type { DocsCardContent } from '@/features/docs/content';

import { cn } from '@/lib/utils';

const toneClasses: Record<DocsCardContent['tone'], string> = {
  amber: 'from-amber-500/18 via-amber-500/5 to-transparent group-hover:border-amber-400/50',
  blue: 'from-sky-500/18 via-sky-500/5 to-transparent group-hover:border-sky-400/50',
  green: 'from-emerald-500/18 via-emerald-500/5 to-transparent group-hover:border-emerald-400/50',
  rose: 'from-rose-500/18 via-rose-500/5 to-transparent group-hover:border-rose-400/50',
  violet: 'from-violet-500/18 via-violet-500/5 to-transparent group-hover:border-violet-400/50',
};

type DocsCardProps = {
  readonly card: DocsCardContent;
  readonly index: number;
};

export function DocsCard({ card, index }: DocsCardProps) {
  return (
    <a
      href={card.href}
      className={cn(
        'group relative flex min-h-72 flex-col justify-between overflow-hidden rounded-[1.75rem] border border-border/70 bg-card p-6 outline-none transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        index % 2 === 0 ? 'lg:translate-y-6' : 'lg:-translate-y-2',
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-100 transition duration-300 group-hover:opacity-80', toneClasses[card.tone])} aria-hidden="true" />
      <div className="absolute right-5 top-5 text-6xl font-black tracking-[-0.08em] text-foreground/[0.035]" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </div>
      <div className="relative space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">{card.eyebrow}</p>
        <h2 className="text-2xl font-bold tracking-[-0.04em] text-foreground">{card.title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{card.description}</p>
      </div>
      <ul className="relative mt-8 grid gap-2 text-sm text-foreground/85">
        {card.bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </a>
  );
}
