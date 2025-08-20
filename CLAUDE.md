# Agent Guidelines for Formedible

## Build/Test Commands

FROM THE ROOT OF THE PROJECT !!! **ALWAYS**

- `npm run check-types` - Check types in all packages
- `npm run build` - Build all packages (uses turbo)
- `npm run build:web` - Build web app
- `npm run build:pkg` - Build formedible package only
- `npm run build:builder` - Build builder package only
- `scripts/quick-sync.js` - Sync components from formedible package to web app
- `npm run sync-components` - Sync components from formedible package to web app using shadcn cli

## Code Style

- Use TypeScript with strict mode enabled
- React functional components with hooks (no class components)
- Import paths: Use `@/` alias for src directory imports
- Naming: camelCase for variables/functions, PascalCase for components/types
- Props: Define interfaces for component props, extend BaseFieldProps when applicable
- Error handling: Use try/catch blocks, log errors to console with descriptive messages
- Types: Prefer explicit typing, use `any` sparingly with ESLint warnings
- Exports: Use named exports for components, default export for main hooks
- File structure: Components in `/components`, hooks in `/hooks`, types in `/lib/formedible/types.ts`
- Formatting: Single quotes for strings, semicolons required, 2-space indentation
- React: No need to import React in JSX files (modern JSX transform)
- Dependencies: Check existing package.json before adding new dependencies
- Unused vars: Prefix with underscore to ignore ESLint warnings
- NEVER USE confirm OR alert ! anti pattern terrible UX ! NEVER !

## formedible work

- Always work on the packages first then scripts/quick-sync.js to sync the changes to the web app.
- use `npm run sync-components` to sync the changes before handing over to make sure shadcn install is functionning
- NEVER RUN THE DEV SERVER ! npm run dev IS COMPLETELLY OFF LIMIT ! NEVER npm run dev ! NEVER NEVER NVER !
- NEVER USE "any" IF YOU DO NOT HAVE TO ! THIS IS LAZY AND SHIT ! NEVER ! NEVER ! NEVER !
