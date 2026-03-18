import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadRenderSettingsFromStorage,
  saveRenderSettingsToStorage,
  type RenderSettings,
} from "./settings";

const RENDER_SETTINGS_STORAGE_KEY = "atomify_render_settings";

describe("loadRenderSettingsFromStorage", () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, "getItem");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return parsed settings when valid JSON is stored", () => {
    const stored: Partial<RenderSettings> = { ssao: false, orthographic: true };
    vi.mocked(Storage.prototype.getItem).mockReturnValue(
      JSON.stringify(stored),
    );

    const result = loadRenderSettingsFromStorage();

    expect(result).toEqual(stored);
    expect(Storage.prototype.getItem).toHaveBeenCalledWith(
      RENDER_SETTINGS_STORAGE_KEY,
    );
  });

  it("should return empty object when key is missing", () => {
    vi.mocked(Storage.prototype.getItem).mockReturnValue(null);

    const result = loadRenderSettingsFromStorage();

    expect(result).toEqual({});
  });

  it("should return empty object when stored value is invalid JSON", () => {
    vi.mocked(Storage.prototype.getItem).mockReturnValue("not-valid-json{");

    const result = loadRenderSettingsFromStorage();

    expect(result).toEqual({});
  });

  it("should return empty object when stored value is a JSON primitive", () => {
    vi.mocked(Storage.prototype.getItem).mockReturnValue('"just a string"');

    const result = loadRenderSettingsFromStorage();

    expect(result).toEqual({});
  });

  it("should return empty object when stored value is null JSON", () => {
    vi.mocked(Storage.prototype.getItem).mockReturnValue("null");

    const result = loadRenderSettingsFromStorage();

    expect(result).toEqual({});
  });
});

describe("saveRenderSettingsToStorage", () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, "setItem");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should save settings as JSON to localStorage", () => {
    const settings: RenderSettings = {
      ssao: true,
      ssaoRadius: 10,
      ssaoIntensity: 5,
      ambientLightIntensity: 0.05,
      pointLightIntensity: 20,
      showSimulationBox: true,
      showWalls: true,
      orthographic: false,
    };

    saveRenderSettingsToStorage(settings);

    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      RENDER_SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  });

  it("should not throw when localStorage.setItem throws", () => {
    vi.mocked(Storage.prototype.setItem).mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const settings: RenderSettings = {
      ssao: true,
      ssaoRadius: 10,
      ssaoIntensity: 5,
      ambientLightIntensity: 0.05,
      pointLightIntensity: 20,
      showSimulationBox: true,
      showWalls: true,
      orthographic: false,
    };

    expect(() => saveRenderSettingsToStorage(settings)).not.toThrow();
  });
});
