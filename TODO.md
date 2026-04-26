# TODO - Future Improvements

This document outlines planned improvements for Click-Launch, ordered by impact/effort ratio (best bang for buck first).

---

## Features

Feature ideas worth implementing:

1. Per-feature error boundaries: Wrap each feature's root component in `<ErrorBoundary>` using the existing `ErrorFallback` component. Place boundaries in route definitions so each page catches its own errors independently, keeping the app shell intact.
2. Allow displaying logs of multiple processes simultaneously
3. Drag-and-drop process reordering: Allow reordering processes via drag and drop on the dashboard. With groups enabled: reorder groups relative to each other, and reorder processes within a group. Without groups: reorder the flat list freely. Persist the custom order in localStorage per project (keyed by config file path). Handle config changes gracefully — new processes appear at the end, removed processes are pruned from the saved order.
4. Worktree support: Add top-level `worktrees: [absolute paths]` and per-process `worktree: true` flag. Worktree-eligible processes expand (in Go, post-validation) to N+1 instances (root + each worktree), with auto-assigned group = path basename. Expanded name = `"<name> (<basename>)"`. Validation: worktree paths must be absolute, basenames unique across worktrees + root basename; `worktree: true` forbids `group` and requires a non-empty relative `cwd`; `worktrees` must be non-empty when any process is worktree-eligible. Schema additive (not breaking). Frontend grouping/state reused unchanged. Cross-worktree "launch everywhere" action deferred. Full spec: `docs/superpowers/specs/2026-04-19-worktrees-design.md`.

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
