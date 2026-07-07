// jest-dom adds custom matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock window.matchMedia for Monaco Editor and other libraries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated
    removeListener: () => {}, // Deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Unit tests never run real LAMMPS. Stub the (large, embedded) atomify wasm
// module so mounting the app / Simulation component doesn't decode ~20 MB into
// jsdom — that starved parallel CPU-bound tests into 5s timeouts. createModule
// returns a promise that never resolves, so the app simply stays in its
// "Downloading LAMMPS ..." state, which is all a render smoke test needs.
vi.mock("lammps.js/wasm-atomify", () => ({
  default: () => new Promise(() => {}),
}));

// Mock Monaco Editor loader to prevent it from trying to load in test environment
vi.mock("@monaco-editor/react", () => ({
  default: vi.fn(() => null),
  loader: {
    init: vi.fn(() =>
      Promise.resolve({
        languages: {
          register: vi.fn(),
          setMonarchTokensProvider: vi.fn(),
        },
        editor: {
          create: vi.fn(),
        },
      }),
    ),
    config: vi.fn(),
  },
}));
