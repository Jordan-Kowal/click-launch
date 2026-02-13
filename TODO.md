# TODO - Future Improvements

This document outlines planned improvements for Click-Launch, ordered by impact/effort ratio (best bang for buck first).

---

### 1. Individual Process Restart Button

**Impact: HIGH** | **Effort: LOW**

Add restart button to ProcessRow actions that stops then immediately restarts the process.

### 2. Optimize ProcessRow Reactivity

**Impact: HIGH** | **Effort: MEDIUM**

`ProcessRow.tsx` makes 7 individual context accessor calls (`getProcessCommand`, `getProcessArgs`, `getProcessEnv`, `getProcessStatus`, `getProcessStartTime`, `getProcessData`, `getProcessResources`), each creating separate reactive dependencies on the same underlying store. Consolidate into single `createMemo(() => getProcessData(props.process.name))` to reduce redundant store tracking on every status poll.

### 3. Log Level Filtering

**Impact: HIGH** | **Effort: MEDIUM**

Add ability to filter logs by level (info/warn/error). Detect log levels via patterns (INFO, WARN, ERROR) or ANSI colors. Add filter buttons to log drawer toolbar.

### 4. Handle Orphaned Processes on Unexpected App Exit

**Impact: HIGH** | **Effort: MEDIUM**

Processes spawn with `detached: true` in `electron/utils/processManager.ts`. If the Electron app crashes or gets force-killed, child processes keep running with no cleanup. Consider writing a PID file on process start (and removing on stop) so the app can detect and kill orphans on next launch.

### 5. Process Search/Filter in Main Table

**Impact: LOW** | **Effort: LOW**

Add search input above ProcessTable to filter by process name/group. Note: the grouping feature already addresses most of this need for typical configs (5-15 processes). This becomes more valuable at scale (15+ processes).

### 6. Optimize Resource Monitoring

**Impact: MEDIUM** | **Effort: MEDIUM**

Currently executes one `ps` shell command per process every 3 seconds. Batch all PIDs into single `ps` command, parse results once.

### 7. Consolidate ProcessDuration Timers

**Impact: MEDIUM** | **Effort: MEDIUM**

Each running process has its own `setInterval` (1s). With 10 processes = 10+ separate timers. Create single global 1-second interval in DashboardContext, expose `currentTime` signal that components derive from.

### 8. Pick a Better Dark Mode Theme

**Impact: MEDIUM** | **Effort: MEDIUM**

Current dark theme is a custom Dracula variant (modified hue in `src/styles/index.css`). Evaluate DaisyUI 5's built-in dark themes (night, abyss, dim, coffee, etc.) or improve the custom one for a better look.

### 9. Cache ANSI Parsing Results

**Impact: LOW** | **Effort: MEDIUM**

`ProcessLogRow` memoizes ANSI parsing via `createMemo`, but virtualization destroys and recreates row components on scroll, causing re-parsing every time a log row re-enters the viewport. Pre-parse and cache segments when logs are added to the store so parsed results survive component mount/unmount cycles.

### 10. Historical Resource Graphs

**Impact: HIGH** | **Effort: HIGH**

Track CPU/memory usage over time and display in graphs. Store historical data points (last hour/day), add chart library (recharts/chart.js), create resource graph drawer.

### 11. Split Log View

**Impact: MEDIUM** | **Effort: HIGH**

Monitor multiple processes simultaneously. Split screen layout with 2-4 log drawers, or multi-select processes to combine logs with process name prefix.

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
