import { describe, it, expect } from "vitest";
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

  it("should handle lowercase hex values", () => {
    // Arrange
    const hex = "#abcdef";

    // Act
    const result = hexToRgb(hex);

    // Assert
    expect(result).toEqual([171, 205, 239]);
  });

  it("should handle uppercase hex values", () => {
    // Arrange
    const hex = "#ABCDEF";

    // Act
    const result = hexToRgb(hex);

    // Assert
    expect(result).toEqual([171, 205, 239]);
  });

  it("should handle mixed case hex values", () => {
    // Arrange
    const hex = "#AbCdEf";

    // Act
    const result = hexToRgb(hex);

    // Assert
    expect(result).toEqual([171, 205, 239]);
  });
});

