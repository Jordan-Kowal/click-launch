# TODO - Future Improvements

This document outlines planned improvements for Click-Launch. Each section contains enough context for implementation.

---

## 1. Split DashboardProvider into focused contexts

`DashboardProvider` is 542 lines handling YAML parsing, process state, polling, restart events, grouping, and resources. Split into smaller focused contexts.

## 2. Extract sub-components from ProcessLogDrawer

`ProcessLogDrawer` is 730 lines. Extract `LogSearch`, `LogControls`, and `LogList` sub-components.

## 3. Optimize log search with explicit on() dependencies

Search effect in `ProcessLogDrawer` runs on every log change. Use `on()` with explicit dependencies to reduce unnecessary re-runs.

## 4. Pick a better dark mode theme

Current dark theme is Dracula (custom-defined in `src/styles/index.css`). Evaluate other DaisyUI dark themes or improve the custom one for a better look.

---

## Post-Implementation Checklist

After completing a feature from this list, you **must** update the following files:

1. **This TODO.md file**
   - Remove the completed feature section entirely
   - Renumber remaining sections if necessary

2. **README.md** (Documentation)
   - Document the new feature in the appropriate section
   - Add configuration examples if the feature affects it

3. **CHANGELOG.md**
   - Add an entry under the appropriate version section
   - Follow the existing format
