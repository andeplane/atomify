import { useMemo } from "react";
import { useStoreState } from "./index";
import { getDistanceUnitSymbol } from "../utils/parsers";

/**
 * Hook to get the distance unit symbol based on the current LAMMPS unit system
 * @returns The distance unit symbol (e.g., "Å", "σ", "m", "cm", etc.)
 */
export const useLammpsUnits = (): string => {
  const lammps = useStoreState((state) => state.simulation.lammps);

  return useMemo(() => {
    if (!lammps) {
      return "Å"; // Default to Angstroms if LAMMPS is not available
    }

    const unitStyle = lammps.getUnits();
    return getDistanceUnitSymbol(unitStyle);
  }, [lammps]);
};
