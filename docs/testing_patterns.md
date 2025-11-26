# Testing Patterns for Atomify

This document outlines common testing problems and best practices for the Atomify application.

## Best Practices Summary

1. **Always use type-safe mock creation** - prefer `vi.fn(() => ...)` pattern where possible; use `vi.fn()` + `vi.mocked()` when the mock needs to be reconfigured per test
2. **Prefer context injection over vi.mock** when possible; use `vi.mock(import(...))` for type safety when needed
3. **Use wrapper components** for context-dependent hooks
4. **Structure tests** with explicit Arrange-Act-Assert comments for longer tests
5. **Isolate common setup** in `beforeEach` blocks for all tests
6. **Use waitFor for async assertions** to avoid flaky tests
7. **Use `Partial<T>` over `as unknown as T`** for better type safety
8. **Use `act()` for state updates** in React component testing
9. **Extract helper functions** to the bottom of test files
10. **Use direct imports from React** instead of importing the global React namespace
11. **Mock browser APIs** (matchMedia, localStorage, etc.) in setupTests.ts when needed

## 1. Type-Safe Mock Creation

### Problem

Using `vi.fn().mockReturnValue()` creates type-unsafe mocks that can become brittle and don't catch type changes. **All mocking must be type-safe** to catch breaking changes and ensure test reliability.

### Solution

**Always use type-safe mocking.** Prefer the `vi.fn(() => ...)` pattern where possible, as it provides type safety with less boilerplate. Use `vi.fn() + vi.mocked()` when you need to reconfigure the mock behavior in individual tests.

**Preferred: `vi.fn(() => ...)`**

This pattern is preferred when the mock behavior is consistent across tests or can be defined upfront:

```typescript
describe('useSimulationData', () => {
  let mockContext: SimulationContextType;

  beforeEach(() => {
    const simulationState = {
      isRunning: false,
      timestep: 0,
    };

    // Preferred: Direct type-safe implementation in vi.fn()
    mockContext = {
      getSimulationState: vi.fn(() => simulationState),
      updateSimulation: vi.fn(),
    };
  });
});
```

**Alternative: `vi.fn()` + `vi.mocked()`**

Use this pattern when you need to reconfigure mock behavior per test:

```typescript
describe('useSimulationData', () => {
  let mockContext: SimulationContextType;

  beforeEach(() => {
    const simulationState = {
      isRunning: false,
      timestep: 0,
    };

    mockContext = {
      getSimulationState: vi.fn(),
      updateSimulation: vi.fn(),
    };

    // Type-safe mock setup with vi.mocked() when you need per-test configuration
    vi.mocked(mockContext.getSimulationState).mockReturnValue(simulationState);
  });

  it('should handle running simulation state', () => {
    // Reconfigure mock for this specific test
    vi.mocked(mockContext.getSimulationState).mockReturnValue({
      isRunning: true,
      timestep: 100,
    });
    // ... test implementation
  });
});
```

## 2. Mocking Strategy: Context Injection vs vi.mock

### Problem

External dependencies need to be mocked, but vi.mock can make tests brittle and less focused.

### Solution

Prefer context injection over vi.mock when possible. When vi.mock is necessary, use `vi.mock(import(...))` for type safety. Always add a note saying _why_ you need to mock out the module when doing this.

```typescript
// Preferred: Context injection
describe('useSimulationData', () => {
  let mockContext: SimulationContextType;

  beforeEach(() => {
    mockContext = {
      getSimulationState: vi.fn(),
      updateSimulation: vi.fn(),
    };
  });

  // Use context providers in wrapper
});

// When necessary: Type-safe vi.mock for utilities
vi.mock(import('../utils/metrics'), () => ({
  trackEvent: vi.fn(),
}));

// Type-safe with async import for partial mocking
vi.mock(import('../utils/AnalyzeNotebook'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    parseNotebook: vi.fn(),
  };
});
```

## 3. Context Provider Testing Pattern For Hooks

### Problem

