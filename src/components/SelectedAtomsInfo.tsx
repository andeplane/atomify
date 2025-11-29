import { Button } from "antd";
import { Particles } from "omovi";
import { useMemo, useState, useEffect, useRef } from "react";
import { Data1D, PlotData } from "../types";
import Figure from "./Figure";

interface SelectedAtomsInfoProps {
  selectedAtoms: Set<number>;
  particles: Particles | undefined;
  timesteps: number;
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

interface TimeSeriesData {
  [key: string]: Data1D;
}

const SelectedAtomsInfo = ({
  selectedAtoms,
  particles,
  timesteps,
  onClearSelection,
}: SelectedAtomsInfoProps) => {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData>({});
  const [visiblePlot, setVisiblePlot] = useState<string | null>(null);
  const prevSelectedAtomsRef = useRef<Set<number>>(new Set());
  const prevTimestepsRef = useRef<number>(0);

  // Clear time-series data when selection changes
  useEffect(() => {
    const prevSelected = prevSelectedAtomsRef.current;
    const currentSelected = selectedAtoms;
    
    // Check if selection has changed (atoms added or removed)
    const selectionChanged = 
      prevSelected.size !== currentSelected.size ||
      Array.from(prevSelected).some(id => !currentSelected.has(id)) ||
      Array.from(currentSelected).some(id => !prevSelected.has(id));
    
    if (selectionChanged) {
      setTimeSeriesData({});
      prevSelectedAtomsRef.current = new Set(currentSelected);
    }
  }, [selectedAtoms]);

  // Track measurements over time
  useEffect(() => {
    if (!particles || selectedAtoms.size === 0 || selectedAtoms.size > 3) {
      return;
    }

    // Only update if timesteps have changed
    if (timesteps === prevTimestepsRef.current) {
      return;
    }
    prevTimestepsRef.current = timesteps;

    const selectedArray = Array.from(selectedAtoms).slice(0, 3);
    const atomIdToIndex = new Map<number, number>();
    particles.indices.forEach((atomId: number, arrayIndex: number) => {
      atomIdToIndex.set(atomId, arrayIndex);
    });

    const atomPositions: Array<{ id: number; position: [number, number, number] }> = [];
    for (const atomId of selectedArray) {
      const arrayIndex = atomIdToIndex.get(atomId);
      if (arrayIndex === undefined) continue;
      const position = particles.getPosition(arrayIndex);
      atomPositions.push({
        id: atomId,
        position: [position.x, position.y, position.z],
      });
    }

    if (atomPositions.length < 2) return;

    setTimeSeriesData((prev) => {
      const updated = { ...prev };

      // Track distances
      if (atomPositions.length === 2) {
        const key = `distance-${atomPositions[0].id}-${atomPositions[1].id}`;
        const distance = calculateDistance(atomPositions[0].position, atomPositions[1].position);
        
        if (!updated[key]) {
          updated[key] = { data: [], labels: ["Time", "Distance"] };
        }
        updated[key] = {
          ...updated[key],
          data: [...updated[key].data, [timesteps, distance]],
        };
      } else if (atomPositions.length === 3) {
        // Three distances
        const distKeys = [
          `distance-${atomPositions[0].id}-${atomPositions[1].id}`,
          `distance-${atomPositions[1].id}-${atomPositions[2].id}`,
          `distance-${atomPositions[0].id}-${atomPositions[2].id}`,
        ];
        const distances = [
          calculateDistance(atomPositions[0].position, atomPositions[1].position),
          calculateDistance(atomPositions[1].position, atomPositions[2].position),
          calculateDistance(atomPositions[0].position, atomPositions[2].position),
        ];

        distKeys.forEach((key, idx) => {
          if (!updated[key]) {
            updated[key] = { data: [], labels: ["Time", "Distance"] };
          }
          updated[key] = {
            ...updated[key],
            data: [...updated[key].data, [timesteps, distances[idx]]],
          };
        });

        // Three angles
        const angleKeys = [
          `angle-${atomPositions[1].id}-${atomPositions[0].id}-${atomPositions[2].id}`,
          `angle-${atomPositions[0].id}-${atomPositions[1].id}-${atomPositions[2].id}`,
          `angle-${atomPositions[0].id}-${atomPositions[2].id}-${atomPositions[1].id}`,
        ];
        const angles = [
          calculateAngle(atomPositions[1].position, atomPositions[0].position, atomPositions[2].position),
          calculateAngle(atomPositions[0].position, atomPositions[1].position, atomPositions[2].position),
          calculateAngle(atomPositions[0].position, atomPositions[2].position, atomPositions[1].position),
        ];

        angleKeys.forEach((key, idx) => {
          if (!updated[key]) {
            updated[key] = { data: [], labels: ["Time", "Angle"] };
          }
          updated[key] = {
            ...updated[key],
            data: [...updated[key].data, [timesteps, angles[idx]]],
          };
        });
      }

      return updated;
    });
  }, [particles, selectedAtoms, timesteps]);

  // Create a Map for O(1) atom ID to array index lookups
  const atomIdToIndex = useMemo(() => {
    if (!particles) return new Map<number, number>();
    const map = new Map<number, number>();
    particles.indices.forEach((atomId: number, arrayIndex: number) => {
      map.set(atomId, arrayIndex);
    });
    return map;
  }, [particles]);

  if (selectedAtoms.size === 0) {
    return null;
  }

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
      {atomData.length === 2 && (() => {
        const distanceKey = `distance-${atomData[0].atomId}-${atomData[1].atomId}`;
        const distance = calculateDistance(atomData[0].position, atomData[1].position);
        const hasData = timeSeriesData[distanceKey] && timeSeriesData[distanceKey].data.length > 0;
        
        return (
          <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.2)" }}>
            <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "5px" }}>
              Geometry
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "11px", lineHeight: "1.5" }}>
              {hasData ? (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setVisiblePlot(distanceKey)}
                  style={{ padding: 0, fontSize: "11px", height: "auto", fontFamily: "monospace" }}
                >
                  Distance: {distance.toFixed(3)} Å
                </Button>
              ) : (
                <span>Distance: {distance.toFixed(3)} Å</span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Distances and angles for 3 atoms */}
      {atomData.length === 3 && (() => {
        const distKeys = [
          `distance-${atomData[0].atomId}-${atomData[1].atomId}`,
          `distance-${atomData[1].atomId}-${atomData[2].atomId}`,
          `distance-${atomData[0].atomId}-${atomData[2].atomId}`,
        ];
        const angleKeys = [
          `angle-${atomData[1].atomId}-${atomData[0].atomId}-${atomData[2].atomId}`,
          `angle-${atomData[0].atomId}-${atomData[1].atomId}-${atomData[2].atomId}`,
          `angle-${atomData[0].atomId}-${atomData[2].atomId}-${atomData[1].atomId}`,
        ];
        
        return (
          <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.2)" }}>
            <div style={{ fontWeight: "bold", fontSize: "12px", marginBottom: "5px" }}>
              Geometry
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "11px" }}>
              <div style={{ lineHeight: "1.5" }}>
                {timeSeriesData[distKeys[0]]?.data.length > 0 ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setVisiblePlot(distKeys[0])}
                    style={{ padding: 0, fontSize: "11px", height: "auto", fontFamily: "monospace" }}
                  >
                    d({atomData[0].atomId}-{atomData[1].atomId}):{" "}
                    {calculateDistance(atomData[0].position, atomData[1].position).toFixed(3)} Å
                  </Button>
                ) : (
                  <span>
                    d({atomData[0].atomId}-{atomData[1].atomId}):{" "}
                    {calculateDistance(atomData[0].position, atomData[1].position).toFixed(3)} Å
                  </span>
                )}
              </div>
              <div style={{ lineHeight: "1.5" }}>
                {timeSeriesData[distKeys[1]]?.data.length > 0 ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setVisiblePlot(distKeys[1])}
                    style={{ padding: 0, fontSize: "11px", height: "auto", fontFamily: "monospace" }}
                  >
                    d({atomData[1].atomId}-{atomData[2].atomId}):{" "}
                    {calculateDistance(atomData[1].position, atomData[2].position).toFixed(3)} Å
                  </Button>
                ) : (
                  <span>
                    d({atomData[1].atomId}-{atomData[2].atomId}):{" "}
                    {calculateDistance(atomData[1].position, atomData[2].position).toFixed(3)} Å
                  </span>
                )}
              </div>
              <div style={{ lineHeight: "1.5" }}>
                {timeSeriesData[distKeys[2]]?.data.length > 0 ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setVisiblePlot(distKeys[2])}
                    style={{ padding: 0, fontSize: "11px", height: "auto", fontFamily: "monospace" }}
                  >
                    d({atomData[0].atomId}-{atomData[2].atomId}):{" "}
                    {calculateDistance(atomData[0].position, atomData[2].position).toFixed(3)} Å
                  </Button>
                ) : (
                  <span>
                    d({atomData[0].atomId}-{atomData[2].atomId}):{" "}
                    {calculateDistance(atomData[0].position, atomData[2].position).toFixed(3)} Å
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginTop: "5px" }}>
              <div style={{ fontFamily: "monospace", fontSize: "11px", lineHeight: "1.5" }}>
                {timeSeriesData[angleKeys[0]]?.data.length > 0 ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setVisiblePlot(angleKeys[0])}
                    style={{ padding: 0, fontSize: "11px", height: "auto", fontFamily: "monospace" }}
                  >
                    ∠{atomData[1].atomId}-{atomData[0].atomId}-{atomData[2].atomId}:{" "}
                    {calculateAngle(atomData[1].position, atomData[0].position, atomData[2].position).toFixed(1)}°
                  </Button>
                ) : (
                  <span>
                    ∠{atomData[1].atomId}-{atomData[0].atomId}-{atomData[2].atomId}:{" "}
                    {calculateAngle(atomData[1].position, atomData[0].position, atomData[2].position).toFixed(1)}°
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "11px", lineHeight: "1.5" }}>
                {timeSeriesData[angleKeys[1]]?.data.length > 0 ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setVisiblePlot(angleKeys[1])}
                    style={{ padding: 0, fontSize: "11px", height: "auto", fontFamily: "monospace" }}
                  >
                    ∠{atomData[0].atomId}-{atomData[1].atomId}-{atomData[2].atomId}:{" "}
                    {calculateAngle(atomData[0].position, atomData[1].position, atomData[2].position).toFixed(1)}°
                  </Button>
                ) : (
                  <span>
                    ∠{atomData[0].atomId}-{atomData[1].atomId}-{atomData[2].atomId}:{" "}
                    {calculateAngle(atomData[0].position, atomData[1].position, atomData[2].position).toFixed(1)}°
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "11px", lineHeight: "1.5" }}>
                {timeSeriesData[angleKeys[2]]?.data.length > 0 ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setVisiblePlot(angleKeys[2])}
                    style={{ padding: 0, fontSize: "11px", height: "auto", fontFamily: "monospace" }}
                  >
                    ∠{atomData[0].atomId}-{atomData[2].atomId}-{atomData[1].atomId}:{" "}
                    {calculateAngle(atomData[0].position, atomData[2].position, atomData[1].position).toFixed(1)}°
                  </Button>
                ) : (
                  <span>
                    ∠{atomData[0].atomId}-{atomData[2].atomId}-{atomData[1].atomId}:{" "}
                    {calculateAngle(atomData[0].position, atomData[2].position, atomData[1].position).toFixed(1)}°
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* Plot modals */}
      {visiblePlot && timeSeriesData[visiblePlot] && (() => {
        const getPlotName = (key: string): string => {
          if (key.startsWith("distance-")) {
            const ids = key.replace("distance-", "").split("-");
            return `Distance ${ids[0]}-${ids[1]}`;
          } else if (key.startsWith("angle-")) {
            const ids = key.replace("angle-", "").split("-");
            return `Angle ${ids[0]}-${ids[1]}-${ids[2]}`;
          }
          return key;
        };

        return (
          <Figure
            plotData={{
              data1D: timeSeriesData[visiblePlot],
              xLabel: "Time",
              yLabel: visiblePlot.startsWith("distance") ? "Distance (Å)" : "Angle (°)",
              name: getPlotName(visiblePlot),
            }}
            onClose={() => setVisiblePlot(null)}
          />
        );
      })()}
    </div>
  );
};

export default SelectedAtomsInfo;

