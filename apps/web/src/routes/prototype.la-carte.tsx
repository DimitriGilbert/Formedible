import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { ScrollArea } from '@formedible/ui/components/scroll-area';
import { HeroExamples } from '@/components/demo/hero-examples';
import { InstallCommand } from '@/components/layout/install-command';
import { SiteFooter } from '@/components/layout/site-footer';

export const Route = createFileRoute('/prototype/la-carte')({
  component: LaCartePrototype,
});

const heroFeatures = [
  'Zod validation',
  'Multi-page flows',
  '25+ field types',
  'Component overrides',
  'Visual builder',
  'AI generation',
];

function LaCartePrototype() {
  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <BentoSection />
      <CtaSection />
      <SiteFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="px-6 pt-20 pb-20 lg:px-12">
      <div className="mx-auto grid w-full max-w-[1400px] gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
        <div className="flex flex-col justify-center">
          <h1 className="mt-6 max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Shadcn component so form taste better.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Describe fields, pages, and validation in one object. useFormedible renders the full form with shadcn/ui components and TanStack Form.
          </p>

          <ul className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2">
            {heroFeatures.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-block size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <InstallCommand />
          </div>

          <div className="mt-4">
            <Link
              to="/docs/getting-started"
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              Read the docs
              <ArrowRight size={14} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="min-w-0">
          <HeroExamples />
        </div>
      </div>
    </section>
  );
}

function BentoSection() {
  return (
    <section className="border-t border-border px-6 py-20 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px] overflow-hidden rounded-2xl">
        <div className="grid gap-px bg-border md:grid-cols-12">

          <div className="md:col-span-5 md:row-span-2 rounded-tl-2xl bg-muted p-6 md:p-8 flex flex-col">
            <p className="text-sm font-semibold text-foreground">Usage</p>
            <div className="mt-4 flex-1">
              <ScrollArea className="h-full">
                <pre className="text-sm leading-6 text-foreground [tab-size:2]">
                  <code>{`import { useFormedible } from '@/hooks/use-formedible';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  guests: z.number().min(1).max(12),
});

const { Form } = useFormedible({
  schema,
  fields: [
    { name: 'name', type: 'text', label: 'Guest name' },
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'guests', type: 'number', label: 'Party size' },
  ],
  formOptions: {
    defaultValues: { name: '', email: '', guests: 1 },
    onSubmit: async ({ value }) => {
      await saveReservation(value);
    },
  },
});

// <Form /> — that's it.`}</code>
                </pre>
              </ScrollArea>
            </div>
          </div>

          <div className="bg-background p-6 md:col-span-4">
            <p className="text-sm font-semibold text-foreground">Validation</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Zod schemas, inline validators, async checks, cross-field rules. Errors surface next to the field that caused them.
            </p>
          </div>

          <div className="bg-background p-6 md:col-span-3">
            <p className="text-sm font-semibold text-foreground">Multi-page</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Pages, tabs, conditional routing, dynamic copy, and progress tracking. Declared as data on each field.
            </p>
          </div>

          <div className="bg-background p-6 md:col-span-3">
            <p className="text-sm font-semibold text-foreground">25+ field types</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Text, select, date, switch, slider, file upload, combobox, rating, color picker, phone, location, and more.
            </p>
          </div>

          <div className="bg-background p-6 md:col-span-4">
            <p className="text-sm font-semibold text-foreground">Component overrides</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Swap any field renderer, wrapper, label, or error component. Full control without forking.
            </p>
          </div>

          <div className="bg-background p-6 md:col-span-5">
            <p className="text-sm font-semibold text-foreground">Builder & AI</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Drag fields in the visual builder or describe them in natural language. Both export the same typed field model.
            </p>
          </div>

          <div className="bg-background p-6 md:col-span-4">
            <p className="text-sm font-semibold text-foreground">Persistence</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Auto-save drafts to localStorage. Resume exactly where you left off.
            </p>
          </div>

          <div className="bg-background p-6 md:col-span-3">
            <p className="text-sm font-semibold text-foreground">Conditional logic</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Show, hide, or require fields based on other values. Declarative, no imperative glue.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="border-t border-border px-6 py-20 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Get started
        </h2>
        <div className="mt-6 max-w-xl">
          <InstallCommand />
        </div>
        <div className="mt-6 flex items-center gap-6">
          <Link
            to="/docs/getting-started"
            className="text-sm font-medium text-primary underline underline-offset-4 decoration-primary/30"
          >
            Read the docs
          </Link>
          <Link
            to="/docs/examples"
            className="text-sm font-medium text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30"
          >
            View examples
          </Link>
        </div>
      </div>
    </section>
  );
}
