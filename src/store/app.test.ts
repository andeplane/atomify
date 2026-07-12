import { describe, it, expect, beforeEach } from "vitest";
import { createStore, type Store } from "easy-peasy";
import { appModel, type AppModel, type SimulationFile } from "./app";

describe("app store", () => {
  let store: Store<AppModel>;

  beforeEach(() => {
    store = createStore(appModel);
  });

  describe("initial state", () => {
    it("defaults selectedMenu to 'examples' (embedded mode removed)", () => {
      expect(store.getState().selectedMenu).toBe("examples");
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
