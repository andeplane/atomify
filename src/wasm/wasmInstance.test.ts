import { describe, it, expect, beforeEach } from "vitest";
import {
  getWasm,
  getWasmOrNull,
  setWasm,
  getCancel,
  setCancel,
  getSyncFrequency,
  setSyncFrequency,
} from "./wasmInstance";
import { AtomifyWasmModule } from "./types";

// Reset module state between tests by re-importing
// Since module state persists, we use dynamic import + vi.resetModules
// But simpler: just test the public API sequentially

describe("wasmInstance", () => {
  describe("wasm module", () => {
    it("setWasm + getWasm round-trips the module", () => {
      const mockModule: Partial<AtomifyWasmModule> = {
        FS: {} as typeof FS,
      };
      setWasm(mockModule as AtomifyWasmModule);
      expect(getWasm()).toBe(mockModule);
    });

    it("getWasmOrNull returns the module after setWasm", () => {
      const mockModule: Partial<AtomifyWasmModule> = {
        FS: {} as typeof FS,
      };
      setWasm(mockModule as AtomifyWasmModule);
      expect(getWasmOrNull()).toBe(mockModule);
    });
  });

  describe("cancel flag", () => {
    beforeEach(() => {
      setCancel(false);
    });

    it("defaults to false after reset", () => {
      expect(getCancel()).toBe(false);
    });

    it("setCancel(true) is reflected by getCancel()", () => {
      setCancel(true);
      expect(getCancel()).toBe(true);
    });

    it("can be toggled back to false", () => {
      setCancel(true);
      setCancel(false);
      expect(getCancel()).toBe(false);
    });
  });

  describe("syncFrequency", () => {
    it("setSyncFrequency stores the value", () => {
      setSyncFrequency(10);
      expect(getSyncFrequency()).toBe(10);
    });

    it("can be updated", () => {
      setSyncFrequency(1);
      setSyncFrequency(50);
      expect(getSyncFrequency()).toBe(50);
    });
  });
});
