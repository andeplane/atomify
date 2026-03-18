import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useEmbeddedMode } from "./useEmbeddedMode";

describe("useEmbeddedMode", () => {
  beforeEach(() => {
    setLocationSearch("");
  });

  describe("parseVars (via hook)", () => {
    it("returns empty object when vars param is absent", () => {
      setLocationSearch("?embeddedSimulationUrl=http://x");

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.vars).toEqual({});
    });

    it("returns empty object when vars param is empty string", () => {
      setLocationSearch("?embeddedSimulationUrl=http://x&vars=");

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.vars).toEqual({});
    });

    it("parses valid name:value pairs", () => {
      setLocationSearch(
        "?embeddedSimulationUrl=http://x&vars=temp:2.5,mass:1.0",
      );

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.vars).toEqual({ temp: 2.5, mass: 1.0 });
    });

    it("skips entries with invalid float values", () => {
      setLocationSearch(
        "?embeddedSimulationUrl=http://x&vars=good:3.14,bad:notanumber",
      );

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.vars).toEqual({ good: 3.14 });
    });

    it("handles extra colons by using only the first value part", () => {
      setLocationSearch(
        "?embeddedSimulationUrl=http://x&vars=key:1.5:extra",
      );

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.vars).toEqual({ key: 1.5 });
    });

    it("skips entries with fewer than 2 colon-separated parts", () => {
      setLocationSearch(
        "?embeddedSimulationUrl=http://x&vars=novalue,good:5",
      );

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.vars).toEqual({ good: 5 });
    });
  });

  describe("parseEmbedConfig (via hook)", () => {
    const DEFAULTS = {
      showSimulationSummary: true,
      showSimulationBox: true,
      enableCameraControls: true,
      enableParticlePicking: true,
    };

    it("returns defaults when config param is absent", () => {
      setLocationSearch("?embeddedSimulationUrl=http://x");

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.embedConfig).toEqual(DEFAULTS);
    });

    it("applies overrides from valid base64 JSON config", () => {
      const config = { showSimulationSummary: false, showSimulationBox: false };
      const encoded = btoa(JSON.stringify(config));
      setLocationSearch(
        `?embeddedSimulationUrl=http://x&config=${encoded}`,
      );

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.embedConfig).toEqual({
        ...DEFAULTS,
        showSimulationSummary: false,
        showSimulationBox: false,
      });
    });

    it("applies defaults for missing keys in partial config", () => {
      const config = { enableCameraControls: false };
      const encoded = btoa(JSON.stringify(config));
      setLocationSearch(
        `?embeddedSimulationUrl=http://x&config=${encoded}`,
      );

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.embedConfig).toEqual({
        ...DEFAULTS,
        enableCameraControls: false,
      });
    });

    it("returns defaults when config is invalid base64", () => {
      setLocationSearch(
        "?embeddedSimulationUrl=http://x&config=!!!notbase64!!!",
      );

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.embedConfig).toEqual(DEFAULTS);
    });
  });

  describe("hook return shape", () => {
    it("returns isEmbeddedMode true when embeddedSimulationUrl is present", () => {
      setLocationSearch("?embeddedSimulationUrl=http://example.com/sim.lmp");

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.isEmbeddedMode).toBe(true);
      expect(result.current.embeddedSimulationUrl).toBe(
        "http://example.com/sim.lmp",
      );
    });

    it("returns isEmbeddedMode false when no embed params are present", () => {
      setLocationSearch("");

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.isEmbeddedMode).toBe(false);
    });

    it("defaults simulationIndex to 0 when not specified", () => {
      setLocationSearch("?embeddedSimulationUrl=http://x");

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.simulationIndex).toBe(0);
    });

    it("parses simulationIndex from URL param", () => {
      setLocationSearch(
        "?embeddedSimulationUrl=http://x&simulationIndex=3",
      );

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.simulationIndex).toBe(3);
    });

    it("returns autoStart true only when param is 'true'", () => {
      setLocationSearch("?embeddedSimulationUrl=http://x&autostart=true");

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.autoStart).toBe(true);
    });

    it("returns autoStart false when param is absent", () => {
      setLocationSearch("?embeddedSimulationUrl=http://x");

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.autoStart).toBe(false);
    });

    it("returns autoStart false when param is not 'true'", () => {
      setLocationSearch("?embeddedSimulationUrl=http://x&autostart=yes");

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.autoStart).toBe(false);
    });

    it("returns embeddedData from data param", () => {
      setLocationSearch(
        "?data=someEncodedData&embed=true",
      );

      const { result } = renderHook(() => useEmbeddedMode());

      expect(result.current.embeddedData).toBe("someEncodedData");
      expect(result.current.isEmbeddedMode).toBe(true);
    });
  });
});

// Helper functions

function setLocationSearch(search: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { search },
  });
}
