/**
 * The New Project modal's browsable example picker: all examples offered,
 * search filtering by title/description/keywords, and selection highlight.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, StoreProvider, type Store } from "easy-peasy";

import NewProjectModal from "./NewProjectModal";
import { ShellUIContext, type ShellUI } from "../ShellContext";
import type { Example } from "../../hooks/useExamples";
import { storeModel, type StoreModel } from "../../store/model";
import type { StoreInjections } from "../../store/projects";
import { createMemoryProjectStorage } from "../../storage";

function makeExample(id: string, title: string, keywords: string[]): Example {
  return {
    id,
    title,
    description: `${title} description`,
    imageUrl: `${id}.png`,
    inputScript: `${id}.in`,
    keywords,
    files: [{ fileName: `${id}.in`, url: `${id}/${id}.in` }],
  };
}

const EXAMPLES: Example[] = [
  makeExample("diffusion", "Diffusion", ["lennard jones", "diffusion"]),
  makeExample("crack", "Crack propagation", ["fracture"]),
  makeExample("water", "Water", ["molecules", "diffusion"]),
];

describe("NewProjectModal example picker", () => {
  let store: Store<StoreModel>;

  beforeEach(() => {
    const injections: StoreInjections = {
      libraryStorage: createMemoryProjectStorage(),
      scratchStorage: createMemoryProjectStorage(),
    };
    store = createStore(storeModel, { injections });
  });

  const renderModal = () => {
    const ui = {
      notify: { error: vi.fn() },
      examples: {
        title: "Examples",
        description: "",
        examples: EXAMPLES,
        loading: false,
      },
    } as unknown as ShellUI;
    return render(
      <StoreProvider store={store}>
        <ShellUIContext.Provider value={ui}>
          <NewProjectModal open onClose={vi.fn()} />
        </ShellUIContext.Provider>
      </StoreProvider>,
    );
  };

  it("offers every example with search and keyword chips", async () => {
    renderModal();
    const user = userEvent.setup();

    await user.click(screen.getByTestId("source-example"));

    expect(screen.getByTestId("np-example-search")).toBeInTheDocument();
    for (const example of EXAMPLES) {
      expect(
        screen.getByTestId(`np-example-card-${example.id}`),
      ).toBeInTheDocument();
    }
    // First keyword renders as the category chip.
    expect(
      screen.getByTestId("np-example-card-crack"),
    ).toHaveTextContent("fracture");
  });

  it("filters by title, description and keywords", async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByTestId("source-example"));

    // Keyword match: two examples share the "diffusion" keyword.
    await user.type(screen.getByTestId("np-example-search"), "diffusion");
    expect(screen.getByTestId("np-example-card-diffusion")).toBeInTheDocument();
    expect(screen.getByTestId("np-example-card-water")).toBeInTheDocument();
    expect(screen.queryByTestId("np-example-card-crack")).toBeNull();

    // Title match, case-insensitive.
    await user.clear(screen.getByTestId("np-example-search"));
    await user.type(screen.getByTestId("np-example-search"), "CRACK");
    expect(screen.getByTestId("np-example-card-crack")).toBeInTheDocument();
    expect(screen.queryByTestId("np-example-card-diffusion")).toBeNull();

    // No match: empty state (and no cards).
    await user.clear(screen.getByTestId("np-example-search"));
    await user.type(screen.getByTestId("np-example-search"), "zeolite");
    expect(screen.getByText(/No examples match/)).toBeInTheDocument();
  });

  it("highlights the picked example with the accent border", async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByTestId("source-example"));

    await user.click(screen.getByTestId("np-example-card-water"));

    expect(screen.getByTestId("np-example-card-water").style.border).toContain(
      "var(--accent)",
    );
    expect(
      screen.getByTestId("np-example-card-diffusion").style.border,
    ).toContain("var(--border)");
  });
});
