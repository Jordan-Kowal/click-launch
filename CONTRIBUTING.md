# Contributing

## Setup

Simply setup the githooks, install the dependencies, and start the application.

```shell
git config core.hooksPath .githooks
pnpm install
pnpm start
```

## QA

We use `vitest` for testing (on both electron and react) and `biome` as our all-in-one linter and type checker.

- `pnpm quality` runs both `biome` and `tsc`
- `pnpm test` runs the tests
- `pnpm test:coverage` runs the tests with coverage

## CI/CD

For the CI, we rely on GitHub actions.

- [code-quality](.github/workflows/code-quality.yml): runs `biome`, `tsc`, and `vitest`
- [dependabot](.github/dependabot.yml): Updates the dependencies every month
- [build-and-release](.github/workflows/build-and-release.yml): Builds the application and releases it
