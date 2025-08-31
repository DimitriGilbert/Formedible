# Sandpack File System Analysis

## KEY INSIGHT: Sandpack File Loading

From the context7 docs, I now understand the CRITICAL issue:

**Sandpack loads dependencies in two ways:**
1. **External NPM packages** - via `dependencies` in package.json
2. **Local files/modules** - via files in `/node_modules/` directory in the `files` prop

## The Problem I Created

I was trying to copy Formedible hooks and components from `createFormedibleSandbox()` directly into the sandbox files, but:

1. **The hooks import `@tanstack/react-form`** - this needs to be in package.json dependencies
2. **The components depend on internal Formedible structure** - these can't be resolved as external packages
3. **I broke the working system** that was properly loading all the Formedible ecosystem

## How Sandpack Actually Works (from docs)

```javascript
// LOCAL DEPENDENCIES GO IN /node_modules/
files: {
  "/node_modules/my-library/package.json": JSON.stringify({
    name: "my-library", 
    main: "./index.js"
  }),
  "/node_modules/my-library/index.js": "module.exports = { ... }",
  "/App.js": `import { something } from "my-library"`
}

// EXTERNAL DEPENDENCIES GO IN customSetup
customSetup: {
  dependencies: {
    "@tanstack/react-form": "^0.38.1",
    "react": "^18.2.0"
  }
}
```

## What the Working System Was Doing

The working system was:
1. **Using `createFormedibleSandbox()`** which contains ALL the Formedible components and hooks as `/node_modules/` entries
2. **Proper package.json** with all external dependencies like @tanstack/react-form
3. **Simple FormComponent** that could import from the bundled Formedible modules

## What I Broke

I replaced the working `createFormedibleSandbox()` system with:
1. **Direct file copying** of hooks/components without proper `/node_modules/` structure
2. **Missing external dependencies** in package.json
3. **Broken import paths** trying to import internal files that don't exist in the sandbox

## The Fix

**REVERT TO USING `createFormedibleSandbox()`** which already handles:
- All Formedible components as proper `/node_modules/` entries
- Correct package.json with all external dependencies
- Proper file structure that Sandpack can resolve

**ONLY CHANGE**: The FormComponent generation to use JSON config with useFormedible instead of static components.

## File Generation System

Looking at the build-time generation in `sandbox-templates.json`:
- The system generates 73 template files at build time
- These include all the Formedible ecosystem properly bundled for Sandpack
- `createFormedibleSandbox()` uses this pre-built system

## The Root Issue

**I completely misunderstood the Sandpack file loading system and destroyed a working dependency resolution by trying to copy files directly instead of using the proper `/node_modules/` structure that was already working.**