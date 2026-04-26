# Click-Launch — Architecture

High-level overview of how the app is wired together. For day-to-day code style, see `CLAUDE.md`. For commands and contributor setup, see `CONTRIBUTING.md`.

## Stack

| Layer    | Tech                                                 |
| -------- | ---------------------------------------------------- |
| Shell    | Wails v3 (alpha) — native macOS WebView host         |
| Backend  | Go 1.25, exposed to the renderer as Wails services   |
| Frontend | SolidJS + Vite, Tailwind CSS v4 + DaisyUI            |
| Build    | Task (`Taskfile.yml`), Bun for the JS workspace      |
| Quality  | Biome, `tsc`, `golangci-lint`, `govulncheck`, Vitest |

## Process model

```
┌────────────────────────────────────────────────────────┐
│ Wails main process (Go)                                │
│                                                        │
│   AppService     ConfigService    FileService          │
│   ProcessService                  ResourceService      │
│        │                │              │               │
│        └─── exec.Cmd ───┴── /proc/* ───┘               │
│                  │                                     │
│                  │  Wails Events (stdout/stderr,       │
│                  │  resource samples, lifecycle)       │
│                  ▼                                     │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Renderer (Solid)                                   │ │
│ │   Router → feature pages → components              │ │
│ │   Contexts: Settings, AppStorage, Version          │ │
│ │   useToast / useLocalStorage hooks                 │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

The renderer never spawns child processes itself — it asks `ProcessService` to start/stop them and listens for streamed events. All persistent app state lives either in localStorage (settings, recent files) or in the YAML configs the user edits.

## Backend services

Each service is a Go struct registered with Wails in `main.go`. Wails auto-generates TypeScript bindings into `frontend/bindings/` whenever `task generate` runs.

| Service           | Responsibility                                                                       |
| ----------------- | ------------------------------------------------------------------------------------ |
| `AppService`      | App version, resource paths, in-app updater (`InstallUpdate`)                        |
| `ConfigService`   | Validates YAML configs (`Validate`, `ExtractYamlConfig`); rich error paths           |
| `ProcessService`  | Starts, stops, restarts, and streams stdout/stderr for user-defined processes        |
| `ResourceService` | Samples CPU + RSS for running processes; streams to the chart layer (uplot)          |
| `FileService`     | File/folder I/O exposed to the renderer (open dialogs, read/write user-chosen paths) |

Patterns shared by all services:

- Exported methods only (Wails ignores unexported ones).
- Race-detected tests in `*_service_test.go`, table-driven with `t.Run`.
- External effects mocked behind small interfaces — see `process_service_test.go` for the pattern.

## Process lifecycle

```
user clicks "Start"
      │
      ▼
ProcessService.Start(cwd, command, restartConfig, env, envFile)
      │
      ├── resolves env (env_file + inline) and `~/$VAR` paths
      ├── spawns exec.Cmd with a process group so we can SIGTERM the tree
      ├── tee stdout/stderr → batched events (flushed every 100ms)
      └── on exit → emit lifecycle event; honour restartConfig
                    (max retries, delay, reset timeout)
```

Key invariants:

- One `cmd.Wait` goroutine per process — exit always emits exactly one lifecycle event.
- Stop is idempotent. `StopAll` is called from `ServiceShutdown` so processes don't survive the GUI.
- Streaming is batched, not per-line, to keep IPC cheap when a process is chatty.

## Frontend layout

```
src/
  App.tsx                — providers + ErrorBoundary + Router
  routes.tsx             — central route table + `routePaths` constant
  contexts/              — SettingsProvider, AppStorageProvider, VersionProvider
  hooks/                 — useLocalStorage, useToast, ...
  components/
    layout/              — shared layout chrome
    ui/                  — primitives (LoadingRing, ErrorFallback, ...)
  features/
    home/                — entry page; version status banner
    dashboard/           — main process table, log drawer, resource charts
    settings/            — settings modal
  utils/                 — versionCheck, formatters, ...
  styles/index.css       — Tailwind + DaisyUI plugin (themes: all)
```

Conventions:

- **Feature-first**: anything used by a single feature lives under `features/<name>/`. Promote to `src/<type>/` only when a second feature actually needs it.
- **Context pattern**: `XContext.ts` (types + `createContext`) + `XProvider.tsx` (provider + `useXContext` hook).
- **Control flow**: `<Show>`, `<For>`, `<Switch>/<Match>` — no ternaries or `.map()` for rendering.
- **Reactivity**: `createSignal` for primitives, `createStore` for nested objects, `createMemo` for derivations, `createEffect` only for true side effects.
- **Routing**: `routePaths` is the single source of truth; never hard-code path strings in components.

## Settings & storage

`SettingsProvider` reads/writes the JSON blob at localStorage key `app-settings`. The active theme is applied to `<html data-theme="...">`, and every DaisyUI theme is enabled via `themes: all` in `styles/index.css`.

`AppStorageProvider` holds non-settings UI state that should survive reloads (recent config, last selection, etc.).

## Update flow

1. `VersionProvider` calls `getLatestVersion()` once at mount and exposes `latestVersion`, `checked`, `checkFailed`, `isUpdateAvailable`.
2. `VersionStatus` (on the home page) renders one of four states based on the context.
3. On "Upgrade", we call `AppService.InstallUpdate(version)` which:
   - Shows a native confirmation dialog.
   - Downloads the version-pinned `update.sh` from GitHub raw.
   - Verifies the DMG's Apple Developer ID signature + Gatekeeper assessment.
   - Replaces the installed bundle, then relaunches.
   - Logs everything to `~/.click-launch/update.log`.

The update URL is pinned to a tag, never `releases/latest`, so the binary you signed for is the binary the user gets.

## Build & release

- **Local dev**: `task dev` runs `wails3 dev` against the Vite server (port `9245` by default, override with `WAILS_VITE_PORT`).
- **Local release**: `task release:local` reads `.env` for `SIGN_IDENTITY` + `NOTARY_PROFILE` and produces a signed + notarized DMG at `bin/ClickLaunch-dev.dmg`.
- **CI release**: `.github/workflows/build-and-release.yml` runs on GitHub release creation — calls `code-quality` first, then signs, notarizes, staples, and uploads the DMG to the release.

`scripts/check-ci-pins.sh` enforces that the Wails CLI, Task, and govulncheck versions wired into CI match the pins in `go.mod`. Drift fails `task lint`.

## Testing strategy

- **Backend (`task test`)** — race detector on, table-driven tests per service. Fixtures in `backend/testdata/`. Mock external dependencies via interfaces (see `ProcessService` tests).
- **Frontend (`bun run test`)** — Vitest in node mode for pure utilities and hooks. Component-rendering tests are not yet wired up; if added, switch the env to jsdom and bring in `@solidjs/testing-library`.
- **Quality gate** — `task check` runs lint + test + vuln. The `.githooks/pre-commit` hook also runs `task check`.

## Where to look first

| If you're touching...                   | Start here                                                 |
| --------------------------------------- | ---------------------------------------------------------- |
| Process lifecycle / log streaming       | `backend/process_service.go`, `process_service_test.go`    |
| YAML config schema / validation         | `backend/config_service.go`, `backend/types.go`            |
| Resource charts                         | `src/features/dashboard/components/ResourceChart.tsx`      |
| Update flow                             | `backend/app_service.go`, `src/contexts/VersionProvider.tsx` |
| Settings shape / theme list             | `src/contexts/SettingsContext.ts`                          |
| Adding a new Wails service              | `main.go`, then mirror `*_service.go` patterns             |
