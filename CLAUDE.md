# Click-Launch - Instructions for Claude Code

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Files

Reference these for project details:

- @README.md - Project overview and setup instructions
- @package.json - Available scripts and dependencies
- @tsconfig.json - TypeScript configuration and path aliases
- @biome.json - Linting, formatting rules, and SolidJS domain settings

## Project Overview

Desktop app for managing your local dev stack - configure once, launch everything with a click.

Tech stack: SolidJS, Vite, Tailwind CSS v4 + DaisyUI, Electron, Lucide Solid, Biome, pnpm

## Project Structure

```txt
src/
  features/{name}/       # Feature-specific: components/, contexts/, pages/, enums.ts, routes.ts(x)
  components/layout/     # Shared layout components
  components/ui/         # Shared UI primitives
  contexts/              # Shared contexts (Context.ts + Provider.tsx pattern)
  hooks/                 # Shared hooks
  electron/              # Electron types, enums, IPC definitions
  utils/                 # Shared utilities
  routes.tsx             # Central routing config, exports routePaths constant

electron/
  main.ts, preload.ts    # Main/preload processes
  utils/                 # Main process utilities
```

**Shared** (`src/{type}/`, `electron/utils/`) — used by 2+ features
**Feature-specific** (`src/features/{name}/{type}/`) — used by single feature only

When in doubt: default to feature-specific (easier to promote later)

## Context Management

- Use `/clear` between unrelated features to reset context
- Use `/compact` if responses slow down or context feels bloated
- Run `/verify` before commits to ensure quality checks pass

## Code Style

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities/Types/Config: `camelCase.ts`

### Barrel Exports

Use `index.ts` at every level **except** `src/components/`:

```txt
✅ src/components/layout/index.ts
✅ src/components/ui/index.ts
❌ src/components/index.ts (no root barrel)
```

### TypeScript

- Use `type` over `interface`
- Arrow functions for pure functions
- Descriptive names: `isLoading`, `hasError`, `canSubmit`
- Named constants over magic numbers
- Named exports only (no default exports, except for page components)
- No SSR/server components—this is a static frontend

### SolidJS Patterns

**Control Flow (Critical):**

- ✅ Use `<Show>` instead of ternaries for conditionals
- ✅ Use `<For>` instead of `.map()` for lists
- ✅ Use `<Switch>`/`<Match>` for multiple conditions
- ❌ NEVER use ternaries for component rendering
- ❌ NEVER use `.map()` for rendering lists

**Reactivity:**

- ✅ `createSignal` for primitive local state
- ✅ `createStore` for complex/nested objects
- ✅ `createMemo` for derived values (avoid inline computations in JSX)
- ✅ `createEffect` only for side effects, not derivations
- ✅ Signals called as functions in JSX: `{count()}` not `{count}`

**Async & Error Handling:**

- ✅ Async boundaries wrapped with `<Suspense>`
- ✅ Error boundaries with `<ErrorBoundary>`
- ✅ Proper fallback components

**Router:**

- ✅ Route definitions in `src/routes.tsx`
- ✅ Centralized `routePaths` constant exported from `src/routes.tsx`
- ✅ Use `useNavigate()` for programmatic navigation
- ✅ Use `<A>` component for declarative navigation
- ✅ Feature-specific routes in `src/features/{name}/routes.ts(x)`

### Electron Patterns

**IPC (Inter-Process Communication):**

- ✅ Type-safe channels in `src/electron/types.ts`
- ✅ Channel enums in `src/electron/enums.ts`
- ✅ Renderer uses `window.electron.invoke()`, main uses `webContents.send()`
- ✅ Always validate payloads on both sides
- ✅ Preload scripts for safe renderer-main communication

**Security:**

- ✅ Context isolation enabled, node integration disabled
- ✅ Validate all IPC messages
- ✅ Use CSP headers, disable eval
- ✅ Follow Electron security checklist

**Architecture:**

- ✅ Minimal main process (keep logic in renderer when possible)
- ✅ Renderer for UI, main for native APIs (file system, notifications)
- ✅ Proper window/lifecycle management
- ✅ Exclude unnecessary Node.js modules from renderer bundle
