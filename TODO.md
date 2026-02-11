# TODO - Future Improvements

This document outlines planned improvements for Click-Launch. Each section contains enough context for implementation.

---

## Performance Optimizations

### 1. Optimize ProcessRow Reactivity
**Impact: HIGH** | **Effort: MEDIUM**

`ProcessRow.tsx` makes 9+ individual context calls creating separate reactive dependencies. Consolidate into single `createMemo(() => getProcessData(props.process.name))` to reduce recalculations on every status poll.

**Location:** `src/features/dashboard/components/ProcessRow.tsx`

### 7. Consolidate ProcessDuration Timers
**Impact: MEDIUM** | **Effort: MEDIUM**

Each running process has its own `setInterval` (1s). With 10 processes = 10+ separate timers. Create single global 1-second interval in DashboardContext, expose `currentTime` signal that components derive from.

### 9. Batch IPC Log Messages
**Impact: MEDIUM** | **Effort: MEDIUM**

Verbose processes send hundreds of individual IPC messages per second. Batch logs in main process (50-100ms window) before sending to renderer.

**Location:** `electron/main.ts`

### 10. Optimize Resource Monitoring
**Impact: MEDIUM** | **Effort: MEDIUM**

Currently executes one `ps` shell command per process every 3 seconds. Batch all PIDs into single `ps` command, parse results once.

**Location:** `electron/utils/resourceMonitor.ts`

### 14. Cache ANSI Parsing Results
**Impact: LOW** | **Effort: MEDIUM**

ANSI parsing happens on every log render (mitigated by virtualization). Pre-parse and cache segments when logs are added to store.

**Location:** `src/utils/ansiToHtml.ts`, `src/features/dashboard/hooks/useProcesses.ts`

### 17. Optimize Log Flush
**Impact: LOW** | **Effort: LOW**

`flushLogs` iterates through ALL processes even if only one has pending logs. Track which processes have pending logs in a Set, only iterate those.

**Location:** `src/features/dashboard/components/ProcessLogDrawer.tsx`

---

## Refactoring

### 8. Extract Generic usePolling Hook
**Impact: MEDIUM** | **Effort: MEDIUM**

Nearly identical polling patterns in `useProcesses` and `useResources`. Create generic hook:
```typescript
const usePolling = <T>(
  fetchFn: () => Promise<T>,
  interval: number,
  enabled: () => boolean
) => { /* ... */ }
```

**Locations:**
- `src/features/dashboard/hooks/useProcesses.ts`
- `src/features/dashboard/hooks/useResources.ts`

### 13. Extract Duplicate Status Checks
**Impact: LOW** | **Effort: LOW**

Pattern `status === RUNNING || status === RESTARTING` repeated across components. Create `isProcessActive(status)` utility function.

**Location:** Create `src/utils/processStatus.ts`

---

## New Features

### 4. Individual Process Restart Button
**Impact: HIGH** | **Effort: LOW**

Add restart button to ProcessRow actions that stops then immediately restarts the process.

**Location:** `src/features/dashboard/components/ProcessRow.tsx`

### 11. Process Search/Filter in Main Table
**Impact: MEDIUM** | **Effort: LOW**

No way to filter processes by name when many are configured. Add search input above ProcessTable to filter by process name/group.

**Location:** `src/features/dashboard/pages/Dashboard.tsx`

### Feature 4. Historical Resource Graphs
**Impact: HIGH** | **Effort: HIGH**

Track CPU/memory usage over time and display in graphs. Store historical data points (last hour/day), add chart library (recharts/chart.js), create resource graph drawer.

### Feature 5. Log Level Filtering
**Impact: HIGH** | **Effort: MEDIUM**

Add ability to filter logs by level (info/warn/error). Detect log levels via patterns (INFO, WARN, ERROR) or ANSI colors. Add filter buttons to log drawer toolbar.

### Feature 8. Split Log View
**Impact: MEDIUM** | **Effort: HIGH**

Monitor multiple processes simultaneously. Split screen layout with 2-4 log drawers, or multi-select processes to combine logs with process name prefix.

### Feature 10. Export Logs to Clipboard
**Impact: MEDIUM** | **Effort: LOW**

Quick copy logs to clipboard (not just file export). Add "Copy to Clipboard" button next to export in log drawer toolbar.

---

## Existing Items

### Extract sub-components from ProcessLogDrawer

`ProcessLogDrawer` is 730 lines. Extract `LogSearch`, `LogControls`, and `LogList` sub-components.

### Pick a better dark mode theme

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
