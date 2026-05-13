import { Link, useLocation } from '@tanstack/react-router';

import { siteNavigation } from '@/features/docs/navigation';
import { siteMeta } from '@/features/docs/site-meta';
import { cn } from '@/lib/utils';

function normalizeHash(hash: string): string {
  if (hash === '') {
    return '';
  }

  return hash.startsWith('#') ? hash : `#${hash}`;
}

export default function Header() {
  const location = useLocation();
  const currentHref = `${location.pathname}${normalizeHash(location.hash)}`;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 shadow-[0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/78">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-5">
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-3 rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`${siteMeta.name} home`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card text-sm font-black tracking-tight text-foreground shadow-sm transition group-hover:border-primary/50 group-hover:text-primary">
              F
            </span>
            <span className="flex min-w-0 flex-col leading-none">
              <span className="truncate text-base font-semibold tracking-[-0.03em] text-foreground sm:text-lg">{siteMeta.name}</span>
              <span className="hidden text-[0.68rem] font-medium uppercase tracking-[0.26em] text-muted-foreground sm:block">Docs</span>
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 rounded-full border border-border/70 bg-muted/35 p-1 shadow-inner md:flex">
            {siteNavigation.map((item) => {
              const isActive = item.href === currentHref;

              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    isActive ? 'bg-background text-foreground shadow-sm ring-1 ring-border/60' : 'text-muted-foreground hover:bg-background/75 hover:text-foreground',
                  )}
                  aria-label={item.description}
                  aria-current={isActive ? 'location' : undefined}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        <nav aria-label="Primary navigation mobile" className="flex gap-2 overflow-x-auto pb-1 md:hidden">
          {siteNavigation.map((item) => {
            const isActive = item.href === currentHref;

            return (
              <a
                key={item.id}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isActive ? 'border-primary/45 bg-primary/10 text-primary shadow-sm' : 'border-border/70 bg-card/75 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
                aria-label={item.description}
                aria-current={isActive ? 'location' : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
