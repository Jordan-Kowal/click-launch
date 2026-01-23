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
  assets/        # Static assets
  components/    # Shared components
    layout/      # Layout components
    ui/          # UI primitives (Button, LoadingRing, Modal, etc.)
  config/        # Configuration files
  contexts/      # Shared contexts
  electron/      # Electron-related types and utilities
  features/      # Feature-specific code
    home/        # Project selection and management
    dashboard/   # Process monitoring and control
  hooks/         # Shared hooks
  styles/        # Global styles
  types/         # Shared types
  utils/         # Shared utilities

electron/
  main.ts        # Electron main process
  preload.ts     # Preload script
  utils/         # Main process utilities
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

## Electron Best Practices

- Use Electron's main/renderer process architecture correctly; keep main process minimal and secure
- Implement proper IPC (Inter-Process Communication) between main and renderer processes
- Enable context isolation and disable node integration in renderer for security
- Use preload scripts for secure communication between main and renderer processes
- Implement proper security measures: disable eval, validate all IPC messages, use CSP headers
- Use Electron's built-in APIs for native functionality (file system, notifications, etc.)
- Optimize bundle size by excluding unnecessary Node.js modules from renderer
- Implement proper window management and lifecycle handling
- Use electron-builder or similar for packaging and distribution
- Follow Electron's security checklist for production builds

## UI and Styling

- Use DaisyUI and Tailwind CSS for styling components, following a utility-first approach
- Leverage daisyUI's pre-built components for quick UI development
- Follow a consistent design language using Tailwind CSS classes and daisyUI themes
- Ensure the design remains responsive
- Optimize for accessibility (e.g., aria-attributes) when using components

## Package Manager & Commands

- **Package Manager**: Use `pnpm` for all package management tasks (install, add, remove, etc.)
- **Commands**: Always lookup available commands in `package.json` scripts section before running any command

## Generic Guidelines

1. **Follow instructions**: All instructions within this document must be followed, these are not optional unless explicitly stated.
2. **Ask for clarification**: Ask for clarification if you are uncertain of anything within the document.
3. **Be succinct**: Do not waste tokens, be succinct and concise.
4. **Verify Information**: Always verify information before presenting it. Do not make assumptions or speculate without clear evidence.
5. **No Apologies**: Never use apologies.
6. **No Understanding Feedback**: Avoid giving feedback about understanding in comments or documentation.
7. **No Unnecessary Confirmations**: Don't ask for confirmation of information already provided in the context.
8. **No Implementation Checks**: Don't ask the user to verify implementations that are visible in the provided context.
9. **Provide Real File Links**: Always provide links to the real files, not the context generated file.
10. **No Current Implementation**: Don't show or discuss the current implementation unless specifically requested.
11. **Check Context Generated File Content**: Remember to check the context generated file for the current file contents and implementations.
12. **No Summaries**: Don't summarize changes made.

## Code Change Guidelines

1. **No fluff**: Do not edit more code than you have to.
2. **File-by-File Changes**: Make changes file by file and give me a chance to spot mistakes.
3. **No Whitespace Suggestions**: Don't suggest whitespace changes.
4. **Single Chunk Edits**: Provide all edits in a single chunk instead of multiple-step instructions or explanations for the same file.
5. **No Unnecessary Updates**: Don't suggest updates or changes to files when there are no actual modifications needed.
6. **Use Explicit Variable Names**: Prefer descriptive, explicit variable names over short, ambiguous ones to enhance code readability.
7. **Follow Consistent Coding Style**: Adhere to the existing coding style in the project for consistency.
8. **Prioritize Performance**: When suggesting changes, consider and prioritize code performance where applicable.
9. **Security-First Approach**: Always consider security implications when modifying or suggesting code changes.
10. **Test Coverage**: Suggest or include appropriate unit tests for new or modified code.
11. **Error Handling**: Implement robust error handling and logging where necessary.
12. **Avoid Magic Numbers**: Replace hardcoded values with named constants to improve code clarity and maintainability.
13. **Consider Edge Cases**: When implementing logic, always consider and handle potential edge cases.
14. **Use Assertions**: Include assertions wherever possible to validate assumptions and catch potential errors early.
15. **Use Route Constants**: Never hardcode route paths as strings. Always use the `routePaths` constant from the centralized routing configuration.
