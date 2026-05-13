import type { DocsCardContent } from '@/features/docs/content';

type DocsCardProps = {
  readonly card: DocsCardContent;
  readonly index: number;
};

export function DocsCard({ card }: DocsCardProps) {
  return (
    <a
      href={card.href}
      className="group bg-background p-6 outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <p className="text-sm font-semibold text-muted-foreground">{card.eyebrow}</p>
      <p className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary">{card.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
      <ul className="mt-4 grid gap-1.5">
        {card.bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            {bullet}
          </li>
        ))}
      </ul>
    </a>
  );
}
