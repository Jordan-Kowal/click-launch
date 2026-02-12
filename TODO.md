# TODO - Future Improvements

This document outlines planned improvements for Click-Launch, ordered by impact/effort ratio (best bang for buck first).

---

### 1. Individual Process Restart Button

**Impact: HIGH** | **Effort: LOW**

Add restart button to ProcessRow actions that stops then immediately restarts the process.

### 2. Optimize ProcessRow Reactivity

**Impact: HIGH** | **Effort: MEDIUM**

`ProcessRow.tsx` makes 9+ individual context calls creating separate reactive dependencies. Consolidate into single `createMemo(() => getProcessData(props.process.name))` to reduce recalculations on every status poll.

### 3. Log Level Filtering

**Impact: HIGH** | **Effort: MEDIUM**

Add ability to filter logs by level (info/warn/error). Detect log levels via patterns (INFO, WARN, ERROR) or ANSI colors. Add filter buttons to log drawer toolbar.

### 4. Handle Orphaned Processes on Unexpected App Exit

**Impact: HIGH** | **Effort: MEDIUM**

Processes spawn with `detached: true` in `electron/utils/processManager.ts`. If the Electron app crashes or gets force-killed, child processes keep running with no cleanup. Consider writing a PID file on process start (and removing on stop) so the app can detect and kill orphans on next launch.

### 5. Process Search/Filter in Main Table

**Impact: MEDIUM** | **Effort: LOW**

No way to filter processes by name when many are configured. Add search input above ProcessTable to filter by process name/group.

### 6. Export Logs to Clipboard

**Impact: MEDIUM** | **Effort: LOW**

Quick copy logs to clipboard (not just file export). Add "Copy to Clipboard" button next to export in log drawer toolbar.

### 7. Extract Duplicate Status Checks

**Impact: LOW** | **Effort: LOW**

Pattern `status === RUNNING || status === RESTARTING` repeated across components. Create `isProcessActive(status)` utility function.

### 8. Optimize Log Flush

**Impact: LOW** | **Effort: LOW**

`flushLogs` iterates through ALL processes even if only one has pending logs. Track which processes have pending logs in a Set, only iterate those.

### 9. Optimize Resource Monitoring

**Impact: MEDIUM** | **Effort: MEDIUM**

Currently executes one `ps` shell command per process every 3 seconds. Batch all PIDs into single `ps` command, parse results once.

### 10. Batch IPC Log Messages

**Impact: MEDIUM** | **Effort: MEDIUM**

Verbose processes send hundreds of individual IPC messages per second. Batch logs in main process (50-100ms window) before sending to renderer.

### 11. Consolidate ProcessDuration Timers

**Impact: MEDIUM** | **Effort: MEDIUM**

Each running process has its own `setInterval` (1s). With 10 processes = 10+ separate timers. Create single global 1-second interval in DashboardContext, expose `currentTime` signal that components derive from.

### 12. Extract Generic usePolling Hook

**Impact: MEDIUM** | **Effort: MEDIUM**

Nearly identical polling patterns in `useProcesses` and `useResources`. Create generic `usePolling<T>(fetchFn, interval, enabled)` hook.

### 13. Pick a Better Dark Mode Theme

**Impact: MEDIUM** | **Effort: MEDIUM**

Current dark theme is Dracula (custom-defined in `src/styles/index.css`). Evaluate other DaisyUI dark themes or improve the custom one for a better look.

### 14. Cache ANSI Parsing Results

**Impact: LOW** | **Effort: MEDIUM**

ANSI parsing happens on every log render (mitigated by virtualization). Pre-parse and cache segments when logs are added to store.

### 15. Historical Resource Graphs

**Impact: HIGH** | **Effort: HIGH**

Track CPU/memory usage over time and display in graphs. Store historical data points (last hour/day), add chart library (recharts/chart.js), create resource graph drawer.

### 16. Split Log View

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
