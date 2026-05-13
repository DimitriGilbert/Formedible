import { Toaster } from '@formedible/ui/components/sonner';
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { ThemeProvider } from '../components/theme-provider';
import { ThemeSwitcher } from '../components/theme-switcher';
import Header from '../components/header';

import { createRouteSeoHead } from '../docs/seo';

import appCss from '../index.css?url';

export interface RouterAppContext {}

const rootHead = createRouteSeoHead('/');

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: rootHead.meta,
    links: [
      ...rootHead.links,
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark-saffron" enableSystem={false} disableTransitionOnChange>
      <html lang="en" className="scroll-smooth">
        <head>
          <HeadContent />
        </head>
        <body className="min-h-svh bg-background text-foreground antialiased">
          <a
            href="#main-content"
            className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-lg ring-1 ring-border focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            Skip to content
          </a>
          <div className="grid min-h-svh grid-rows-[auto_1fr] bg-background">
            <Header />
            <div id="main-content" className="min-h-0" tabIndex={-1}>
              <Outlet />
            </div>
          </div>
          <Toaster richColors />
          <TanStackRouterDevtools position="bottom-left" />
          <ThemeSwitcher />
          <Scripts />
        </body>
      </html>
    </ThemeProvider>
  );
}
