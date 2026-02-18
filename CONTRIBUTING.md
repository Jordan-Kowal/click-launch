# Contributing

## Prerequisites

- [Go 1.24+](https://go.dev/dl/)
- [Node.js 24+](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Wails v3](https://v3alpha.wails.io/) (`go install github.com/wailsapp/wails/v3/cmd/wails3@latest`)
- [Task](https://taskfile.dev/) (`go install github.com/go-task/task/v3/cmd/task@latest`)
- [golangci-lint](https://golangci-lint.run/)

## Setup

```shell
git config core.hooksPath .githooks
pnpm install
task dev
```

## Developer Commands

All commands go through [Task](https://taskfile.dev/) (see `Taskfile.yml`):

| Command             | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `task dev`          | Start app in development mode (Go backend + Vite frontend) |
| `task build`        | Production build                                           |
| `task package`      | Build + bundle into `.app`                                 |
| `task lint`         | Run all linters (biome, tsc, golangci-lint)                |
| `task test`         | Run all tests (Go)                                         |
| `task check`        | Run lint + test (used by pre-commit hook)                  |
| `task clean`        | Remove build artifacts                                     |
| `task version:bump` | Bump app version across all config files                   |

## CI/CD

We use GitHub Actions:

- [code-quality](.github/workflows/code-quality.yml): runs biome, tsc, Go tests, and golangci-lint
- [dependabot](.github/dependabot.yml): updates npm and Go dependencies monthly
- [build-and-release](.github/workflows/build-and-release.yml): builds and releases the application
