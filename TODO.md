# TODO - Future Improvements

This document outlines planned improvements for Click-Launch. Each section contains enough context for implementation.

---

## Table of Contents

1. [Environment Variables UI](#1-environment-variables-ui)
2. [Log Export/Save](#2-log-exportsave)
3. [Keyboard Shortcuts Reference](#3-keyboard-shortcuts-reference)
4. [Process Grouping/Tags](#4-process-groupingtags)
5. [Settings/Preferences Panel](#5-settingspreferences-panel)
6. [Resource Monitoring](#6-resource-monitoring)

---

## 1. Environment Variables UI

**Priority:** Medium
**Complexity:** Medium
**Feature:** Display and manage environment variables in the UI

### User Story

As a developer, I want to see which environment variables are configured for each process and optionally add custom ones at runtime.

### Current State

Environment variables can be defined per process in `config.yml` via the `env` field. These are passed to the spawned process but are not visible in the UI.

### Proposed Enhancements

#### 1. Display configured env vars

- Show an indicator on `ProcessRow` when a process has custom env vars
- Add a tooltip or expandable section showing variable names (values hidden for security)
- Example: "3 env vars configured: NODE_ENV, DEBUG, API_URL"

#### 2. Runtime env var input (optional)

- Add a new argument type `env` that allows users to pass additional env vars at runtime
- These would be merged with the configured env vars (runtime takes precedence)
- UI: Key-value input field in the process arguments section

### Files to Modify

1. **`src/features/dashboard/components/ProcessRow.tsx`**
   - Add visual indicator for processes with env vars
   - Tooltip showing configured variable names

2. **`src/features/dashboard/components/ProcessEnvDisplay.tsx`** (new)
   - Component to display env var names in a tooltip or expandable section

3. **`electron/utils/extractYamlConfig.ts`** (if adding new arg type)
   - Add `ENV` to `ArgType` enum
   - Add validation for env arg type

---

## 2. Log Export/Save

**Priority:** High
**Complexity:** Low
**Feature:** Allow users to export process logs to a file

### User Story

As a developer, I want to export logs from a process so that I can share them with teammates or save them for later debugging.

### UI Design

Add an export button to the `ProcessLogDrawer` header, next to existing controls:

```
[Pause] [Clear] [Export ↓] [×]
```

Export options (via dropdown or modal):

- Export as `.txt` (plain text, ANSI codes stripped)
- Export as `.json` (structured with timestamps and log types)

### Implementation Details

#### Files to Modify

1. **`src/features/dashboard/components/ProcessLogDrawer.tsx`**
   - Add export button with Lucide `Download` icon
   - Implement export handler that calls IPC

2. **`src/electron/enums.ts`**
   - Add new channel: `DIALOG_SAVE_FILE = "dialog:saveFile"`

3. **`electron/main.ts`**
   - Add IPC handler for save file dialog
   - Use `dialog.showSaveDialog()` with filters for `.txt` and `.json`

4. **`electron/preload.ts`**
   - Expose `saveFileDialog()` method

5. **`src/electron/types.ts`**
   - Add type for save dialog options and result

#### Export Formats

**Plain Text (.txt):**

```
[2024-01-15 10:23:45] [stdout] Server starting on port 3000
[2024-01-15 10:23:46] [stdout] Database connected
[2024-01-15 10:23:47] [stderr] Warning: Deprecation notice...
```

**JSON (.json):**

```json
{
  "processName": "API Server",
  "command": "pnpm start --port 3000",
  "exportedAt": "2024-01-15T10:30:00Z",
  "logs": [
    {
      "timestamp": "2024-01-15T10:23:45Z",
      "type": "stdout",
      "message": "Server starting on port 3000"
    }
  ]
}
```

#### Helper Function

Create utility in `src/utils/logExport.ts`:

```typescript
export const formatLogsAsText = (logs: ProcessLog[], processName: string): string => { ... }
export const formatLogsAsJson = (logs: ProcessLog[], processName: string, command: string): string => { ... }
export const stripAnsiCodes = (text: string): string => { ... }
```

#### Default Filename

`{processName}-logs-{timestamp}.{ext}` (e.g., `api-server-logs-2024-01-15-103000.txt`)

---

## 3. Keyboard Shortcuts Reference

**Priority:** Medium
**Complexity:** Low
**Feature:** Display a modal showing all available keyboard shortcuts

### User Story

As a user, I want to see all available keyboard shortcuts so that I can work more efficiently without using the mouse.

### Current Shortcuts (to document)

- `Cmd/Ctrl + F` - Focus search in log drawer
- `Escape` - Close log drawer / Close modal
- `Enter` - Next search result (in log drawer)
- `Shift + Enter` - Previous search result (in log drawer)

### UI Design

- Trigger: `Cmd/Ctrl + ?` or `Cmd/Ctrl + /`
- Alternative: Help menu item "Keyboard Shortcuts"
- Modal with grouped shortcuts in a clean table format

### Implementation Details

#### Files to Create

1. **`src/components/ui/KeyboardShortcutsModal.tsx`**
   - Modal component displaying shortcuts in grouped sections
   - Sections: "General", "Log Drawer", "Navigation"
   - Render keyboard keys with styled `<kbd>` elements

#### Files to Modify

1. **`src/components/layout/BaseLayout.tsx`** or **`src/App.tsx`**
   - Add global keyboard listener for `Cmd/Ctrl + ?`
   - Manage modal open state

2. **`src/components/layout/NavBar.tsx`** (optional)
   - Add help icon button that opens the modal

3. **`src/index.css`** (if needed)
   - Style `<kbd>` elements to look like keyboard keys

#### Shortcuts Data Structure

```typescript
// src/constants/keyboardShortcuts.ts
export const KEYBOARD_SHORTCUTS = {
  general: [
    { keys: ['Cmd', '?'], description: 'Show keyboard shortcuts' },
    { keys: ['Cmd', 'O'], description: 'Open config file' },
  ],
  logDrawer: [
    { keys: ['Cmd', 'F'], description: 'Focus search' },
    { keys: ['Escape'], description: 'Close drawer' },
    { keys: ['Enter'], description: 'Next search result' },
    { keys: ['Shift', 'Enter'], description: 'Previous search result' },
  ],
  dashboard: [
    { keys: ['Cmd', 'Shift', 'S'], description: 'Stop all processes' },
  ],
};
```

#### Component Structure

```tsx
<Modal open={showShortcuts()} onClose={() => setShowShortcuts(false)}>
  <h2>Keyboard Shortcuts</h2>
  <For each={Object.entries(KEYBOARD_SHORTCUTS)}>
    {([section, shortcuts]) => (
      <section>
        <h3>{formatSectionName(section)}</h3>
        <For each={shortcuts}>
          {(shortcut) => (
            <div class="shortcut-row">
              <span class="keys">
                <For each={shortcut.keys}>
                  {(key) => <kbd>{key}</kbd>}
                </For>
              </span>
              <span class="description">{shortcut.description}</span>
            </div>
          )}
        </For>
      </section>
    )}
  </For>
</Modal>
```

---

## 4. Process Grouping/Tags

**Priority:** Medium
**Complexity:** Medium
**Feature:** Organize processes into collapsible groups for better organization

### User Story

As a developer with many processes, I want to organize them into groups (e.g., "Backend", "Frontend", "Infrastructure") so that I can manage related processes together.

### Configuration Schema

```yaml
processes:
  - name: "PostgreSQL"
    group: "Infrastructure"
    base_command: "docker compose up postgres"

  - name: "Redis"
    group: "Infrastructure"
    base_command: "docker compose up redis"

  - name: "API Server"
    group: "Backend"
    base_command: "pnpm start:api"

  - name: "Web App"
    group: "Frontend"
    base_command: "pnpm start:web"

  - name: "Standalone Process"  # No group - shows in "Other" or ungrouped
    base_command: "pnpm start:worker"
```

### Implementation Details

#### Files to Modify

1. **`electron/utils/extractYamlConfig.ts`**
   - Add optional `group: string` field to `ProcessConfig`
   - Validate group name (non-empty string if provided)

2. **`src/features/dashboard/contexts/DashboardContext.ts`**
   - Add helper to group processes: `getProcessesByGroup()`
   - Track collapsed state per group

3. **`src/features/dashboard/components/ProcessTable.tsx`**
   - Render processes grouped by their `group` field
   - Add collapsible group headers with expand/collapse toggle
   - Show process count per group
   - Add "Start Group" / "Stop Group" buttons on group headers

4. **`src/features/dashboard/components/ProcessGroupHeader.tsx`** (new)
   - Group header component with:
     - Group name
     - Process count (running/total)
     - Expand/collapse chevron
     - Start all / Stop all buttons for group

#### UI Behavior

- Groups are collapsible (click header to toggle)
- Collapsed state persists in localStorage
- Ungrouped processes appear in "Other" section or at the top
- Group order: alphabetical, with "Other" last
- Visual distinction between groups (subtle separator or background)

#### Group Header Design

```
▼ Infrastructure (2/3 running)              [▶ Start All] [■ Stop All]
  ├─ PostgreSQL                             [Running] [■]
  ├─ Redis                                  [Running] [■]
  └─ Elasticsearch                          [Stopped] [▶]

▶ Backend (0/2 running)                     [▶ Start All] [■ Stop All]
  (collapsed)
```

#### Data Structure

```typescript
type GroupedProcesses = {
  [groupName: string]: ProcessConfig[];
};

const groupProcesses = (processes: ProcessConfig[]): GroupedProcesses => {
  return processes.reduce((acc, process) => {
    const group = process.group || 'Other';
    acc[group] = acc[group] || [];
    acc[group].push(process);
    return acc;
  }, {} as GroupedProcesses);
};
```

---

## 5. Settings/Preferences Panel

**Priority:** Medium
**Complexity:** Medium
**Feature:** Add a settings page for configuring application behavior

### User Story

As a user, I want to customize application settings so that Click-Launch works the way I prefer.

### Settings to Include

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Log buffer size | number | 1500 | Max logs to keep per process |
| Status poll interval | number | 1000 | Process status check interval (ms) |
| Theme | select | "dark" | UI theme (dark/light/system) |
| Confirm on reload | boolean | true | Show confirmation when reloading config |
| Start minimized | boolean | false | Start app minimized to tray |
| Show notifications | boolean | true | Enable desktop notifications |

### Implementation Details

#### Files to Create

1. **`src/features/settings/`** (new feature folder)
   - `pages/Settings.tsx` - Settings page component
   - `routes.ts` - Route definition
   - `index.ts` - Barrel export

2. **`src/contexts/SettingsContext.ts`** and **`SettingsProvider.tsx`**
   - Store settings in context
   - Persist to localStorage
   - Provide typed getters and setters

3. **`src/constants/defaultSettings.ts`**
   - Default values and setting definitions

#### Files to Modify

1. **`src/routes.tsx`**
   - Add settings route: `/settings`

2. **`src/components/layout/NavBar.tsx`**
   - Add settings link/icon (Lucide `Settings` icon)

3. **`src/features/dashboard/contexts/DashboardContext.ts`**
   - Read log buffer size from settings
   - Read poll interval from settings

4. **`electron/main.ts`** (for app-level settings)
   - Handle start minimized option
   - Pass settings to relevant handlers

5. **`src/App.tsx`**
   - Wrap with `SettingsProvider`

#### Settings Page Layout

```
Settings
─────────────────────────────────────

Appearance
  Theme                    [Dark ▼]

Process Management
  Log buffer size          [1500___]
  Status poll interval     [1000___] ms

Behavior
  Confirm on reload        [✓]
  Start minimized          [ ]
  Show notifications       [✓]

─────────────────────────────────────
                    [Reset to Defaults]
```

#### Storage Schema

```typescript
type Settings = {
  appearance: {
    theme: 'dark' | 'light' | 'system';
  };
  processManagement: {
    logBufferSize: number;
    pollIntervalMs: number;
  };
  behavior: {
    confirmOnReload: boolean;
    startMinimized: boolean;
    showNotifications: boolean;
  };
};
```

#### Validation

- `logBufferSize`: min 100, max 10000
- `pollIntervalMs`: min 500, max 5000
- Invalid values reset to defaults

---

## 6. Resource Monitoring

**Priority:** Medium
**Complexity:** High
**Feature:** Display CPU and memory usage for each running process

### User Story

As a developer, I want to see resource usage for my processes so that I can identify memory leaks or CPU-intensive operations.

### UI Design

Add resource columns to the process table:

```
Name          Status    CPU    Memory    Runtime    Actions
─────────────────────────────────────────────────────────────
API Server    Running   12%    156 MB    00:15:32   [■] [📋]
Web App       Running   3%     89 MB     00:15:30   [■] [📋]
Database      Running   1%     512 MB    00:15:28   [■] [📋]
```

### Implementation Details

#### Files to Create

1. **`electron/utils/resourceMonitor.ts`**
   - Function to get CPU/memory for a process by PID
   - Use `process.cpuUsage()` for Electron process
   - For child processes: platform-specific approach

#### Platform-Specific Resource Collection

**macOS/Linux:**

```typescript
import { exec } from 'child_process';

const getProcessStats = (pid: number): Promise<{ cpu: number; memory: number }> => {
  return new Promise((resolve) => {
    // ps command returns CPU% and RSS (memory in KB)
    exec(`ps -p ${pid} -o %cpu,rss`, (error, stdout) => {
      if (error) {
        resolve({ cpu: 0, memory: 0 });
        return;
      }
      const lines = stdout.trim().split('\n');
      if (lines.length < 2) {
        resolve({ cpu: 0, memory: 0 });
        return;
      }
      const [cpu, rss] = lines[1].trim().split(/\s+/);
      resolve({
        cpu: parseFloat(cpu) || 0,
        memory: (parseInt(rss, 10) || 0) * 1024, // Convert KB to bytes
      });
    });
  });
};
```

#### Files to Modify

1. **`src/electron/enums.ts`**
   - Add `PROCESS_RESOURCES = "process:resources"` channel

2. **`electron/main.ts`**
   - Add IPC handler for resource queries
   - Batch resource queries for efficiency

3. **`electron/preload.ts`**
   - Expose `getProcessResources(pids: number[])` method

4. **`src/electron/types.ts`**
   - Add `ProcessResources` type: `{ cpu: number; memoryBytes: number }`

5. **`src/features/dashboard/contexts/DashboardContext.ts`**
   - Poll resources alongside status (or at slower interval)
   - Store resources in process state

6. **`src/features/dashboard/components/ProcessRow.tsx`**
   - Display CPU and memory columns
   - Format memory as human-readable (MB/GB)
   - Color-code high values (e.g., red if CPU > 80%)

7. **`src/utils/formatters.ts`** (new or extend existing)
   - `formatBytes(bytes: number): string` → "156 MB"
   - `formatCpu(percent: number): string` → "12%"

#### Polling Strategy

- Poll resources every 2-3 seconds (configurable in settings)
- Batch all running process PIDs in single query
- Only poll when dashboard is visible (pause when minimized)

#### Performance Considerations

- Resource monitoring adds overhead; make it toggleable
- Consider showing resources only on hover or in expanded view
- Cache values between polls to avoid flicker

---

## Implementation Priority

Suggested implementation order based on value and dependencies:

1. **Environment Variables UI** - Medium effort, completes env vars feature
2. **Log Export** - Low effort, frequently requested
3. **Keyboard Shortcuts Reference** - Low effort, improves discoverability
4. **Settings Panel** - Medium effort, enables other features
5. **Process Grouping** - Medium effort, helps larger projects
6. **Resource Monitoring** - High effort, nice to have

---

## Contributing

When implementing a feature:

1. Create a feature branch: `feature/{feature-name}`
2. Follow existing code patterns (see `CLAUDE.md`)
3. Add tests for new functionality

### Post-Implementation Checklist

After completing a feature from this list, you **must** update the following files:

1. **This TODO.md file**
   - Remove the completed feature section entirely
   - Update the Table of Contents to reflect the removal
   - Renumber remaining sections if necessary

2. **README.md** (Documentation)
   - Document the new feature in the appropriate section
   - Add configuration examples if the feature affects it

3. **CHANGELOG.md**
   - Add an entry under the appropriate version section
   - Follow the existing format
