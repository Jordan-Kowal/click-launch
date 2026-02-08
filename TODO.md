# TODO - Future Improvements

This document outlines planned improvements for Click-Launch. Each section contains enough context for implementation.

---

## Table of Contents

1. [Environment Variables UI](#1-environment-variables-ui)
2. [Log Export/Save](#2-log-exportsave)
3. [Settings/Preferences Panel](#3-settingspreferences-panel)

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

## 3. Settings/Preferences Panel

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

## Implementation Priority

Suggested implementation order based on value and dependencies:

1. **Environment Variables UI** - Medium effort, completes env vars feature
2. **Log Export** - Low effort, frequently requested
3. **Settings Panel** - Medium effort, enables other features

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