Hooks that depend on React context need proper context setup for testing.

### Solution

Extract wrapper components to reusable functions to avoid duplication and improve maintainability:

```typescript
import type { ComponentType, ReactNode } from 'react';

describe('useSimulationState', () => {
  let mockContext: SimulationContextInterface;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      simulation: {
        isRunning: false,
        timestep: 0,
      },
      startSimulation: vi.fn(),
      stopSimulation: vi.fn(),
    };

    // Extract wrapper to a reusable function
    wrapper = createContextWrapper(mockContext);
  });

  it('should return current simulation state', () => {
    const { result } = renderHook(() => useSimulationState(), {
      wrapper,
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.timestep).toBe(0);
  });
});

// Helper function for creating wrappers - place at bottom of file
function createContextWrapper(
  mockContext: SimulationContextInterface
): ComponentType<{ children: ReactNode }> {
  return ({ children }) => (
    <SimulationContext.Provider value={mockContext}>
      {children}
    </SimulationContext.Provider>
  );
}
```

## 4. Testing Async Operations

### Problem

Async operations like data fetching or state updates need proper handling in tests.

### Solution

Use `waitFor` from `@testing-library/react` for async assertions:

```typescript
import { waitFor } from '@testing-library/react';

it('should load simulation data', async () => {
  // Arrange
  const mockFetchSimulation = vi.fn().mockResolvedValue({
    atoms: 1000,
    timestep: 0,
  });

  // Act
  const { result } = renderHook(() => useSimulation(mockFetchSimulation));

  // Assert - Use waitFor for async state updates
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual({
      atoms: 1000,
      timestep: 0,
    });
  });
});
```

## 5. Consistent Arrange-Act-Assert Structure

### Problem

Tests without clear structure are hard to read and maintain.

### Solution

Use explicit Arrange-Act-Assert comments and structure for tests that are more than ~10-15 statements.

```typescript
it('should not start simulation if WASM is not loaded', () => {
  // Arrange
  vi.mocked(mockContext.getWasmStatus).mockReturnValue({
    isLoaded: false,
    error: null,
  });

  // Act
  const { result } = renderHook(() => useSimulationControl(), {
    wrapper,
  });
  
  act(() => {
    result.current.startSimulation();
  });

  // Assert
  expect(mockContext.startSimulation).not.toHaveBeenCalled();
});
```

## 6. Testing Components with User Interactions

### Problem

Components need to be tested for user interactions like clicks, inputs, and form submissions.

### Solution

Use `@testing-library/react` utilities to simulate user interactions:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should start simulation when button is clicked', async () => {
  // Arrange
  const mockStartSimulation = vi.fn();
  render(<SimulationControls onStart={mockStartSimulation} />);
  
  // Act
  const startButton = screen.getByRole('button', { name: /start/i });
  await userEvent.click(startButton);
  
  // Assert
  expect(mockStartSimulation).toHaveBeenCalledTimes(1);
});

it('should update input value', () => {
  // Arrange
  render(<SimulationSettings />);
  const input = screen.getByLabelText(/timestep/i);
  
  // Act
  fireEvent.change(input, { target: { value: '0.001' } });
  
  // Assert
  expect(input).toHaveValue('0.001');
});
```

## 7. Isolating Common Setup

### Problem

Complex dependencies make tests hard to set up and maintain, and common setup code gets duplicated across tests.

### Solution

Use consistent `beforeEach` setup to isolate common setup for all tests:

```typescript
describe('SimulationController', () => {
  let controller: SimulationController;
  let mockLammps: MockLammpsInterface;
  let mockStore: MockStoreInterface;

  beforeEach(() => {
    mockLammps = {
      run: vi.fn(),
      step: vi.fn(),
      getAtoms: vi.fn(),
    };

    mockStore = {
      getState: vi.fn(),
      setState: vi.fn(),
    };

    controller = new SimulationController(mockLammps, mockStore);
  });

  it('should initialize with correct state', () => {
    expect(controller.isRunning).toBe(false);
    expect(mockLammps.run).not.toHaveBeenCalled();
  });
});
```

## 8. Async Testing with waitFor

### Problem

Async state changes can lead to flaky tests when assertions run before state updates complete.

### Solution

Use `waitFor` for assertions that depend on async state changes:

```typescript
import { waitFor, renderHook } from '@testing-library/react';

