# TODO - Future Improvements

This document outlines planned improvements for Click-Launch. Each section contains enough context for implementation.

---

## Table of Contents

1. [Environment Variables Support](#1-environment-variables-support)
2. [Log Export/Save](#2-log-exportsave)
3. [Keyboard Shortcuts Reference](#3-keyboard-shortcuts-reference)
4. [Process Grouping/Tags](#4-process-groupingtags)
5. [Settings/Preferences Panel](#5-settingspreferences-panel)
6. [Resource Monitoring](#6-resource-monitoring)
7. [Copy Log Line](#7-copy-log-line)

---

## 1. Environment Variables Support

**Priority:** High
**Complexity:** Medium
**Feature:** Allow users to define custom environment variables per process in `config.yml`

### User Story

As a developer, I want to set environment variables for each process so that I can configure different environments (dev/staging) without modifying my application code.

### Configuration Schema

Extend the process configuration to support an optional `env` field:

```yaml
processes:
  - name: "API Server"
    base_command: "pnpm start"
    env:
      NODE_ENV: development
      DEBUG: "api:*"
      DATABASE_URL: "postgres://localhost:5432/mydb"
      API_KEY: "dev-key-12345"
```

### Implementation Details

#### Files to Modify

1. **`electron/utils/extractYamlConfig.ts`**
   - Update `ProcessConfig` type to include optional `env: Record<string, string>`
   - Add validation for `env` field (must be object with string values)
   - Ensure env keys are valid (no spaces, valid shell variable names)

2. **`electron/main.ts`** (IPC handler for `process:start`)
   - Pass environment variables to `processManager.start()`
   - Merge with existing `process.env` (user vars take precedence)

3. **`electron/utils/processManager.ts`**
   - Update `start()` function signature to accept `env` parameter
   - Pass to `spawn()` options: `{ env: { ...process.env, ...customEnv } }`

4. **`src/features/dashboard/contexts/DashboardContext.ts`**
   - Store `env` in process state
   - Pass to IPC when starting process

5. **`src/features/dashboard/components/ProcessRow.tsx`** (optional enhancement)
   - Add visual indicator when process has custom env vars
   - Tooltip showing configured variables (values hidden for security)

#### Validation Rules

- `env` field is optional
- If present, must be an object
- All keys must be non-empty strings matching `/^[A-Z_][A-Z0-9_]*$/i`
- All values must be strings (numbers should be quoted in YAML)

#### Test Cases to Add

```typescript
// In extractYamlConfig.test.ts
- Valid config with env variables
- Invalid env key (contains spaces)
- Invalid env value (non-string)
- Empty env object (should be valid)
```

#### Security Considerations

- Never log environment variable values (may contain secrets)
- Consider adding `.env` file support in future iteration

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

## 7. Copy Log Line

**Priority:** Low
**Complexity:** Low
**Feature:** Allow copying individual log lines or the full command

### User Story

As a developer, I want to quickly copy log lines or the process command so that I can share them or use them in other contexts.

### UI Design

#### Option A: Right-click context menu

Right-click on a log line shows:

- "Copy line"
- "Copy line (without timestamp)"
- "Copy all visible logs"

#### Option B: Hover action button

On hover, show a small copy icon on the right side of each log line.

#### Command Copy

Add copy button next to the command display in the log drawer header.

### Implementation Details

#### Files to Modify

1. **`src/features/dashboard/components/ProcessLogDrawer.tsx`**
   - Add copy button next to command display
   - Implement copy to clipboard functionality

2. **`src/features/dashboard/components/LogLine.tsx`** (may need to create)
   - Extract log line into separate component
   - Add hover state with copy button
   - Or add right-click context menu

3. **`src/utils/clipboard.ts`** (new)
   - Utility for clipboard operations
   - Handle copy with fallback for older browsers

#### Clipboard Implementation

```typescript
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
};
```

#### Log Line Component

```tsx
const LogLine = (props: { log: ProcessLog; onCopy: () => void }) => {
  const [showCopy, setShowCopy] = createSignal(false);

  return (
    <div
      class="log-line"
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      <span class="timestamp">{formatTimestamp(props.log.timestamp)}</span>
      <span class="message" innerHTML={parseAnsi(props.log.message)} />
      <Show when={showCopy()}>
        <button
          class="copy-btn"
          onClick={() => {
            copyToClipboard(props.log.message);
            toast.success('Copied to clipboard');
          }}
        >
          <Copy size={14} />
        </button>
      </Show>
    </div>
  );
};
```

#### Toast Feedback

Show brief toast notification on successful copy:

- "Copied to clipboard"
- "Command copied"

Use existing `solid-toast` integration.

---

## Implementation Priority

Suggested implementation order based on value and dependencies:

1. **Working Directory Override** - Simple, high value for monorepo users
2. **Environment Variables** - High value, enables more use cases
3. **Log Export** - Low effort, frequently requested
4. **Keyboard Shortcuts Reference** - Low effort, improves discoverability
5. **Copy Log Line** - Low effort, quality of life
6. **Settings Panel** - Medium effort, enables other features
7. **Process Grouping** - Medium effort, helps larger projects
8. **Resource Monitoring** - High effort, nice to have

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
   - Update the "Implementation Priority" section accordingly

2. **README.md** (Documentation)
   - Document the new feature in the appropriate section
   - Add configuration examples if the feature affects `config.yml`
   - Update screenshots if UI has changed significantly

3. **CHANGELOG.md**
   - Add an entry under the appropriate version section
   - Follow the existing format: `- feat: description of the new feature`
   - If CHANGELOG.md doesn't exist, create it following [Keep a Changelog](https://keepachangelog.com/) format
