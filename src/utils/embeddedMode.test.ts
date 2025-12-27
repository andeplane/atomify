import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isEmbeddedMode } from "./embeddedMode";

describe("isEmbeddedMode", () => {
  let originalLocation: Location;

  beforeEach(() => {
    // Save original location
    originalLocation = window.location;
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  // Helper function to mock window.location with specific search params
  const mockWindowLocation = (search: string) => {
    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        search,
      },
      writable: true,
    });
  };

  it("should return false when no embed params are present", () => {
    // Arrange
    mockWindowLocation("");

    // Act
    const result = isEmbeddedMode();

    // Assert
    expect(result).toBe(false);
  });

  it("should return true when embeddedSimulationUrl is present with valid simulationIndex", () => {
    // Arrange
    mockWindowLocation(
      "?embeddedSimulationUrl=https://example.com/sim.json&simulationIndex=0",
    );

    // Act
    const result = isEmbeddedMode();

    // Assert
    expect(result).toBe(true);
  });

  it("should return true when embeddedSimulationUrl is present with positive simulationIndex", () => {
    // Arrange
    mockWindowLocation(
      "?embeddedSimulationUrl=https://example.com/sim.json&simulationIndex=5",
    );

    // Act
    const result = isEmbeddedMode();

    // Assert
    expect(result).toBe(true);
  });

  it("should return false when embeddedSimulationUrl is present but simulationIndex is negative", () => {
    // Arrange
    mockWindowLocation(
      "?embeddedSimulationUrl=https://example.com/sim.json&simulationIndex=-1",
    );

    // Act
    const result = isEmbeddedMode();

    // Assert
    expect(result).toBe(false);
  });

  it("should return true when embeddedSimulationUrl is present but simulationIndex is missing (defaults to 0)", () => {
    // Arrange
    mockWindowLocation("?embeddedSimulationUrl=https://example.com/sim.json");

    // Act
    const result = isEmbeddedMode();

    // Assert
    // When simulationIndex is missing, it defaults to '0' which parses to 0, which is >= 0
    expect(result).toBe(true);
  });

  it("should return true when data param is present with embed=true", () => {
    // Arrange
    mockWindowLocation("?data=encodedSimulationData&embed=true");

    // Act
    const result = isEmbeddedMode();

    // Assert
    expect(result).toBe(true);
  });

  it("should return false when data param is present but embed=false", () => {
    // Arrange
    mockWindowLocation("?data=encodedSimulationData&embed=false");

    // Act
    const result = isEmbeddedMode();

    // Assert
    expect(result).toBe(false);
  });

  it("should return false when data param is present but embed param is missing", () => {
    // Arrange
    mockWindowLocation("?data=encodedSimulationData");

    // Act
    const result = isEmbeddedMode();

    // Assert
    expect(result).toBe(false);
  });

  it("should return false when data param is present but embed param is not 'true'", () => {
    // Arrange
    mockWindowLocation("?data=encodedSimulationData&embed=yes");

    // Act
    const result = isEmbeddedMode();

    // Assert
    expect(result).toBe(false);
  });

  it("should return true when both embeddedSimulationUrl and data params are present (prioritizes embeddedSimulationUrl)", () => {
    // Arrange
    mockWindowLocation(
      "?embeddedSimulationUrl=https://example.com/sim.json&simulationIndex=0&data=someData&embed=true",
    );

    // Act
    const result = isEmbeddedMode();

    // Assert
    expect(result).toBe(true);
  });

  it("should handle URL with other unrelated params", () => {
    // Arrange
    mockWindowLocation("?someOtherParam=value&anotherParam=test");

    // Act
    const result = isEmbeddedMode();

    // Assert
    expect(result).toBe(false);
  });

  it("should handle complex URL with mixed params", () => {
    // Arrange
    mockWindowLocation(
      "?foo=bar&embeddedSimulationUrl=https://example.com/file.json&simulationIndex=2&baz=qux",
    );

    // Act
    const result = isEmbeddedMode();

    // Assert
    expect(result).toBe(true);
  });

  it("should accept URLSearchParams as parameter", () => {
    // Arrange
    const params = new URLSearchParams(
      "?embeddedSimulationUrl=https://example.com/sim.json&simulationIndex=0",
    );

    // Act
    const result = isEmbeddedMode(params);

    // Assert
    expect(result).toBe(true);
  });

  it("should work with URLSearchParams parameter even when window.location differs", () => {
    // Arrange
    mockWindowLocation("?someOtherParam=value");
    const params = new URLSearchParams("?data=encodedData&embed=true");

    // Act
    const result = isEmbeddedMode(params);

    // Assert
    expect(result).toBe(true);
  });

  it("should handle invalid simulationIndex gracefully", () => {
    // Arrange
    mockWindowLocation(
      "?embeddedSimulationUrl=https://example.com/sim.json&simulationIndex=invalid",
    );

    // Act
    const result = isEmbeddedMode();

    // Assert
    // parseInt("invalid") returns NaN, which is falsy, so simulationIndex >= 0 is false
    expect(result).toBe(false);
  });

  it("should handle empty string simulationIndex (defaults to 0)", () => {
    // Arrange
    mockWindowLocation(
      "?embeddedSimulationUrl=https://example.com/sim.json&simulationIndex=",
    );

    // Act
    const result = isEmbeddedMode();

    // Assert
    // When simulationIndex is empty string, it defaults to '0' which parses to 0, which is >= 0
    expect(result).toBe(true);
  });

  it("should handle case sensitivity for embed param", () => {
    // Arrange
    mockWindowLocation("?data=encodedData&embed=True");

    // Act
    const result = isEmbeddedMode();

    // Assert
    // embed must be exactly "true" (case-sensitive)
    expect(result).toBe(false);
  });
});
