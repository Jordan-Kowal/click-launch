# Click-Launch - Instructions for Claude Code

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Files

Reference these for project details:

- @README.md - Project overview and setup instructions
- @Taskfile.yml - Developer commands (dev, build, lint, test, check)
- @tsconfig.json - TypeScript configuration and path aliases
- @biome.json - Linting, formatting rules, and SolidJS domain settings

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

All commands go through [Task](https://taskfile.dev/) (see `Taskfile.yml`):

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `task dev`          | Start app in dev mode (Go + Vite)       |
| `task build`        | Production build                        |
| `task package`      | Build + bundle into `.app`              |
| `task lint`         | All linters (biome, tsc, golangci-lint) |
| `task test`         | All tests (Go)                          |
| `task check`        | lint + test (pre-commit hook)           |
| `task upgrade`      | Update all deps to latest + run checks  |
| `task clean`        | Remove build artifacts                  |
| `task version:bump` | Bump version across config files        |

## Context Management

- Use `/clear` between unrelated features to reset context
- Use `/compact` if responses slow down or context feels bloated
- Run `/verify` before commits to ensure quality checks pass

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
✅ src/components/layout/index.ts
✅ src/components/ui/index.ts
❌ src/components/index.ts (no root barrel)
```

**TypeScript:**

- Use `type` over `interface`
- Arrow functions for pure functions
- Named exports only (no default exports, except for page components)
- No SSR/server components—this is a static frontend

**Linting & Formatting:**

- Biome handles both linting and formatting (see `biome.json`)
- Biome auto-runs on save: removes unused imports, sorts imports alphabetically

**Styling (DaisyUI + Tailwind):**

- ✅ DaisyUI first for UI elements (`btn`, `modal`, `card`, `menu`, `kbd`, `badge`) and semantic colors (`bg-base-100`, `text-base-content`, `btn-primary`)
- ✅ Refer to the DaisyUI documentation for available modifiers and components
- ✅ Tailwind for layout (`flex`, `grid`, `gap-*`), positioning, spacing, transitions, and custom sizing
- ❌ Avoid raw Tailwind for things DaisyUI handles

**SolidJS Control Flow (Critical):**

- ✅ `<Show>` for conditionals, `<For>` for lists, `<Switch>`/`<Match>` for multiple conditions
- ❌ NEVER use ternaries for component rendering
- ❌ NEVER use `.map()` for rendering lists

**SolidJS Reactivity:**

- `createSignal` for primitive local state
- `createStore` for complex/nested objects
- `createMemo` for derived values (avoid inline computations in JSX)
- `createEffect` only for side effects, not derivations
- Signals called as functions in JSX: `{count()}` not `{count}`

**SolidJS Async & Error Handling:**

- Async boundaries wrapped with `<Suspense>`
- Error boundaries with `<ErrorBoundary>`
- Proper fallback components

**Router:**

- Route definitions in `src/routes.tsx`, centralized `routePaths` constant
- `useNavigate()` for programmatic, `<A>` for declarative navigation
- Feature-specific routes in `src/features/{name}/routes.ts(x)`

**Wails Bindings:**

- Frontend imports services from `@backend` path alias (→ `frontend/bindings/.../backend`)
- Type declarations in `src/backend.d.ts` (Wails generates `.js` bindings, needs manual `.d.ts`)
- Events from `@wailsio/runtime`: `Events.On()` returns unsubscribe function
- Shared types in `src/types/types.ts`, enums in `src/types/enums.ts`

### Backend (Go / Wails)

**File Naming:**

- Source: `snake_case.go`, tests: `snake_case_test.go`
- Exported types/functions: `PascalCase`, unexported: `camelCase`
- Avoid redundancy in package context (e.g. `process.Start` not `process.ProcessStart`)

**Structure:**

- Services as Go structs registered with Wails via `application.NewService()`
- One service per domain: `config_service.go`, `process_service.go`, `resource_service.go`, `file_service.go`, `app_service.go`
- Exported methods auto-generate TypeScript bindings via `wails3 generate bindings`
- Main → renderer streaming uses Wails events (`app.Event.Emit()`)

**Linting & Formatting:**

- `gofmt` for formatting (ships with Go, zero config)
- `golangci-lint` for linting (configured via `.golangci.yml`)
- Equivalent of `biome check --write`: `gofmt -w . && golangci-lint run --fix`

**Error Handling:**

- Wrap errors with context: `fmt.Errorf("starting process: %w", err)`
- Custom error types for known conditions, sentinel errors where appropriate
- Never panic except for genuine programming errors
- Handle errors at appropriate levels, don't catch everywhere

**Concurrency:**

- `context.Context` for cancellation and deadlines in blocking operations
- Channels for orchestration, `sync.Mutex`/`sync.RWMutex` for shared state
- Goroutine lifecycle management with proper cleanup (`defer`, `context`)
- Worker pools with bounded concurrency to prevent resource exhaustion

**Design:**

- Accept interfaces, return structs
- Keep interfaces small and single-purpose
- Functional options pattern for flexible API configuration
- Dependency injection via interfaces for testability
- Explicit over implicit — clarity trumps cleverness

**Testing:**

- `go test ./...` must pass, race detector: `go test -race ./...`
- Table-driven tests with subtests (`t.Run`)
- Mock external dependencies via interfaces
- Test fixtures in `testdata/` directories
