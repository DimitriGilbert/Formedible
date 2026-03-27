# Agent Guidelines for Formedible

## Build/Test Commands
- `npm run check-types` - Check types in all packages
- `npm run check-types:pkg` - Check types in formedible package only
- `npm run check-types:builder` - Check types in builder package only
- `npm run check-types:web` - Check types in web app only
- `npm run build` - Build all packages (uses turbo)
- `npm run build:web` - Build web app
- `npm run build:pkg` - Build formedible package only
- `npm run build:builder` - Build builder package only
- `npm run sync-components` - Sync components from formedible package to web app
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
- NEVER USE confirm OR alert ! anti pattern terrible UX ! NEVER !

## Formedible Work - CRITICAL WORKFLOW

### The Rule
- ALWAYS fix formedible component/hook issues in `packages/formedible/src/` then SYNC to other packages
- NEVER fix formedible issues directly in `apps/web`, `packages/builder`, `packages/ai-builder`, or `packages/formedible-parser`
- Package-specific errors (e.g. a file only in `packages/parser/`) are fixed in that package directly

### The Workflow (MUST follow this exact order)
1. **Fix** code in `packages/formedible/src/`
2. **Build** with `npm run build:pkg` (required - the sync reads from built output)
3. **Sync** with `node scripts/quick-sync.js`
4. **Fix** any package-specific errors in their own packages
5. **Verify** with `npm run check-types` (all packages must pass)

### Why `check-types:pkg` is NOT enough
- `npm run check-types:pkg` only checks the formedible package in isolation
- Many TS errors only surface when consumer packages import the synced files
- ALWAYS use `npm run check-types` (all packages) as the final verification

### What quick-sync.js syncs
- `packages/formedible` → `apps/web`, `packages/ai-builder`, `packages/builder`, `packages/formedible-parser`
- `packages/builder` → `apps/web`, `packages/ai-builder`
- `packages/ai-builder` → `apps/web`
- `packages/formedible-parser` → `apps/web`, `packages/ai-builder`, `packages/builder`
- If you discover a missing sync route, add it to `scripts/quick-sync.js`
