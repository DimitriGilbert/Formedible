import { createFileRoute } from '@tanstack/react-router';

import { FormBuilder } from '@formedible/ui/components/formedible/builder/form-builder';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/builder');

export const Route = createFileRoute('/builder')({
  head: () => routeHead,
  component: BuilderRoute,
});

function BuilderRoute() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            FormBuilder
          </h1>
          <p className="text-sm text-muted-foreground">
            Compose fields, preview output, and copy config.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            className="text-sm font-medium text-primary underline underline-offset-4 decoration-primary/30"
            href="/docs/builder"
          >
            Docs
          </a>
          <a
            className="text-sm font-medium text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30"
            href="/docs/fields"
          >
            Fields
          </a>
          <a
            className="text-sm font-medium text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30"
            href="/docs/api"
          >
            API
          </a>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <FormBuilder />
      </div>
    </div>
  );
}
