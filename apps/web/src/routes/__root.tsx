import { Toaster } from '@formedible/ui/components/sonner';
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { ThemeProvider } from '../components/theme-provider';
import { ThemeSwitcher } from '../components/theme-switcher';
import Header from '../components/header';

import { createRouteSeoHead } from '../features/docs/seo';

import appCss from '../index.css?url';

export interface RouterAppContext {}

const rootHead = createRouteSeoHead('/');
const shouldRenderRouterDevtools = import.meta.env.DEV;

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
    scripts: rootHead.scripts,
  }),

  component: RootDocument,
});

function RootDocument() {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark-saffron" enableSystem={false} disableTransitionOnChange>
      <html lang="en" className="scroll-smooth">
        <head>
          <HeadContent />
          <script src="https://chemin.dbuild.dev/script.js" data-id="7040d34e-b41f-4f20-88d1-b86ac93266c4" data-utcoffset="2" data-server="https://chemin.dbuild.dev" />
        </head>
        <body className="h-svh overflow-hidden bg-background text-foreground antialiased">
          <a
            href="#main-content"
            className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-lg ring-1 ring-border focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            Skip to content
          </a>
          <div className="grid h-svh grid-rows-[auto_1fr] overflow-hidden">
            <Header />
            <div id="main-content" className="min-h-0 overflow-auto" tabIndex={-1}>
              <Outlet />
            </div>
          </div>
          <Toaster richColors />
          {shouldRenderRouterDevtools ? <TanStackRouterDevtools position="bottom-left" /> : null}
          <ThemeSwitcher />
          <Scripts />
        </body>
      </html>
    </ThemeProvider>
  );
}
