import { describe, it, expect } from "vitest";
import Modifier, { ModifierProps } from "./modifier";
import { ModifierInput, ModifierOutput } from "./types";

describe("Modifier", () => {
  describe("constructor", () => {
    it("should set name, key, and active from props", () => {
      const modifier = new Modifier({ name: "Test", active: true });

      expect(modifier.name).toBe("Test");
      expect(modifier.key).toBe("Test");
      expect(modifier.active).toBe(true);
    });

    it("should set active to false when passed false", () => {
      const modifier = new Modifier({ name: "Inactive", active: false });

      expect(modifier.active).toBe(false);
    });
  });

  describe("run", () => {
    it("should throw an error when called on the base class", () => {
      const modifier = new Modifier({ name: "Base", active: true });

      expect(() =>
        modifier.run(
          {} as ModifierInput,
          {} as ModifierOutput,
        ),
      ).toThrow("Modifier.run() is not implemented. Subclasses must override run().");
    });
  });

});
