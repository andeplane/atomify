import { Button } from "antd";
import { Particles } from "omovi";
import { useMemo } from "react";

interface SelectedAtomsInfoProps {
  selectedAtoms: Set<number>;
  particles: Particles | undefined;
  onClearSelection: () => void;
}

interface AtomData {
  atomId: number;
  position: [number, number, number];
}

// Calculate distance between two points
const calculateDistance = (p1: [number, number, number], p2: [number, number, number]): number => {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

// Calculate angle between three points (angle at p2)
const calculateAngle = (
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number]
): number => {
  // Vectors from p2 to p1 and p3
  const v1 = [p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]];
  const v2 = [p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]];
  
  // Dot product
  const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  
  // Magnitudes
  const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]);
  const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2]);
  
  // Angle in radians, then convert to degrees
  const cosAngle = dot / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
};

const SelectedAtomsInfo = ({
  selectedAtoms,
  particles,
  onClearSelection,
}: SelectedAtomsInfoProps) => {
  if (selectedAtoms.size === 0) {
    return null;
  }

  // Create a Map for O(1) atom ID to array index lookups
  const atomIdToIndex = useMemo(() => {
    if (!particles) return new Map<number, number>();
    const map = new Map<number, number>();
    particles.indices.forEach((atomId: number, arrayIndex: number) => {
      map.set(atomId, arrayIndex);
    });
    return map;
  }, [particles]);

  // Get atom data for selected atoms
  // Note: Not memoized because particle positions update frequently during simulation
  const getAtomData = (): AtomData[] => {
    if (!particles) return [];

    const data: AtomData[] = [];
    const selectedArray = Array.from(selectedAtoms).slice(0, 3); // Only show first 3

    for (const atomId of selectedArray) {
      // Find array index for this atom ID using O(1) Map lookup
      const arrayIndex = atomIdToIndex.get(atomId);
      if (arrayIndex === undefined) continue;

      const position = particles.getPosition(arrayIndex);
      
      data.push({
        atomId,
        position: [position.x, position.y, position.z],
      });
    }

    return data;
  };

  const atomData = getAtomData();

  return (
    <div className="selected-atoms-info">
      <div style={{ fontWeight: "bold", marginBottom: "10px", fontSize: "14px" }}>
        Selected Atoms ({selectedAtoms.size})
      </div>

      {atomData.map((atom) => (
        <div key={atom.atomId} style={{ marginBottom: "10px", fontSize: "12px" }}>
          <div style={{ fontWeight: "bold" }}>Atom {atom.atomId}</div>
          <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
            Position: ({atom.position[0].toFixed(2)}, {atom.position[1].toFixed(2)},{" "}
            {atom.position[2].toFixed(2)})
          </div>
        </div>
      ))}

      {selectedAtoms.size > 3 && (
        <div style={{ fontSize: "12px", fontStyle: "italic", marginBottom: "10px" }}>
          + {selectedAtoms.size - 3} more atoms selected
        </div>
      )}

      {/* Distance for 2 atoms */}
      {atomData.length === 2 && (
        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.2)" }}>
          <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "5px" }}>
            Geometry
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
            Distance: {calculateDistance(atomData[0].position, atomData[1].position).toFixed(3)} Å
          </div>
        </div>
      )}

      {/* Distances and angles for 3 atoms */}
      {atomData.length === 3 && (
        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.2)" }}>
          <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "5px" }}>
            Geometry
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
            d({atomData[0].atomId}-{atomData[1].atomId}):{" "}
            {calculateDistance(atomData[0].position, atomData[1].position).toFixed(3)} Å
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
            d({atomData[1].atomId}-{atomData[2].atomId}):{" "}
            {calculateDistance(atomData[1].position, atomData[2].position).toFixed(3)} Å
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
            d({atomData[0].atomId}-{atomData[2].atomId}):{" "}
            {calculateDistance(atomData[0].position, atomData[2].position).toFixed(3)} Å
          </div>
          <div style={{ marginTop: "5px" }}>
            <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
              ∠{atomData[1].atomId}-{atomData[0].atomId}-{atomData[2].atomId}:{" "}
              {calculateAngle(atomData[1].position, atomData[0].position, atomData[2].position).toFixed(1)}°
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
              ∠{atomData[0].atomId}-{atomData[1].atomId}-{atomData[2].atomId}:{" "}
              {calculateAngle(atomData[0].position, atomData[1].position, atomData[2].position).toFixed(1)}°
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
              ∠{atomData[0].atomId}-{atomData[2].atomId}-{atomData[1].atomId}:{" "}
              {calculateAngle(atomData[0].position, atomData[2].position, atomData[1].position).toFixed(1)}°
            </div>
          </div>
        </div>
      )}

      <Button
        size="small"
        onClick={onClearSelection}
        style={{ marginTop: "10px", width: "100%" }}
      >
        Clear Selection (Esc)
      </Button>
      
      <div style={{ fontSize: "11px", fontStyle: "italic", color: "rgba(255, 255, 255, 0.6)", marginTop: "8px", textAlign: "center" }}>
        Hold shift to select more particles
      </div>
    </div>
  );
};

export default SelectedAtomsInfo;

