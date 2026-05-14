'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@formedible/ui/lib/utils';

const themes = [
  {
    value: 'light-saffron',
    label: 'Service Blanc',
    swatch: 'oklch(0.72 0.10 80)',
    swatchSecondary: 'oklch(0.96 0.005 75)',
  },
  {
    value: 'light-sage',
    label: 'Jardin Clair',
    swatch: 'oklch(0.62 0.06 155)',
    swatchSecondary: 'oklch(0.96 0.005 75)',
  },
  {
    value: 'dark-saffron',
    label: 'Mise en Place',
    swatch: 'oklch(0.75 0.12 80)',
    swatchSecondary: 'oklch(0.16 0.012 60)',
  },
  {
    value: 'dark-sage',
    label: 'Herbier Noir',
    swatch: 'oklch(0.65 0.07 155)',
    swatchSecondary: 'oklch(0.16 0.012 60)',
  },
  {
    value: 'penumbra-saffron',
    label: 'Penombre',
    swatch: 'oklch(0.78 0.12 80)',
    swatchSecondary: 'oklch(0.35 0.015 65)',
  },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="fixed right-4 bottom-4 z-50 h-10 w-10 rounded-full border border-border bg-muted" />
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted p-2">
          {themes.map((t) => {
            const isActive = theme === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setTheme(t.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                <span
                  className="size-4 shrink-0 rounded-full border border-border"
                  style={{ background: t.swatch }}
                />
                <span className="whitespace-nowrap font-medium">{t.label}</span>
                {isActive && (
                  <span className="ml-auto size-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex size-10 items-center justify-center rounded-full border border-border bg-muted transition-colors hover:bg-primary/5"
        aria-label="Switch theme"
      >
        <span
          className="size-5 rounded-full border border-border"
          style={{
            background: themes.find((t) => t.value === theme)?.swatch ?? themes[0].swatch,
          }}
        />
      </button>
    </div>
  );
}
