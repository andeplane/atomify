import { describe, it, expect, beforeEach } from "vitest";
import { createStore, type Store } from "easy-peasy";
import { appModel, type AppModel } from "./app";

describe("app store", () => {
  let store: Store<AppModel>;

  beforeEach(() => {
    store = createStore(appModel);
  });

  describe("liveViewportVisible", () => {
    it("defaults to false until the shell shows the live viewport", () => {
      expect(store.getState().liveViewportVisible).toBe(false);
    });

    it("is toggled by setLiveViewportVisible", () => {
      store.getActions().setLiveViewportVisible(true);
      expect(store.getState().liveViewportVisible).toBe(true);
      store.getActions().setLiveViewportVisible(false);
      expect(store.getState().liveViewportVisible).toBe(false);
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
