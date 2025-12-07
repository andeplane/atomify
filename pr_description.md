## Overview
Adds a wireframe visualization of the simulation box boundaries to help users better understand the spatial extent of their simulation.

## Changes

### New Feature: Simulation Box Wireframe
- Added `showSimulationBox` setting to render settings (default: enabled)
- Created `boxGeometry.ts` utility to generate wireframe from LAMMPS cell matrix
- Wireframe uses white cylinders with adaptive thickness based on box size

### UI Components Updated
- **Settings.tsx**: Added checkbox to toggle simulation box visibility
- **SimulationSummary.tsx**: Added simulation box toggle to quick settings table
- **View.tsx**: Added Three.js rendering logic for box wireframe with proper lifecycle management

### Implementation Details
- Supports both orthogonal and triclinic (non-orthogonal) simulation boxes
- Dynamically calculates edge radius (0.15% of average box dimension, min 0.1)
- Proper memory management: disposes of geometries and materials when removed
- Handles matrix transposition correctly for LAMMPS cell matrix format
- Robust edge orientation using quaternions with validation

## Benefits
- ✅ Better spatial awareness of simulation boundaries
- ✅ Works with all box types (orthogonal and triclinic)
- ✅ Adaptive sizing ensures visibility across different scales
- ✅ User-controllable via settings panel or simulation summary

## Testing
- ✅ Tested with orthogonal boxes
- ✅ Tested with triclinic boxes
- ✅ Verified proper cleanup on unmount
- ✅ Confirmed toggle works from both UI locations
