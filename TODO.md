# TODO - Future Improvements

This document outlines planned improvements for Click-Launch. Each section contains enough context for implementation.

---

## Table of Contents

1. [Environment Variables Support](#1-environment-variables-support)
2. [Log Export/Save](#2-log-exportsave)
3. [Process Auto-Restart](#3-process-auto-restart)
4. [Keyboard Shortcuts Reference](#4-keyboard-shortcuts-reference)
5. [Process Grouping/Tags](#5-process-groupingtags)
6. [Settings/Preferences Panel](#6-settingspreferences-panel)
7. [Resource Monitoring](#7-resource-monitoring)
8. [Working Directory Override](#8-working-directory-override)
9. [Notification on Process Exit](#9-notification-on-process-exit)
10. [Copy Log Line](#10-copy-log-line)

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

## 3. Process Auto-Restart

**Priority:** High
**Complexity:** Medium
**Feature:** Automatically restart processes that crash unexpectedly

### User Story

As a developer, I want my processes to automatically restart when they crash so that I don't have to manually monitor and restart them during development.

### Configuration Schema

```yaml
processes:
  - name: "Web Server"
    base_command: "pnpm dev"
    restart:
      enabled: true
      max_retries: 3        # Max consecutive restart attempts (default: 3)
      delay_ms: 1000        # Delay before restart in ms (default: 1000)
      reset_after_ms: 30000 # Reset retry counter after successful run (default: 30000)
```

### Implementation Details

#### Files to Modify

1. **`electron/utils/extractYamlConfig.ts`**
   - Add `RestartConfig` type
   - Add optional `restart` field to `ProcessConfig`
   - Validate restart configuration values

2. **`electron/utils/processManager.ts`**
   - Track restart state per process: `{ retryCount, lastExitTime, isRestarting }`
   - On process exit with non-zero code:
     - Check if restart is enabled and retries remaining
     - Schedule restart after `delay_ms`
     - Increment retry counter
   - Reset retry counter if process runs longer than `reset_after_ms`
   - Emit restart events to renderer

3. **`src/electron/enums.ts`**
   - Add `PROCESS_RESTART = "process-restart"` channel

4. **`electron/main.ts`**
   - Handle restart logic and emit events to renderer
   - Pass restart config to process manager

5. **`src/features/dashboard/contexts/DashboardContext.ts`**
   - Track restart state in process store
   - Listen for restart events
   - Update UI to show "Restarting..." status

6. **`src/features/dashboard/components/ProcessRow.tsx`**
   - Show restart indicator/badge when auto-restart is enabled
   - Display retry count (e.g., "Restarting (2/3)")

7. **`src/features/dashboard/enums.ts`**
   - Add `RESTARTING` to `ProcessStatus` enum

#### Restart Logic

```typescript
const handleProcessExit = (processId: string, exitCode: number) => {
  const config = getRestartConfig(processId);
  const state = restartState.get(processId);

  if (!config?.enabled || exitCode === 0) return; // Don't restart clean exits
  if (state.retryCount >= config.max_retries) {
    emit('restart-failed', { processId, reason: 'max_retries_exceeded' });
    return;
  }

  state.retryCount++;
  setTimeout(() => {
    restartProcess(processId);
  }, config.delay_ms);
};
```

#### Edge Cases

- User manually stops process → don't auto-restart
- Process exits with code 0 → don't auto-restart (clean exit)
- App quit requested → don't restart, stop all gracefully
- Config reload while restarting → cancel pending restart

---

## 4. Keyboard Shortcuts Reference

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

## 5. Process Grouping/Tags

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

## 6. Settings/Preferences Panel

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

## 7. Resource Monitoring

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

## 8. Working Directory Override

**Priority:** Medium
**Complexity:** Low
**Feature:** Allow per-process working directory configuration

### User Story

As a developer with a monorepo, I want to set different working directories for each process so that I can run commands from the correct package folder.

### Configuration Schema

```yaml
processes:
  - name: "API Server"
    base_command: "pnpm dev"
    cwd: "./packages/api"  # Relative to config file location

  - name: "Web App"
    base_command: "pnpm dev"
    cwd: "./packages/web"

  - name: "Root Process"
    base_command: "pnpm lint"
    # No cwd - uses config file directory (current behavior)
```

### Implementation Details

#### Files to Modify

1. **`electron/utils/extractYamlConfig.ts`**
   - Add optional `cwd: string` field to `ProcessConfig`
   - Validate cwd is a valid relative or absolute path
   - No validation that path exists (validated at runtime)

2. **`electron/main.ts`** (IPC handler for `process:start`)
   - Resolve `cwd` relative to config file directory
   - Pass resolved `cwd` to process manager
   - If path doesn't exist, return error before starting

3. **`electron/utils/processManager.ts`**
   - Update `start()` to accept `cwd` parameter
   - Pass to `spawn()` options: `{ cwd: resolvedCwd }`

4. **`src/features/dashboard/contexts/DashboardContext.ts`**
   - Store `cwd` in process state
   - Pass to IPC when starting

5. **`src/features/dashboard/components/ProcessRow.tsx`** (optional)
   - Show cwd in tooltip or expanded view

#### Path Resolution

```typescript
import path from 'path';

const resolveProcessCwd = (
  configDir: string,
  processCwd: string | undefined
): string => {
  if (!processCwd) return configDir;
  if (path.isAbsolute(processCwd)) return processCwd;
  return path.resolve(configDir, processCwd);
};
```

#### Error Handling

- If `cwd` directory doesn't exist at start time:
  - Return error: `"Working directory not found: ./packages/api"`
  - Don't start the process
  - Show error in UI

#### Test Cases

```typescript
// In extractYamlConfig.test.ts
- Config with relative cwd
- Config with absolute cwd
- Config without cwd (should be valid)
- Config with cwd containing ".." (should be valid)
```

---

## 9. Notification on Process Exit

**Priority:** Low
**Complexity:** Low
**Feature:** Show desktop notification when a process exits unexpectedly

### User Story

As a developer, I want to be notified when a process crashes so that I can quickly address the issue, even if Click-Launch is minimized.

### Notification Types

| Event | Notification |
|-------|--------------|
| Process crashed (non-zero exit) | "API Server crashed with exit code 1" |
| Process killed by signal | "API Server was killed (SIGKILL)" |
| Process started (optional) | "API Server started" |

### Implementation Details

#### Files to Modify

1. **`electron/main.ts`**
   - Import `Notification` from Electron
   - On process exit event, show notification if enabled
   - Check if app is focused; only notify if in background

2. **`electron/utils/processManager.ts`**
   - Emit detailed exit event with code and signal
   - Include process name in event

3. **`src/contexts/SettingsContext.ts`** (if settings panel implemented)
   - Add `showNotifications` setting
   - Add `notifyOnStart` setting (optional)

#### Notification Implementation

```typescript
import { Notification, BrowserWindow } from 'electron';

const showProcessNotification = (
  processName: string,
  exitCode: number | null,
  signal: string | null
) => {
  // Don't notify if window is focused
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow?.isFocused()) return;

  // Don't notify for clean exits
  if (exitCode === 0) return;

  let body: string;
  if (signal) {
    body = `${processName} was killed (${signal})`;
  } else {
    body = `${processName} crashed with exit code ${exitCode}`;
  }

  const notification = new Notification({
    title: 'Process Exited',
    body,
    icon: getResourcePath('logo.png'),
  });

  notification.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  notification.show();
};
```

#### Notification Click Behavior

- Click notification → bring Click-Launch to foreground
- Click notification → optionally open log drawer for that process

#### macOS Considerations

- Notifications require app to be signed or have proper entitlements
- Test notification permissions in development

---

## 10. Copy Log Line

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
6. **Notification on Process Exit** - Low effort, useful for background monitoring
7. **Settings Panel** - Medium effort, enables other features
8. **Process Grouping** - Medium effort, helps larger projects
9. **Process Auto-Restart** - Medium effort, power user feature
10. **Resource Monitoring** - High effort, nice to have

---

## Contributing

When implementing a feature:

1. Create a feature branch: `feature/{feature-name}`
2. Follow existing code patterns (see `CLAUDE.md`)
3. Add tests for new functionality
4. Update this TODO to mark the feature as complete
5. Submit a PR with screenshots/recordings if UI changes
