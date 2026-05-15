import { createFileRoute } from '@tanstack/react-router';

import { AIBuilder } from '@formedible/ui/components/formedible/ai/ai-builder';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/ai-builder');

export const Route = createFileRoute('/ai-builder')({
  head: () => routeHead,
  component: AiBuilderRoute,
});

function AiBuilderRoute() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            AI Builder
          </h1>
          <p className="text-sm text-muted-foreground">
            Describe your form and let AI generate a draft configuration.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            className="text-sm font-medium text-primary underline underline-offset-4 decoration-primary/30"
            href="/docs/ai-builder"
          >
            Docs
          </a>
          <a
            className="text-sm font-medium text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30"
            href="/docs/builder"
          >
            Builder
          </a>
          <a
            className="text-sm font-medium text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30"
            href="/docs/validation"
          >
            Validation
          </a>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        <AIBuilder className="h-full min-h-0" />
      </div>
    </div>
  );
}
