import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { createStore, StoreProvider, type Store } from "easy-peasy";
import Notebook, { notebookUrlFor } from "./Notebook";
import { storeModel, type StoreModel } from "../store/model";
import type { StoreInjections } from "../store/projects";
import { createMemoryProjectStorage } from "../storage";

describe("notebookUrlFor", () => {
  it("opens the project notebook with an encoded path", () => {
    expect(notebookUrlFor("diffusion", "analysis.ipynb")).toBe(
      "/atomify/jupyter/lab/index.html?path=diffusion%2Fanalysis.ipynb",
    );
  });

  it("defaults to analysis.ipynb", () => {
    expect(notebookUrlFor("my-project", undefined)).toBe(
      "/atomify/jupyter/lab/index.html?path=my-project%2Fanalysis.ipynb",
    );
  });

  it("falls back to the JupyterLite root without a project", () => {
    expect(notebookUrlFor(undefined, undefined)).toBe(
      "/atomify/jupyter/lab/index.html",
    );
  });
});

describe("Notebook", () => {
  const createTestStore = (): Store<StoreModel> => {
    const injections: StoreInjections = {
      libraryStorage: createMemoryProjectStorage(),
      scratchStorage: createMemoryProjectStorage(),
    };
    return createStore(storeModel, { injections });
  };

  it("opens the active project's notebook", async () => {
    const store = createTestStore();
    await store.getActions().projects.createProject({
      displayName: "Demo",
      files: [],
    });

    const { container } = render(
      <StoreProvider store={store}>
        <Notebook />
      </StoreProvider>,
    );

    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute("src")).toBe(
      "/atomify/jupyter/lab/index.html?path=demo%2Fanalysis.ipynb",
    );
  });

  it("opens the JupyterLite root with no active project (embedded mode)", () => {
    const store = createTestStore();

    const { container } = render(
      <StoreProvider store={store}>
        <Notebook />
      </StoreProvider>,
    );

    expect(container.querySelector("iframe")!.getAttribute("src")).toBe(
      "/atomify/jupyter/lab/index.html",
    );
  });
});
