## Project Overview

This is a monorepo for `Formedible`, a React form library that provides a type-safe and developer-friendly wrapper around `TanStack Form`. It uses `zod` for schema validation and `shadcn/ui` for components.

The project is structured as a monorepo using `turbo`. The main packages are:
-   `packages/formedible`: The core `formedible` library.
-   `apps/web`: The documentation and demo website.

## Building and Running

The project uses `npm` as the package manager and `turbo` to manage the monorepo.

-   **Install dependencies:**
    ```bash
    npm install
    ```

-   **Build all packages and apps:**
    ```bash
    npm run build
    ```
    - To build only the library: `npm run build:pkg`
    - To build only the website: `npm run build:web`

-   **Run in development mode:**
    ```bash
    npm run dev
    ```
    - To run only the library in dev mode: `npm run dev:pkg`
    - To run only the website in dev mode: `npm run dev:web`

-   **Run tests:**
    ```bash
    npm run test
    ```
    - To run e2e tests: `npm run test:e2e`

-   **Run linter:**
    ```bash
    npm run lint
    ```

## Development Conventions

-   The project uses `TypeScript` extensively.
-   Coding style is enforced with a linter, which can be run with `npm run lint`.
-   The core library is located in `packages/formedible`.
-   The documentation website is in `apps/web`.
-   When making changes to the library, you can test them in the website by running `npm run dev` and syncing the changes.
