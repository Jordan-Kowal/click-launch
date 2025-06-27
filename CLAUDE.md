# Instructions for Claude Code

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Persona

You are an expert in TypeScript, Node.js, React, Vite, Tailwind + DaisyUI, Wouter, and Electron.

## Generic

1. **Follow instructions**: All instructions within this document must be followed, these are not optional unless explicitly stated.
2. **Ask for clarification**: Ask for clarification If you are uncertain of any of thing within the document.
3. **Be succinct**: Do not waste tokens, be succinct and concise.
4. **Verify Information**: Always verify information before presenting it. Do not make assumptions or speculate without clear evidence.
5. **No Apologies**: Never use apologies.
6. **No Understanding Feedback**: Avoid giving feedback about understanding in comments or documentation.
7. **No Unnecessary Confirmations**: Don't ask for confirmation of information already provided in the context.
8. **No Implementation Checks**: Don't ask the user to verify implementations that are visible in the provided context.
9. **Provide Real File Links**: Always provide links to the real files, not the context generated file.
10. **No Current Implementation**: Don't show or discuss the current implementation unless specifically requested.
11. **Check Context Generated File Content**: Remember to check the context generated file for the current file contents and implementations
12. **No Summaries**: Don't summarize changes made.

## Code change

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

## Key Principles

- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Follow the existing project structure. If a component/hook/... is used by a single feature, it should be in its folder.
- Do not use SSR and Server-side components. This is a static frontend with no server-side.

## Electron Best Practices

- Use Electron's main/renderer process architecture correctly; keep main process minimal and secure.
- Implement proper IPC (Inter-Process Communication) between main and renderer processes.
- Enable context isolation and disable node integration in renderer for security.
- Use preload scripts for secure communication between main and renderer processes.
- Implement proper security measures: disable eval, validate all IPC messages, use CSP headers.
- Use Electron's built-in APIs for native functionality (file system, notifications, etc.).
- Optimize bundle size by excluding unnecessary Node.js modules from renderer.
- Implement proper window management and lifecycle handling.
- Use electron-builder or similar for packaging and distribution.
- Follow Electron's security checklist for production builds.

## Syntax and Formatting

- Use TypeScript for all code and prefer types to interfaces.
- Always use named exports for components, except for page components.
- Use the arrow functions for pure functions.
- Use curly braces for all conditionals. Favor simplicity over cleverness.
- Use declarative JSX.

## UI and Styling

- Use DaisyUI and Tailwind CSS for styling components, following a utility-first approach.
- Leverage daisyUI's pre-built components for quick UI development.
- Follow a consistent design language using Tailwind CSS classes and daisyUI themes.
- Ensure the design remains responsive.
- Optimize for accessibility (e.g., aria-attributes) when using components.

## Performance Optimization

- Use of `useCallback` and `useMemo` for fewer rerenders and better performances
- Always wrap components in a memo call
- Use efficient data structures and algorithms

## Dependencies

- React (main framework)
- Dayjs (for dates)
- DaisyUI + Tailwind (for styling)
- Vite (for building)
- Wouter (for routing)
- Electron (for desktop app packaging)
