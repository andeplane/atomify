import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import type { ReactNode, CSSProperties } from "react";
import type { State, Actions } from "easy-peasy";
import View from "./View";
import { useStoreState, useStoreActions } from "../hooks";
import { useEmbeddedMode } from "../hooks/useEmbeddedMode";
import type { EmbeddedModeResult } from "../hooks/useEmbeddedMode";
import * as THREE from "three";
import { Visualizer, type ParticleClickEvent } from "omovi";
import type { StoreModel } from "../store/model";
import type { Compute, Fix, Variable, Wall } from "../types";
import type Modifier from "../modifiers/modifier";

// Mock omovi: prevents WebGL/canvas errors in jsdom
vi.mock("omovi", () => ({
  Visualizer: vi.fn(),
  Particles: vi.fn(),
  Bonds: vi.fn(),
}));

// Mock hooks: allows flexible per-test control of store state and actions
vi.mock("../hooks", () => ({
  useStoreState: vi.fn(),
  useStoreActions: vi.fn(),
}));

// Mock useEmbeddedMode: controls embed configuration per test
vi.mock("../hooks/useEmbeddedMode", () => ({
  useEmbeddedMode: vi.fn(),
}));

// Mock THREE.js: prevents canvas rendering errors in jsdom
vi.mock("three", () => ({
  Group: vi.fn(() => ({ traverse: vi.fn(), parent: null })),
  Mesh: class {},
  Material: class {},
  Box3: vi.fn(),
  Vector3: vi.fn(),
  Color: class {},
}));

// Mock box/wall geometry utilities: avoids THREE.js geometry construction
vi.mock("../utils/boxGeometry", () => ({
  createBoxGeometry: vi.fn(() => ({ traverse: vi.fn(), parent: null })),
  calculateBoxRadius: vi.fn(() => 1),
  getSimulationBoxBounds: vi.fn(() => ({})),
}));

vi.mock("../utils/wallGeometry", () => ({
  createWallGroup: vi.fn(() => ({ traverse: vi.fn(), parent: null })),
}));

// Mock metrics: prevents mixpanel/localStorage side effects from track()
vi.mock("../utils/metrics", () => ({
  track: vi.fn(),
}));

// Mock child components: reduces render complexity and dependency surface
vi.mock("../components/ResponsiveSimulationSummary", () => ({
  default: () => <div data-testid="responsive-simulation-summary" />,
}));

vi.mock("../components/SelectedAtomsInfo", () => ({
  default: ({ onClearSelection }: { onClearSelection: () => void }) => (
    <button data-testid="clear-selection" onClick={onClearSelection}>
      Clear
    </button>
  ),
}));

vi.mock("../components/ColorLegend", () => ({
  default: () => <div data-testid="color-legend" />,
}));

vi.mock("../modifiers/ColorModifierSettings", () => ({
  default: () => <div data-testid="color-modifier-settings" />,
}));

// Mock antd: uses a simplified DOM structure; Layout.Header is a static property
vi.mock("antd", () => {
  const LayoutBase = ({
    children,
    style,
  }: {
    children?: ReactNode;
    style?: CSSProperties;
  }) => <div style={style}>{children}</div>;

  const Header = ({
    children,
    className,
    style,
  }: {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
  }) => (
    <div className={className} style={style}>
      {children}
    </div>
  );

  const LayoutMock = Object.assign(LayoutBase, { Header });

  return {
    Layout: LayoutMock,
    Row: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Col: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Progress: () => <div data-testid="progress" />,
    Modal: ({
      children,
      open,
      title,
      footer,
    }: {
      children?: ReactNode;
      open?: boolean;
      onCancel?: () => void;
      title?: ReactNode;
      footer?: ReactNode;
    }) =>
      open ? (
        <div data-testid="no-simulation-modal">
          <div data-testid="modal-title">{title}</div>
          {children}
          <div data-testid="modal-footer">{footer}</div>
        </div>
      ) : null,
    Button: ({
      children,
      onClick,
    }: {
      children?: ReactNode;
      onClick?: () => void;
    }) => (
      <button data-testid="modal-ok-button" onClick={onClick}>
        {children}
      </button>
    ),
  };
});

// --- Shared mutable state (updated in beforeEach; closures capture by reference) ---
let mockState: ReturnType<typeof createDefaultMockState>;
let mockActions: ReturnType<typeof createDefaultMockActions>;

