# TODO - Future Improvements

This document outlines planned improvements for Click-Launch, ordered by impact/effort ratio (best bang for buck first).

---

## Features

Feature ideas worth implementing:

1. Allow displaying logs of multiple processes simultaneously
2. Feat: Drag-and-drop process reordering: Allow reordering processes via drag and drop on the dashboard. With groups enabled: reorder groups relative to each other, and reorder processes within a group. Without groups: reorder the flat list freely. Persist the custom order in localStorage per project (keyed by config file path). Handle config changes gracefully — new processes appear at the end, removed processes are pruned from the saved order.
3. Fix: emptying the logs should empty the search bar
4. Feat: Only show active processes (on the dashboard)
5. Update deps

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
