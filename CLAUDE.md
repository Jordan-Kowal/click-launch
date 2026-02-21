# Click-Launch - Instructions for Claude Code

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Files

Reference these for project details:

- @Taskfile.yml - Developer commands (dev, build, lint, test, check)
- @package.json - Dependencies and their versions

## Project Overview

Desktop app for managing your local dev stack - configure once, launch everything with a click.

Tech stack: SolidJS, Vite, Tailwind CSS v4 + DaisyUI, Wails v3 (Go), Lucide Solid, Bun

## Project Structure

```txt
src/
  features/{name}/       # Feature-specific: components/, contexts/, pages/, enums.ts, routes.ts(x)
  components/layout/     # Shared layout components
  components/ui/         # Shared UI primitives
  contexts/              # Shared contexts (Context.ts + Provider.tsx pattern)
  hooks/                 # Shared hooks
  types/                 # Shared types (types.ts) and enums (enums.ts)
  utils/                 # Shared utilities
  backend.d.ts           # Type declarations for Wails-generated bindings
  routes.tsx             # Central routing config, exports routePaths constant

backend/
  *_service.go           # Go services (config, process, resource, file, app)
  *_service_test.go      # Go tests (table-driven, interface mocks)
  testdata/              # YAML test fixtures
```

**Shared** (`src/{type}/`, `backend/`) — used by 2+ features
**Feature-specific** (`src/features/{name}/{type}/`) — used by single feature only

When in doubt: default to feature-specific (easier to promote later)

## Developer Commands

All commands go through [Task](https://taskfile.dev/). See `Taskfile.yml` for full list.

## Code Style

### Global

- Descriptive names: `isLoading`, `hasError`, `canSubmit`
- Named constants over magic numbers
- Minimal external dependencies — prefer standard library / built-in solutions

### Frontend (TypeScript / SolidJS)

**File Naming:**

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities/Types/Config: `camelCase.ts`

**Barrel Exports:**

Use `index.ts` at every level **except** `src/components/`:

```txt
src/components/layout/index.ts    (yes)
src/components/ui/index.ts        (yes)
src/components/index.ts           (no root barrel)
```

**TypeScript:**

- Use `type` over `interface`
- Arrow functions for pure functions
- Named exports only (no default exports, except for page components)
- No SSR/server components — this is a static frontend

**Linting & Formatting:**

- Biome handles both linting and formatting (see `biome.json`)
- Biome auto-runs on save: removes unused imports, sorts imports alphabetically
- When editing: add usage first, then import (otherwise Biome removes the "unused" import)

**Styling (DaisyUI + Tailwind):**

- DaisyUI first for UI elements (`btn`, `modal`, `card`, `menu`, `kbd`, `badge`) and semantic colors (`bg-base-100`, `text-base-content`, `btn-primary`)
- Refer to DaisyUI documentation for available modifiers and components
- Tailwind for layout (`flex`, `grid`, `gap-*`), positioning, spacing, transitions, and custom sizing
- Avoid raw Tailwind for things DaisyUI handles

**SolidJS Control Flow (Critical):**

- `<Show>` for conditionals, `<For>` for lists, `<Switch>`/`<Match>` for multiple conditions
- NEVER use ternaries for component rendering
- NEVER use `.map()` for rendering lists

**SolidJS Reactivity:**

- `createSignal` for primitive local state
- `createStore` for complex/nested objects
- `createMemo` for derived values (avoid inline computations in JSX)
- `createEffect` only for side effects, not derivations
- Signals called as functions in JSX: `{count()}` not `{count}`

**Project Patterns:**

- **Context**: `ContextName.ts` (types + createContext) + `ContextNameProvider.tsx` (provider + useHook export)
- **Modals**: DaisyUI `modal modal-open` for toggle-based modals, native `<dialog>` with `.showModal()` for programmatic modals
- **localStorage**: Use `useLocalStorage` hook from `src/hooks/`
- **Toast**: Use `useToast` hook from `src/hooks/useToast.ts` (wraps `solid-toast` with settings check)

**Router:**

- Route definitions in `src/routes.tsx`, centralized `routePaths` constant
- `useNavigate()` for programmatic, `<A>` for declarative navigation
- Feature-specific routes in `src/features/{name}/routes.ts(x)`

**Wails Bindings:**

- Frontend imports services from `@backend` path alias (-> `frontend/bindings/.../backend`)
- Type declarations in `src/backend.d.ts` (Wails generates `.js` bindings, needs manual `.d.ts`)
- Events from `@wailsio/runtime`: `Events.On()` returns unsubscribe function
- Shared types in `src/types/types.ts`, enums in `src/types/enums.ts`

### Backend (Go / Wails)

**File Naming:**

- Source: `snake_case.go`, tests: `snake_case_test.go`
- Exported types/functions: `PascalCase`, unexported: `camelCase`
- Avoid redundancy in package context (e.g. `process.Start` not `process.ProcessStart`)

**Structure & Wails Integration:**

- Services as Go structs registered with Wails via `application.NewService()`
- One service per domain: `config_service.go`, `process_service.go`, `resource_service.go`, `file_service.go`, `app_service.go`
- Exported methods auto-generate TypeScript bindings via `wails3 generate bindings`
- Main -> renderer streaming uses Wails events (`app.Event.Emit()`)

**Linting & Formatting:**

- `gofmt` for formatting, `golangci-lint` for linting (configured via `.golangci.yml`)
- Fix command: `gofmt -w . && golangci-lint run --fix`

**Testing:**

- Table-driven tests with subtests (`t.Run`), test fixtures in `testdata/`
- Race detector: `go test -race ./...`
- Mock external dependencies via interfaces
