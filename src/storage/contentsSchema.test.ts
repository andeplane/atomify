import { describe, expect, it } from "vitest";
import {
  base64ToBytes,
  bytesToBase64,
  bytesToWriteContent,
  classifyPath,
  validateRelativePath,
} from "./contentsSchema";
import { slugify, uniqueSlug } from "./slug";

describe("classifyPath", () => {
  it("classifies notebooks, json, binaries, and defaults to text", () => {
    expect(classifyPath("analysis.ipynb").type).toBe("notebook");
    expect(classifyPath("analysis.ipynb").format).toBe("json");
    expect(classifyPath("config.json").format).toBe("json");
    expect(classifyPath(".atomify/frame.png").format).toBe("base64");
    expect(classifyPath("frame.png").mimetype).toBe("image/png");
    // LAMMPS files have arbitrary "extensions" — they must default to text.
    expect(classifyPath("in.diffusion").format).toBe("text");
    expect(classifyPath("data.spce").format).toBe("text");
    expect(classifyPath("log.lammps").format).toBe("text");
    expect(classifyPath("dump.custom").format).toBe("text");
  });
});

describe("validateRelativePath", () => {
  it("accepts normal project paths", () => {
    expect(() => validateRelativePath("in.diffusion")).not.toThrow();
    expect(() =>
      validateRelativePath("runs/run-001/.atomify/run.json"),
    ).not.toThrow();
  });

  it("rejects %, dot-segments, and leading/trailing slashes", () => {
    expect(() => validateRelativePath("50%done.txt")).toThrow(/%/);
    expect(() => validateRelativePath("a/../b")).toThrow(/segment/);
    expect(() => validateRelativePath("./a")).toThrow(/segment/);
    expect(() => validateRelativePath("/a")).toThrow(/slash/);
    expect(() => validateRelativePath("a/")).toThrow(/slash/);
    expect(() => validateRelativePath("a//b")).toThrow(/segment/);
  });
});

describe("base64 round-trip", () => {
  it("round-trips bytes of every value", () => {
    const bytes = new Uint8Array(256).map((_, i) => i);
    expect([...base64ToBytes(bytesToBase64(bytes))]).toEqual([...bytes]);
  });

  it("handles buffers larger than the chunk size", () => {
    const bytes = new Uint8Array(0x8000 * 2 + 17).fill(42);
    const decoded = base64ToBytes(bytesToBase64(bytes));
    expect(decoded.length).toBe(bytes.length);
    expect(decoded[decoded.length - 1]).toBe(42);
  });
});

describe("bytesToWriteContent", () => {
  it("decodes text files to strings and keeps binaries as bytes", () => {
    const text = bytesToWriteContent(
      "log.lammps",
      new TextEncoder().encode("Step Temp"),
    );
    expect(text).toBe("Step Temp");

    const binary = bytesToWriteContent("frame.png", new Uint8Array([1, 2]));
    expect(binary).toBeInstanceOf(Uint8Array);
  });
});

describe("slug", () => {
  it("slugifies display names to [a-z0-9-]", () => {
    expect(slugify("Diffusion coefficients")).toBe("diffusion-coefficients");
    expect(slugify("Nanoporous SiO₂!")).toBe("nanoporous-sio2");
    expect(slugify("Étude thermique")).toBe("etude-thermique");
  });

  it("falls back for names with no usable characters", () => {
    expect(slugify("🔥🔥🔥")).toBe("project");
  });

  it("unique-ifies against taken slugs", () => {
    const taken = new Set(["diffusion", "diffusion-2"]);
    expect(uniqueSlug("Diffusion", taken)).toBe("diffusion-3");
    expect(uniqueSlug("Fresh", taken)).toBe("fresh");
  });
});