describe("View", () => {
  beforeEach(() => {
    mockState = createDefaultMockState();
    mockActions = createDefaultMockActions();

    vi.mocked(useStoreState).mockImplementation(
      (selector) => selector(mockState as unknown as State<StoreModel>),
    );
    vi.mocked(useStoreActions).mockImplementation(
      (selector) => selector(mockActions as unknown as Actions<StoreModel>),
    );
    vi.mocked(useEmbeddedMode).mockReturnValue(createDefaultEmbedModeResult());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // P0: Auto-clear selection on simulation change
  // ---------------------------------------------------------------------------
  describe("P0: Auto-clear selection on simulation change", () => {
    it("should call clearSelection on initial mount", () => {
      // Arrange
      const mockVisualizer = mockState.render.visualizer!;

      // Act
      render(<View visible={true} />);

      // Assert: the auto-clear effect fires once on mount
      expect(mockVisualizer.clearSelection).toHaveBeenCalled();
    });

    it("should call clearSelection again when simulation value changes", () => {
      // Arrange: start with no simulation
      mockState.simulation.simulation = null;
      const mockVisualizer = mockState.render.visualizer!;
      const { rerender } = render(<View visible={true} />);

      const callsAfterMount = mockVisualizer.clearSelection.mock.calls.length;

      // Act: change simulation to a new value
      mockState.simulation.simulation = { id: "sim1" };
      vi.mocked(useStoreState).mockImplementation(
        (selector) => selector(mockState as unknown as State<StoreModel>),
      );
      rerender(<View visible={true} />);

      // Assert: clearSelection called at least once more
      expect(mockVisualizer.clearSelection.mock.calls.length).toBeGreaterThan(
        callsAfterMount,
      );
    });

    it("should call clearSelection when simulation changes from one to another", () => {
      // Arrange: start with sim1
      mockState.simulation.simulation = { id: "sim1" };
      const mockVisualizer = mockState.render.visualizer!;
      const { rerender } = render(<View visible={true} />);

      const callsAfterFirstRender =
        mockVisualizer.clearSelection.mock.calls.length;

      // Act: switch to sim2
      mockState.simulation.simulation = { id: "sim2" };
      vi.mocked(useStoreState).mockImplementation(
        (selector) => selector(mockState as unknown as State<StoreModel>),
      );
      rerender(<View visible={true} />);

      // Assert
      expect(mockVisualizer.clearSelection.mock.calls.length).toBeGreaterThan(
        callsAfterFirstRender,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // P1: Escape key behavior
  // ---------------------------------------------------------------------------
  describe("P1: Escape key behavior", () => {
    it("should NOT call clearSelection when Escape is pressed with no atoms selected", () => {
      // Arrange
      const mockVisualizer = mockState.render.visualizer!;
      render(<View visible={true} />);

      const callsAfterMount = mockVisualizer.clearSelection.mock.calls.length;

      // Act: press Escape with selectedAtoms still empty (initial state)
      act(() => {
        fireEvent.keyDown(window, { key: "Escape" });
      });

      // Assert: no additional clearSelection call
      expect(mockVisualizer.clearSelection.mock.calls.length).toBe(
        callsAfterMount,
      );
    });

    it("should call clearSelection when Escape is pressed with atoms selected", () => {
      // Arrange: provide null visualizer so the component creates one,
      // capturing the onParticleClick callback to simulate a selection.
      let capturedOnParticleClick:
        | ((event: ParticleClickEvent) => void)
        | undefined;
      const mockVisualizerInstance = createMockVisualizerInstance();

      // Use a regular function (not arrow) so it can be called with `new`
      vi.mocked(Visualizer).mockImplementation(
        function (
          this: unknown,
          options?: ConstructorParameters<typeof Visualizer>[0],
        ) {
          capturedOnParticleClick = options?.onParticleClick;
          // Update mockState immediately to prevent infinite re-creation loop
          mockState.render.visualizer = mockVisualizerInstance;
          return mockVisualizerInstance as unknown as Visualizer;
        },
      );

      mockState.render.visualizer = null;

      render(<View visible={true} />);

      // onParticleClick should now be captured from the Visualizer constructor
      expect(capturedOnParticleClick).toBeDefined();

      // Simulate a particle click to add atom 5 to selectedAtoms
      act(() => {
        capturedOnParticleClick!({ particleIndex: 5, shiftKey: false, position: new THREE.Vector3(0, 0, 0) });
      });

      // Record calls before Escape (onParticleClick also calls clearSelection internally)
      const callsBeforeEscape =
        mockVisualizerInstance.clearSelection.mock.calls.length;

      // Act: press Escape — selectedAtoms.size > 0, so handleClearSelection fires
      act(() => {
        fireEvent.keyDown(window, { key: "Escape" });
      });

      // Assert: at least one more clearSelection call from the Escape handler
      expect(
        mockVisualizerInstance.clearSelection.mock.calls.length,
      ).toBeGreaterThan(callsBeforeEscape);
    });
  });

  // ---------------------------------------------------------------------------
  // P1: No simulation modal in embedded mode
  // ---------------------------------------------------------------------------
  describe("P1: No simulation modal in embedded mode", () => {
    it("should NOT show the no-simulation modal when isEmbeddedMode is true", () => {
      // Arrange: simulation is null (would normally trigger the modal)
      mockState.simulation.simulation = null;

      // Act
      render(<View visible={true} isEmbeddedMode={true} />);

      // Assert: modal not rendered
      expect(
        screen.queryByTestId("no-simulation-modal"),
      ).not.toBeInTheDocument();
    });

    it("should show the no-simulation modal when not embedded and simulation is null", () => {
      // Arrange
      mockState.simulation.simulation = null;

      // Act
      render(<View visible={true} isEmbeddedMode={false} />);

      // Assert
      expect(screen.getByTestId("no-simulation-modal")).toBeInTheDocument();
    });

    it("should NOT show the modal when simulation exists", () => {
      // Arrange
      mockState.simulation.simulation = { id: "sim1" };

      // Act
      render(<View visible={true} isEmbeddedMode={false} />);

      // Assert
      expect(
        screen.queryByTestId("no-simulation-modal"),
      ).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // P2: showAnalyze localStorage persistence
  // ---------------------------------------------------------------------------
  describe("P2: showAnalyze localStorage persistence", () => {
    let mockLocalStorage: Record<string, string>;

    beforeEach(() => {
      mockLocalStorage = {};
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(
        (key) => mockLocalStorage[key] ?? null,
      );
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(
        (key, value) => {
          mockLocalStorage[key] = value;
        },
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should read showAnalyze from localStorage on mount", () => {
      // Arrange: pre-populate localStorage
      mockLocalStorage["simulationSummaryDrawerVisible"] = "true";

      // Act
      render(<View visible={true} />);

      // Assert: getItem was called with the persistence key
      expect(Storage.prototype.getItem).toHaveBeenCalledWith(
        "simulationSummaryDrawerVisible",
      );
    });

    it("should persist showAnalyze to localStorage when not in embedded mode", () => {
      // Act
      render(<View visible={true} isEmbeddedMode={false} />);

      // Assert: setItem called with the persistence key
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        "simulationSummaryDrawerVisible",
        expect.any(String),
      );
    });

    it("should NOT write showAnalyze to localStorage when in embedded mode", () => {
      // Arrange
      vi.mocked(useEmbeddedMode).mockReturnValue({
        ...createDefaultEmbedModeResult(),
        isEmbeddedMode: true,
        embedConfig: {
          showSimulationSummary: true,
          showSimulationBox: true,
          enableCameraControls: true,
          enableParticlePicking: true,
        },
      });

      // Act
      render(<View visible={true} isEmbeddedMode={true} />);

      // Assert: setItem NOT called with the drawer visibility key
      expect(Storage.prototype.setItem).not.toHaveBeenCalledWith(
        "simulationSummaryDrawerVisible",
        expect.any(String),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // P2: embedConfig.showSimulationSummary overrides
  // ---------------------------------------------------------------------------
  describe("P2: embedConfig.showSimulationSummary overrides", () => {
    it("should NOT render ResponsiveSimulationSummary when embedded and showSimulationSummary=false", () => {
      // Arrange
      vi.mocked(useEmbeddedMode).mockReturnValue({
        ...createDefaultEmbedModeResult(),
        embedConfig: {
          showSimulationSummary: false,
          showSimulationBox: true,
          enableCameraControls: true,
          enableParticlePicking: true,
        },
      });

      // Act
      render(<View visible={true} isEmbeddedMode={true} />);

      // Assert
      expect(
        screen.queryByTestId("responsive-simulation-summary"),
      ).not.toBeInTheDocument();
    });

    it("should render ResponsiveSimulationSummary when embedded and showSimulationSummary=true", () => {
      // Arrange
      vi.mocked(useEmbeddedMode).mockReturnValue({
        ...createDefaultEmbedModeResult(),
        embedConfig: {
          showSimulationSummary: true,
          showSimulationBox: true,
          enableCameraControls: true,
          enableParticlePicking: true,
        },
      });

      // Act
      render(<View visible={true} isEmbeddedMode={true} />);

      // Assert
      expect(
        screen.getByTestId("responsive-simulation-summary"),
      ).toBeInTheDocument();
    });

    it("should render ResponsiveSimulationSummary in non-embedded mode regardless of embedConfig", () => {
      // Arrange: embedConfig says false, but non-embedded ignores it
      vi.mocked(useEmbeddedMode).mockReturnValue({
        ...createDefaultEmbedModeResult(),
        embedConfig: {
          showSimulationSummary: false,
          showSimulationBox: true,
          enableCameraControls: true,
          enableParticlePicking: true,
        },
      });

      // Act
      render(<View visible={true} isEmbeddedMode={false} />);

      // Assert: non-embedded always shows the summary
      expect(
        screen.getByTestId("responsive-simulation-summary"),
      ).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // P2: visualizer.idle toggled by visible prop
  // ---------------------------------------------------------------------------
  describe("P2: visualizer.idle toggled by visible prop", () => {
    it("should set visualizer.idle=false when visible=true", () => {
      // Arrange
      const mockVisualizer = mockState.render.visualizer!;
      mockVisualizer.idle = true;

      // Act
      render(<View visible={true} />);

      // Assert
      expect(mockVisualizer.idle).toBe(false);
    });

    it("should set visualizer.idle=true when visible=false", () => {
      // Arrange
      const mockVisualizer = mockState.render.visualizer!;
      mockVisualizer.idle = false;

      // Act
      render(<View visible={false} />);

      // Assert
      expect(mockVisualizer.idle).toBe(true);
    });

    it("should update visualizer.idle when visible prop changes", () => {
      // Arrange
      const mockVisualizer = mockState.render.visualizer!;
      const { rerender } = render(<View visible={true} />);
      expect(mockVisualizer.idle).toBe(false);

      // Act: hide
      rerender(<View visible={false} />);

      // Assert
      expect(mockVisualizer.idle).toBe(true);

      // Act: show again
      rerender(<View visible={true} />);

      // Assert
      expect(mockVisualizer.idle).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

function createMockVisualizerInstance() {
  return {
    clearSelection: vi.fn(),
    setSelected: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    dispose: vi.fn(),
    idle: false as boolean,
    scene: { add: vi.fn(), remove: vi.fn() },
    setCameraPosition: vi.fn(),
    setCameraTarget: vi.fn(),
    isPostProcessingEnabled: vi.fn(() => false),
    updatePostProcessingSettings: vi.fn(),
    initPostProcessing: vi.fn(),
    pointLight: { intensity: 1.0 },
    ambientLight: { intensity: 0.5 },
    setOrthographic: vi.fn(),
    setControlsEnabled: vi.fn(),
    setPickingEnabled: vi.fn(),
    materials: { particles: { shininess: 0 } },
    enableXR: vi.fn(() => null),
  };
}

function createDefaultMockState() {
  return {
    simulation: {
      cameraPosition: undefined,
      cameraTarget: undefined,
      running: false,
      simulation: undefined as { id: string } | null | undefined,
    },
    render: {
      particles: undefined as unknown,
      bonds: undefined as unknown,
      visualizer: createMockVisualizerInstance() as ReturnType<
        typeof createMockVisualizerInstance
      > | null,
    },
    settings: {
      render: {
        ssao: false,
        ssaoRadius: 0.5,
        ssaoIntensity: 0.5,
        pointLightIntensity: 1.0,
        ambientLightIntensity: 0.5,
        orthographic: false,
        showSimulationBox: false,
        showWalls: false,
      },
    },
    processing: {
      postTimestepModifiers: [] as Modifier[],
    },
    simulationStatus: {
      runTotalTimesteps: 0,
      runTimesteps: 0,
      timesteps: 0,
      box: undefined,
      origo: undefined,
      computes: {} as Record<string, Compute>,
      fixes: {} as Record<string, Fix>,
      variables: {} as Record<string, Variable>,
      dimension: 3,
      walls: [] as Wall[],
    },
  };
}

function createDefaultMockActions() {
  return {
    render: {
      // Mirrors the real action: updates mockState so subsequent renders
      // see the newly created visualizer and don't re-trigger creation.
      setVisualizer: vi.fn((v: ReturnType<typeof createMockVisualizerInstance>) => {
        mockState.render.visualizer = v;
      }),
    },
    settings: {
      setRender: vi.fn(),
    },
  };
}

function createDefaultEmbedModeResult(): EmbeddedModeResult {
  return {
    embeddedSimulationUrl: null,
    simulationIndex: 0,
    embeddedData: null,
    autoStart: false,
    isEmbeddedMode: false,
    vars: {},
    embedConfig: {
      showSimulationSummary: true,
      showSimulationBox: true,
      enableCameraControls: true,
      enableParticlePicking: true,
    },
  };
}
