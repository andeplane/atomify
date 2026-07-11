import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStore } from "easy-peasy";
import {
  loadRenderSettingsFromStorage,
  loadThemeFromStorage,
  saveRenderSettingsToStorage,
  settingsModel,
  type RenderSettings,
} from "./settings";

const RENDER_SETTINGS_STORAGE_KEY = "atomify_render_settings";
const THEME_STORAGE_KEY = "atomify_theme";

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

describe("theme setting", () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, "getItem");
    vi.spyOn(Storage.prototype, "setItem");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadThemeFromStorage", () => {
    it("returns a stored valid theme", () => {
      vi.mocked(Storage.prototype.getItem).mockReturnValue("light");

      expect(loadThemeFromStorage()).toBe("light");
      expect(Storage.prototype.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    });

    it("defaults to dark when nothing or garbage is stored", () => {
      vi.mocked(Storage.prototype.getItem).mockReturnValue(null);
      expect(loadThemeFromStorage()).toBe("dark");

      vi.mocked(Storage.prototype.getItem).mockReturnValue("hotdog-stand");
      expect(loadThemeFromStorage()).toBe("dark");
    });

    it("defaults to dark when localStorage throws", () => {
      vi.mocked(Storage.prototype.getItem).mockImplementation(() => {
        throw new Error("SecurityError");
      });

      expect(loadThemeFromStorage()).toBe("dark");
    });
  });

  describe("setTheme action", () => {
    it("updates state and persists the choice", () => {
      const store = createStore(settingsModel);

      store.getActions().setTheme("light");

      expect(store.getState().theme).toBe("light");
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        THEME_STORAGE_KEY,
        "light",
      );
    });
  });
});
