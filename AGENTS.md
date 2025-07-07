# Agent Guidelines for Formedible

## Build/Test Commands
- `npm run build` - Build all packages (uses turbo)
- `npm run build:web` - Build web app
- `npm run build:pkg` - Build package only
- `npm run lint` - Run ESLint
- `npm run lint:web` - Lint web app
- `npm run lint:pkg` - Lint package only

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

## formedible work
Always work on the package first then unse `scripts/sync-formedible` to sync the changes to the web app.