it('should load simulation data asynchronously', async () => {
  // Arrange
  const mockFetch = vi.fn().mockResolvedValue({ atoms: 1000 });
  const { result } = renderHook(() => useSimulationLoader(mockFetch));

  // Act
  act(() => {
    result.current.loadSimulation();
  });

  // Assert - Use waitFor for async assertions
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data?.atoms).toBe(1000);
  });
});
```

## 9. Using Partial<T> over as unknown as T

### Problem

Using `as unknown as T` bypasses all type checking and can hide type errors.

### Solution

For types `T` we do not control (e.g. built-in types such as `Window`), use `Partial<T>`
with `as T` to maintain type safety while only mocking needed properties:

```typescript
// Good: Type-safe partial mocking
function createMockWindow(overrides: Partial<Window> = {}): Window {
  const defaultWindow: Partial<Window> = {
    postMessage: vi.fn(),
  };

  return { ...defaultWindow, ...overrides } as Window;
}
// Good: Partial interface implementation
const mockWindow: Partial<Window> = {
  location: 'https://example.test/',
};
const window = mockWindow as Window;
```

Avoid the following:

```typescript
// Avoid: Completely unsafe casting
const badMockWindow = {} as unknown as Window; // No type checking at all
```

## 10. Using act() for State Updates

### Problem

React state updates outside of React's rendering cycle can cause warnings and unpredictable test behavior.

### Solution

Wrap state-changing operations in `act()` to ensure proper React lifecycle handling:

```typescript
import { act, renderHook } from '@testing-library/react';

it('should handle user interactions properly', async () => {
  const { result } = renderHook(() => useCounter());

  // Wrap synchronous state updates in act()
  act(() => {
    result.current.increment();
  });
  expect(result.current.count).toBe(1);

  // Wrap async state updates
  await act(async () => {
    await result.current.incrementAsync();
  });

  expect(result.current.count).toBe(2);
});

// For component testing
it('should update state when button is clicked', () => {
  render(<Counter />);

  act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'increment' }));
  });

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

## 11. Mocking Browser APIs

### Problem

Browser APIs like `window.matchMedia`, `localStorage`, and `WebGL` are not available in the jsdom test environment.

### Solution

Mock browser APIs in `setupTests.ts` or individual test files:

```typescript
// In src/setupTests.ts - for global mocks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// In individual test files - for test-specific mocks
describe('Component using localStorage', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    mockLocalStorage = {};
    
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      return mockLocalStorage[key] || null;
    });
    
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockLocalStorage[key] = value;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
```

## 12. Helper Function Extraction

### Problem

Large test files become hard to maintain and reusable mock creation logic gets duplicated.

### Solution

Extract helper functions to the bottom of test files for better organization:

```typescript
describe('SimulationEngine', () => {
  let engine: SimulationEngine;
  let mockLammps: LammpsInterface;

  beforeEach(() => {
    // Arrange: Create mocks using helper functions
    mockLammps = createMockLammps();
    const config = createMockConfig({
      timestep: 0.001,
      temperature: 300,
    });

    engine = new SimulationEngine(mockLammps, config);
  });

  it('should run simulation with correct parameters', async () => {
    // Arrange
    const steps = 1000;
    vi.mocked(mockLammps.step).mockResolvedValue({ timestep: steps });

    // Act
    const result = await engine.run(steps);

    // Assert
    expect(mockLammps.step).toHaveBeenCalledWith(steps);
    expect(result.timestep).toBe(steps);
  });
});

// Helper functions at the bottom
function createMockLammps(): LammpsInterface {
  return {
    run: vi.fn(),
    step: vi.fn(),
    getAtoms: vi.fn(() => []),
    reset: vi.fn(),
  };
}

function createMockConfig(overrides?: Partial<SimulationConfig>): SimulationConfig {
  return {
    timestep: 0.001,
    temperature: 300,
    ensemble: 'NVE',
    ...overrides,
  };
}

function createMockAtom(overrides?: Partial<Atom>): Atom {
  return {
    id: 1,
    type: 1,
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    ...overrides,
  };
}
```

