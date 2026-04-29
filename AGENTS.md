# Agent Guidelines for Formedible

## Build/Test Commands
- `pnpm run check-types` - Check types in all packages
- `pnpm run check-types:pkg` - Check types in formedible package only
- `pnpm run check-types:builder` - Check types in builder package only
- `pnpm run check-types:web` - Check types in web app only
- `pnpm run build` - Build all packages (uses turbo)
- `pnpm run build:web` - Build web app
- `pnpm run build:pkg` - Build formedible package only
- `pnpm run build:builder` - Build builder package only
- `pnpm run sync-components` - Sync components from formedible package to web app
- `pnpm run lint` - Run ESLint
- `pnpm run lint:web` - Lint web app
- `pnpm run lint:pkg` - Lint package only

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
2. **Build** with `pnpm run build:pkg` (required - the sync reads from built output)
3. **Sync** with `node scripts/quick-sync.js`
4. **Fix** any package-specific errors in their own packages
5. **Verify** with `pnpm run check-types` (all packages must pass)

### Why `check-types:pkg` is NOT enough
- `pnpm run check-types:pkg` only checks the formedible package in isolation
- Many TS errors only surface when consumer packages import the synced files
- ALWAYS use `pnpm run check-types` (all packages) as the final verification

### What quick-sync.js syncs
- `packages/formedible` → `apps/web`, `packages/ai-builder`, `packages/builder`, `packages/formedible-parser`
- `packages/builder` → `apps/web`, `packages/ai-builder`
- `packages/ai-builder` → `apps/web`
- `packages/formedible-parser` → `apps/web`, `packages/ai-builder`, `packages/builder`
- If you discover a missing sync route, add it to `scripts/quick-sync.js`

## Code Rules

### No `any`

**Never** use `any`, `as any`, `: any`. Not in function params, not in type casts, not in generics. Use proper types, `unknown`, or branded types.

### No `await import()`

**Never** use `await import()` to dynamically import modules. Use static imports instead.

### LSP ERRORS HAVE TO BE ADDRESSED !

THEY ARE IMPORTANT AND MOST OF THE TIME PREVENT CONVEX FROM BUILDING !

### DRY — Components & Types

- **Always search for existing components before creating new ones.** Use `@ai-council/ui/components` (shadcn library) first, then check `apps/web/src/components/`. Only create a new component if nothing suitable exists.
- **Pages must not define non-exported helper components.** If a piece of UI is reusable or non-trivial, extract it into the proper component directory.
- **Components live in feature/domain subdirectories** under `apps/web/src/components/` (e.g. `components/auth/`, `components/layout/`). Do not dump everything flat into `components/`.
- **Single source of truth for types.** Shared types go in `apps/web/src/types/`. Never redeclare the same type across multiple pages or files — import from the canonical location. Component prop types defined inline or in the component file are fine, but must reuse shared types where applicable.

### Dependencies

Check `pnpm-workspace.yaml` catalog and existing `package.json` files before adding new packages. Many common deps (react, zod, convex, tailwindcss, etc.) are already version-pinned in the catalog. Use `catalog:` references when available.
