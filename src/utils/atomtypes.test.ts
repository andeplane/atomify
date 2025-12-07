import { describe, expect, it } from "vitest";
import { hexToRgb } from "./atomtypes";

describe("hexToRgb", () => {
  it("should convert hex color with # prefix to RGB array", () => {
    // Arrange
    const hex = "#CCCCCC";

    // Act
    const result = hexToRgb(hex);

    // Assert
    expect(result).toEqual([204, 204, 204]);
  });

  it("should convert hex color without # prefix to RGB array", () => {
    // Arrange
    const hex = "FFFFFF";

    // Act
    const result = hexToRgb(hex);

    // Assert
    expect(result).toEqual([255, 255, 255]);
  });

  it("should handle black color", () => {
    // Arrange
    const hex = "#000000";

    // Act
    const result = hexToRgb(hex);

    // Assert
    expect(result).toEqual([0, 0, 0]);
  });

  it("should handle pure red", () => {
    // Arrange
    const hex = "#FF0000";

    // Act
    const result = hexToRgb(hex);

    // Assert
    expect(result).toEqual([255, 0, 0]);
  });

  it("should handle pure green", () => {
    // Arrange
    const hex = "#00FF00";

    // Act
    const result = hexToRgb(hex);

    // Assert
    expect(result).toEqual([0, 255, 0]);
  });

  it("should handle pure blue", () => {
    // Arrange
    const hex = "#0000FF";

    // Act
    const result = hexToRgb(hex);

    // Assert
    expect(result).toEqual([0, 0, 255]);
  });

  it.each([
    { case: "lowercase", hex: "#abcdef" },
    { case: "uppercase", hex: "#ABCDEF" },
    { case: "mixed case", hex: "#AbCdEf" },
  ])("should handle $case hex values", ({ hex }) => {
    // Act
    const result = hexToRgb(hex);

    // Assert
    expect(result).toEqual([171, 205, 239]);
  });

  it("should throw error for invalid hex string", () => {
    // Arrange
    const invalidHex = "invalid-hex";

    // Act & Assert
    expect(() => hexToRgb(invalidHex)).toThrow("Invalid hex color string");
  });

  it("should throw error for short hex format", () => {
    // Arrange
    const shortHex = "#123";

    // Act & Assert
    expect(() => hexToRgb(shortHex)).toThrow("Invalid hex color string");
  });

  it("should throw error for hex with invalid characters", () => {
    // Arrange
    const invalidChars = "#GGGGGG";

    // Act & Assert
    expect(() => hexToRgb(invalidChars)).toThrow("Invalid hex color string");
  });

  it("should throw error for empty string", () => {
    // Arrange
    const empty = "";

    // Act & Assert
    expect(() => hexToRgb(empty)).toThrow("Invalid hex color string");
  });
});
