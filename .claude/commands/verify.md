# Verify Code Quality

Run the quality checks before committing:

```bash
pnpm biome:check && pnpm tsc && go test ./backend/... && golangci-lint run
```

If all checks pass, the code is ready to commit.
