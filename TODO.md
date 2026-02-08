# TODO - Future Improvements

This document outlines planned improvements for Click-Launch. Each section contains enough context for implementation.

---

## Table of Contents

1. [Settings/Preferences Panel](#1-settingspreferences-panel)

---

## 1. Settings/Preferences Panel

**Priority:** Medium
**Complexity:** Medium
**Feature:** Add a settings page for configuring application behavior

### User Story

As a user, I want to customize application settings so that Click-Launch works the way I prefer.

### Settings to Include

| Setting              | Type   | Default                          | Description                                  |
| -------------------- | ------ | -------------------------------- | -------------------------------------------- |
| Log buffer size      | number | 1500                             | Max logs to keep per process                 |
| Log export directory | path   | `{configDir}/logs/click-launch/` | Directory where exported log files are saved |
| Theme                | select | "dark"                           | UI theme (dark/light/system)                 |
| Show notifications   | boolean | true                            | Enable desktop notifications                 |

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

4. **`src/App.tsx`**
   - Wrap with `SettingsProvider`

#### Settings Page Layout

```
Settings
─────────────────────────────────────

Appearance
  Theme                    [Dark ▼]

Process Management
  Log buffer size          [1500___]
  Log export directory     [~/logs/click-launch/] [Browse]

Notifications
  Show notifications       [✓]

─────────────────────────────────────
                    [Reset to Defaults]
```

#### Storage Schema

```typescript
type Settings = {
  appearance: {
    theme: "dark" | "light" | "system";
  };
  processManagement: {
    logBufferSize: number;
    logExportDirectory: string;
  };
  notifications: {
    showNotifications: boolean;
  };
};
```

#### Validation

- `logBufferSize`: min 100, max 10000
- `logExportDirectory`: must be a valid directory path; use Electron's `dialog.showOpenDialog` for folder selection
- Invalid values reset to defaults

---

## Implementation Priority

Suggested implementation order based on value and dependencies:

1. **Settings Panel** - Medium effort, enables other features

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
