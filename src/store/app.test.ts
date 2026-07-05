import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createStore, type Store } from "easy-peasy";
import { appModel, type AppModel, type SimulationFile } from "./app";

// Mock isEmbeddedMode — the module reads window.location at import time,
// so we must mock it before any import of the module under test.
vi.mock(import("../utils/embeddedMode"), () => ({
  isEmbeddedMode: vi.fn(() => false),
}));

import { vi } from "vitest";

describe("app store", () => {
  let store: Store<AppModel>;

  beforeEach(() => {
    store = createStore(appModel);
  });

  describe("getInitialSelectedMenu", () => {
    afterEach(() => {
      vi.doUnmock("../utils/embeddedMode");
      vi.resetModules();
    });

    // These re-import "./app" (via vi.resetModules + vi.doMock) so the
    // module's real top-level getInitialSelectedMenu() runs against the
    // mock, rather than recomputing selectedMenu inline in the test.
    it("should default to 'examples' when not in embedded mode", async () => {
      vi.resetModules();
      vi.doMock("../utils/embeddedMode", () => ({
        isEmbeddedMode: vi.fn(() => false),
      }));
      const { appModel: freshAppModel } = await import("./app");
      const freshStore = createStore(freshAppModel);

      expect(freshStore.getState().selectedMenu).toBe("examples");
    });

    it("should default to 'view' when in embedded mode", async () => {
      vi.resetModules();
      vi.doMock("../utils/embeddedMode", () => ({
        isEmbeddedMode: vi.fn(() => true),
      }));
      const { appModel: freshAppModel } = await import("./app");
      const freshStore = createStore(freshAppModel);

      expect(freshStore.getState().selectedMenu).toBe("view");
    });
  });

  describe("setSelectedMenu", () => {
    it("should update selectedMenu", () => {
      store.getActions().setSelectedMenu("settings");

      expect(store.getState().selectedMenu).toBe("settings");
    });
  });

  describe("setPreferredView", () => {
    it("should update preferredView", () => {
      store.getActions().setPreferredView("3d");

      expect(store.getState().preferredView).toBe("3d");
    });

    it("should allow setting preferredView to undefined", () => {
      store.getActions().setPreferredView("3d");
      store.getActions().setPreferredView(undefined);

      expect(store.getState().preferredView).toBeUndefined();
    });
  });

  describe("setSelectedFile", () => {
    it("should update selectedFile", () => {
      const file: SimulationFile = {
        fileName: "test.lmp",
        content: "# test content",
      };

      store.getActions().setSelectedFile(file);

      expect(store.getState().selectedFile).toEqual(file);
    });
  });

  describe("setStatus", () => {
    it("should update status", () => {
      const status = { title: "Running", text: "Step 100", progress: 50 };

      store.getActions().setStatus(status);

      expect(store.getState().status).toEqual(status);
    });

    it("should allow clearing status with undefined", () => {
      store.getActions().setStatus({ title: "Running", text: "", progress: 0 });
      store.getActions().setStatus(undefined);

      expect(store.getState().status).toBeUndefined();
    });
  });
});
