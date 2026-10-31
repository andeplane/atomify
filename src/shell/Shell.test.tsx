/**
 * Shell integration tests: the real store on in-memory project storage,
 * with only the engine boundary (Simulation component) and network
 * (examples fetch) stubbed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, StoreProvider, type Store } from "easy-peasy";

// The Simulation component spawns the wasm worker — not available in jsdom.
vi.mock(import("../components/Simulation"), () => ({
  default: () => <></>,
}));
// Metrics call mixpanel/localStorage on most transitions; keep tests quiet.
vi.mock(import("../utils/metrics"), () => ({
  track: vi.fn(),
  time_event: vi.fn(),
}));

import Shell from "./Shell";
import { storeModel, type StoreModel } from "../store/model";
import type { StoreInjections } from "../store/projects";
import { EngineRegistry } from "../engine/EngineRegistry";
import { EngineContext } from "../engine/EngineContext";
import { createMemoryProjectStorage, type ProjectStorage } from "../storage";

const EXAMPLES_JSON = {
  baseUrl: "examples",
  title: "Examples",
  descriptionFile: "examples.md",
  examples: [
    {
      id: "diffusion",
      title: "Diffusion",
      description: "Measure the diffusion coefficient.",
      imageUrl: "diffusion/diffusion.png",
      inputScript: "simple_diffusion.in",
      keywords: ["lennard jones"],
      files: [
        {
          fileName: "simple_diffusion.in",
          url: "diffusion/simple_diffusion.in",
        },
      ],
    },
  ],
};

describe("Shell", () => {
  let store: Store<StoreModel>;
  let libraryStorage: ProjectStorage;
  // No engine is registered: the Simulation component that loads it is
  // stubbed, so the shell stays in its "engine loading" state.
  let engine: EngineRegistry;

  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    libraryStorage = createMemoryProjectStorage();
    engine = new EngineRegistry();
    const injections: StoreInjections = {
      libraryStorage,
      scratchStorage: createMemoryProjectStorage(),
      engine,
    };
    store = createStore(storeModel, { injections });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("examples.json")) {
          return new Response(JSON.stringify(EXAMPLES_JSON), { status: 200 });
        }
        if (url.endsWith(".md")) {
          return new Response("Examples description", { status: 200 });
        }
        return new Response("units lj\n", { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  const renderShell = () =>
    render(
      <StoreProvider store={store}>
        <EngineContext.Provider value={engine}>
          <Shell />
        </EngineContext.Provider>
      </StoreProvider>,
    );

  it("lands on Home with the sidebar and applies the dark theme", async () => {
    renderShell();

    expect(screen.getByTestId("home-screen")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    await waitFor(() =>
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark"),
    );
    // Engine is not loaded in tests: the loading chip shows and browsing works.
    expect(screen.getByTestId("engine-loading-chip")).toBeInTheDocument();
  });

  it("switches theme from the sidebar toggle and persists it", async () => {
    renderShell();

    await userEvent.click(screen.getByTestId("theme-light"));

    await waitFor(() =>
      expect(document.documentElement.getAttribute("data-theme")).toBe("light"),
    );
    expect(localStorage.getItem("atomify_theme")).toBe("light");
  });

  it("shows the author credit and an About dialog with source, author and help links", async () => {
    renderShell();
    const credit = await screen.findByTestId("sidebar-credit");
    expect(credit).toHaveTextContent("Made by Anders Hafreager");
    expect(credit).toHaveAttribute("href", "https://andeplane.github.io");

    await userEvent.click(screen.getByTestId("sidebar-about"));
    expect(await screen.findByTestId("about-modal")).toBeInTheDocument();
    expect(screen.getByTestId("about-source")).toHaveAttribute(
      "href",
      "https://github.com/andeplane/atomify",
    );
    expect(screen.getByTestId("about-author")).toHaveAttribute(
      "href",
      "https://andeplane.github.io",
    );
    expect(screen.getByTestId("about-issues")).toHaveAttribute(
      "href",
      "https://github.com/andeplane/atomify/issues",
    );
    expect(screen.getByTestId("about-email")).toHaveAttribute(
      "href",
      "mailto:andershaf@gmail.com",
    );
  });

  it("collapses the sidebar to an icon rail and persists the choice", async () => {
    renderShell();

    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar.getAttribute("data-collapsed")).toBe("false");
    expect(screen.getByTestId("nav-examples")).toHaveTextContent(
      "Example library",
    );

    await userEvent.click(screen.getByTestId("sidebar-collapse"));

    expect(sidebar.getAttribute("data-collapsed")).toBe("true");
    // Icon rail: the nav buttons stay clickable but drop their labels.
    expect(screen.getByTestId("nav-examples")).not.toHaveTextContent(
      "Example library",
    );
    expect(localStorage.getItem("atomify_sidebar_collapsed")).toBe("1");

    await userEvent.click(screen.getByTestId("sidebar-collapse"));
    expect(sidebar.getAttribute("data-collapsed")).toBe("false");
    expect(localStorage.getItem("atomify_sidebar_collapsed")).toBe("0");
  });

  it("navigates to the example library and shows fetched examples", async () => {
    renderShell();

    await userEvent.click(screen.getByTestId("nav-examples"));

    expect(screen.getByTestId("examples-screen")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByTestId("library-example-diffusion"),
      ).toBeInTheDocument(),
    );
    // URL stays deep-linkable.
    await waitFor(() =>
      expect(window.location.search).toBe("?screen=examples"),
    );
  });

  it("lists examples in the sidebar below the projects", async () => {
    renderShell();

    const row = await screen.findByTestId("sidebar-example-diffusion");
    expect(screen.getByTestId("sidebar-examples-list")).toContainElement(row);
    expect(row).toHaveTextContent("Diffusion");
    // Projects come first, examples below.
    expect(
      screen
        .getByTestId("sidebar-projects-section")
        .compareDocumentPosition(screen.getByTestId("sidebar-examples")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Quick run waits for the engine, which never loads in these tests.
    expect(
      screen.getByTestId("sidebar-example-quick-diffusion"),
    ).toBeDisabled();

    await userEvent.click(screen.getByTestId("sidebar-example-use-diffusion"));
    expect(screen.getByTestId("new-project-modal")).toBeInTheDocument();
  });

  it("hides the sidebar examples list when collapsed", async () => {
    renderShell();
    await screen.findByTestId("sidebar-example-diffusion");
    await userEvent.click(screen.getByTestId("sidebar-collapse"));
    expect(screen.queryByTestId("sidebar-examples")).not.toBeInTheDocument();
  });

  it("creates a blank project from the modal and opens its workspace", async () => {
    renderShell();

    await userEvent.click(screen.getByTestId("sidebar-new-project"));
    expect(screen.getByTestId("new-project-modal")).toBeInTheDocument();
    await userEvent.type(
      screen.getByTestId("project-name-input"),
      "Silica study",
    );
    await userEvent.click(screen.getByTestId("create-project"));

    await waitFor(() =>
      expect(screen.getByTestId("project-title")).toHaveTextContent(
        "Silica study",
      ),
    );
    expect(screen.getByTestId("project-dirname")).toHaveTextContent(
      "silica-study/",
    );
    // Blank project starts on Files with the generated notebook listed.
    expect(screen.getByTestId("files-tab")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("file-row-analysis.ipynb")).toBeInTheDocument(),
    );
    // Sidebar lists it; URL deep-links to it.
    expect(
      screen.getByTestId("sidebar-project-silica-study"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(window.location.search).toBe("?project=silica-study&tab=files"),
    );
  });

  it("restores a project from a deep link", async () => {
    // Seed the library through a first store session.
    await store.getActions().projects.createProject({
      displayName: "Demo",
      files: [{ fileName: "in.demo", content: "units lj\n" }],
    });

    // Fresh session (new store over the same storage) restoring from the URL.
    const secondEngine = new EngineRegistry();
    const secondStore = createStore(storeModel, {
      injections: {
        libraryStorage,
        scratchStorage: createMemoryProjectStorage(),
        engine: secondEngine,
      },
    });
    window.history.replaceState(null, "", "/?project=demo&tab=files");
    render(
      <StoreProvider store={secondStore}>
        <EngineContext.Provider value={secondEngine}>
          <Shell />
        </EngineContext.Provider>
      </StoreProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("project-title")).toHaveTextContent("Demo"),
    );
    expect(screen.getByTestId("file-row-in.demo")).toBeInTheDocument();
    expect(screen.getByText("Input script")).toBeInTheDocument();
  });

  it("shows the Run button disabled with the engine loading", async () => {
    await store.getActions().projects.createProject({
      displayName: "Demo",
      files: [{ fileName: "in.demo", content: "units lj\n" }],
    });
    renderShell();

    await waitFor(() =>
      expect(screen.getByTestId("run-simulation")).toBeDisabled(),
    );
  });
});
