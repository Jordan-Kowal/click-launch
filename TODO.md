# TODO - Future Improvements

This document outlines planned improvements for Click-Launch, ordered by impact/effort ratio (best bang for buck first).

---

## Features

Feature ideas worth implementing:

1. Add frontend tests: Add `vitest` + `@solidjs/testing-library`. Focus on hooks with business logic (`useLogStore`, `useProcesses`, `useGrouping`) rather than UI components. Mock Wails bindings via simple object stubs.
2. Bindings sync check: Add a Task command that runs `wails3 generate bindings` then `bun run tsc --noEmit`, and hook it into `task check` so CI catches `backend.d.ts` drift.
3. Refactor mutable ref in DashboardProvider: Replace the `let onProcessStarted` mutable ref pattern with a shared signal (e.g., a counter signal) that `useProcesses` writes to and `useResources` watches via `createEffect`, making the inter-hook communication fully reactive.
4. Allow displaying logs of multiple processes simultaneously
5. Drag-and-drop process reordering: Allow reordering processes via drag and drop on the dashboard. With groups enabled: reorder groups relative to each other, and reorder processes within a group. Without groups: reorder the flat list freely. Persist the custom order in localStorage per project (keyed by config file path). Handle config changes gracefully — new processes appear at the end, removed processes are pruned from the saved order.

---

## Post-Implementation Checklist

After completing an item from this list, you **must** update the following files:

1. **This TODO.md file**
   - Remove the completed section entirely
   - Renumber remaining sections if necessary

2. **README.md** (Documentation)
   - Document the new feature in the appropriate section
   - Add configuration examples if the feature affects it

3. **CHANGELOG.md**
   - Add an entry under the appropriate version section
   - Follow the existing format
