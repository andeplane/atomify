# Simulation Edit Storage Feature

## Overview

This feature adds localStorage support for storing simulation file edits, allowing users to make changes to simulation files and restore them to their original state when needed.

## Implementation Details

### New Files Created

1. **`src/utils/simulationEditStorage.ts`**
   - Utility module for managing simulation edits in localStorage
   - Stores original file contents and tracks edits
   - Provides functions to save, restore, and check for edits

### Modified Files

2. **`src/store/simulation.ts`**
   - Added new thunks: `storeFileEdit`, `restoreOriginalFile`, `loadStoredEdits`
   - Integrated storage utility into simulation lifecycle
   - Automatically stores original files when a simulation is loaded
   - Loads existing edits when simulation is opened

3. **`src/containers/Edit.tsx`**
   - Added "Restore Original" button that appears when file has edits
   - Tracks edit state and updates localStorage on file changes
   - Visual indicator shows when files have been modified

## How It Works

### Storage Structure

The localStorage uses keys with the format: `simulation_edits_{simulationId}`

Each entry contains:
```json
{
  "originalFiles": { "filename.in": "original content..." },
  "editedFiles": { "filename.in": "edited content..." },
  "lastModified": 1234567890
}
```

### User Experience

1. **When a simulation is loaded:**
   - Original file contents are automatically stored in localStorage
   - Any existing edits are loaded and applied to the simulation

2. **When editing files:**
   - Changes are automatically saved to localStorage
   - A "Restore Original" button appears in the top-right corner of the editor

3. **When restoring:**
   - User clicks "Restore Original" button
   - File content is restored to its original state
   - Edit is removed from localStorage
   - Button disappears

### Key Features

- **Automatic Storage**: No manual save required - edits are stored as you type
- **Per-Simulation Storage**: Each simulation has its own edit storage
- **Restore Original**: Easy one-click restoration to original content
- **Visual Feedback**: Button appears only when file has been edited
- **Persistent**: Edits survive browser refresh and app restarts

## API Reference

### SimulationEditStorageUtils

- `storeOriginalFiles(simulationId, files)` - Store original file contents
- `storeEditedFile(simulationId, fileName, content)` - Store an edit
- `restoreOriginalFile(simulationId, fileName)` - Restore to original
- `hasEdits(simulationId, fileName)` - Check if file has edits
- `getAllEditedFiles(simulationId)` - Get all edited files
- `clearAllEdits(simulationId)` - Clear all edits for a simulation

### Store Actions

- `storeFileEdit({ fileName, content })` - Store a file edit
- `restoreOriginalFile(fileName)` - Restore a file to original
- `loadStoredEdits()` - Load existing edits for current simulation

## Usage Example

```typescript
// Check if file has edits
const hasEdits = SimulationEditStorageUtils.hasEdits(simulationId, fileName);

// Store an edit
SimulationEditStorageUtils.storeEditedFile(simulationId, fileName, newContent);

// Restore original
const originalContent = SimulationEditStorageUtils.restoreOriginalFile(simulationId, fileName);
```

## Storage Cleanup

The system automatically manages storage cleanup:
- Edits are removed when restored to original
- Storage is per-simulation, so different simulations don't interfere
- No automatic cleanup of old simulations (could be added as future enhancement)

## Browser Compatibility

Uses standard localStorage API, compatible with all modern browsers.
Storage limit is typically 5-10MB per domain, sufficient for simulation files.