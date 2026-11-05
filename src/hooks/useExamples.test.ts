import { describe, expect, it } from "vitest";
import {
  exampleUrlResolver,
  resolveExamples,
  type Example,
} from "./useExamples";

const DOC = "https://andeplane.github.io/atomify/?examplesUrl=x";
const RAW =
  "https://raw.githubusercontent.com/someone/my-examples/main/examples.json";

function example(overrides: Partial<Example> = {}): Example {
  return {
    id: "msd",
    title: "MSD",
    description: "",
    imageUrl: "msd/msd.png",
    inputScript: "msd.in",
    analysisScript: "msd.ipynb",
    files: [
      { fileName: "msd.in", url: "msd/msd.in" },
      { fileName: "msd.ipynb", url: "msd/msd.ipynb" },
    ],
    ...overrides,
  };
}

describe("exampleUrlResolver", () => {
  it("resolves against the examples.json folder when baseUrl is missing", () => {
    const resolve = exampleUrlResolver(RAW, undefined, DOC);
    expect(resolve("msd/msd.in")).toBe(
      "https://raw.githubusercontent.com/someone/my-examples/main/msd/msd.in",
    );
  });

  it("keeps an absolute baseUrl working (with or without trailing slash)", () => {
    for (const baseUrl of ["https://cdn.test/a", "https://cdn.test/a/"]) {
      const resolve = exampleUrlResolver(RAW, baseUrl, DOC);
      expect(resolve("msd/msd.in")).toBe("https://cdn.test/a/msd/msd.in");
    }
  });

  it("resolves the bundled relative baseUrl against the app", () => {
    const resolve = exampleUrlResolver(
      "examples/examples.json",
      "examples",
      DOC,
    );
    expect(resolve("diffusion/x.in")).toBe(
      "https://andeplane.github.io/atomify/examples/diffusion/x.in",
    );
  });

  it("leaves absolute file URLs alone", () => {
    const resolve = exampleUrlResolver(RAW, undefined, DOC);
    expect(resolve("https://other.test/f.in")).toBe("https://other.test/f.in");
  });
});

describe("resolveExamples", () => {
  it("keeps an analysisScript that is a listed file as a plain name", () => {
    const [resolved] = resolveExamples({ examples: [example()] }, RAW, DOC);
    expect(resolved.analysisScript).toBe("msd.ipynb");
    expect(resolved.files[1].url).toBe(
      "https://raw.githubusercontent.com/someone/my-examples/main/msd/msd.ipynb",
    );
    expect(resolved.imageUrl).toBe(
      "https://raw.githubusercontent.com/someone/my-examples/main/msd/msd.png",
    );
  });

  it("resolves an analysisScript that is not among the files", () => {
    const [resolved] = resolveExamples(
      {
        examples: [example({ analysisScript: "msd/other.ipynb", files: [] })],
      },
      RAW,
      DOC,
    );
    expect(resolved.analysisScript).toBe(
      "https://raw.githubusercontent.com/someone/my-examples/main/msd/other.ipynb",
    );
  });

  it("does not mutate the input", () => {
    const input = example();
    resolveExamples({ examples: [input] }, RAW, DOC);
    expect(input.files[0].url).toBe("msd/msd.in");
  });
});