## 13. Testing WASM Integration

### Problem

Testing code that interacts with WebAssembly modules requires special handling since WASM is not available in the test environment.

### Solution

Mock the WASM interface and focus on testing the JavaScript integration layer:

```typescript
describe('LammpsWrapper', () => {
  let mockWasm: MockLammpsWasm;
  let wrapper: LammpsWrapper;

  beforeEach(() => {
    // Mock the WASM module interface
    mockWasm = {
      run: vi.fn(),
      ccall: vi.fn(),
      getValue: vi.fn(),
      setValue: vi.fn(),
      _malloc: vi.fn(() => 1024),
      _free: vi.fn(),
      HEAPF64: new Float64Array(1000),
    };

    wrapper = new LammpsWrapper(mockWasm);
  });

  it('should call WASM function with correct parameters', () => {
    // Arrange
    const command = 'run 1000';

    // Act
    wrapper.executeCommand(command);

    // Assert
    expect(mockWasm.ccall).toHaveBeenCalledWith(
      'lammps_command',
      'number',
      ['string'],
      [command]
    );
  });
});
```

## 14. Organizing Test Utilities

### Problem

Large mock data objects inline in test files make tests hard to read and maintain. Duplicate mock data across test files leads to inconsistencies.

### Solution

Consider creating a `__mocks__` directory when mock data is reused across multiple test files. For simple cases, keep mocks in the same test file.

**When to extract to `src/__mocks__/`:**

- Mock data used across multiple test files
- Complex mock objects (simulations with many properties)
- Reusable mock creation functions
- Mock implementations of interfaces

**Example:**

```typescript
// Before: Large inline mock data repeated in multiple tests
it('should process simulation', () => {
  const simulation = {
    id: 'sim-1',
    name: 'Test Simulation',
    atoms: Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      type: 1,
      position: [0, 0, 0],
      velocity: [0, 0, 0],
    })),
    config: { /* ... */ },
  };
  // ... test
});

// After: Extract to __mocks__
// In src/__mocks__/simulation.ts
export function createMockSimulation(
  overrides?: Partial<Simulation>
): Simulation {
  return {
    id: 'sim-1',
    name: 'Test Simulation',
    atoms: createMockAtoms(1000),
    config: createMockConfig(),
    ...overrides,
  };
}

// In test file
import { createMockSimulation } from '../__mocks__/simulation';

it('should process simulation', () => {
  const simulation = createMockSimulation({ name: 'Custom Sim' });
  // ... test
});
```

## 15. Use Direct Imports from React

### Problem

Using `import React from 'react'` imports the entire React namespace, which is unnecessary with modern React (17+) that doesn't require the React namespace for JSX.

### Solution

Use direct imports from React instead of importing the global React namespace:

```typescript
// Good: Direct imports
import { useState, useEffect, type ComponentType, type ReactNode } from 'react';

// Use in code
let wrapper: ComponentType<{ children: ReactNode }>;
const [count, setCount] = useState(0);

// Avoid: Global React import
import React from 'react';

let wrapper: React.ComponentType<{ children: React.ReactNode }>;
const [count, setCount] = React.useState(0);
```

This approach:

- Makes dependencies explicit (you can see exactly what you're using)
- Works with modern React (17+) which doesn't require React namespace for JSX
- Reduces bundle size by only importing what you need
- Improves tree-shaking

**Note**: In React 17+, JSX transform doesn't require the React namespace, so you only need to import React types, not the runtime.