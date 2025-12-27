import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getEmbeddingParams } from "./metrics";

describe("getEmbeddingParams", () => {
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

  it("should return embedMode false when no embed params are present", () => {
    // Arrange
    mockWindowLocation("");

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe(false);
    expect(result.embedFullscreen).toBe(false);
    expect(result.embedAutoStart).toBe(false);
  });

  it("should detect embedMode 'url' when embeddedSimulationUrl is present", () => {
    // Arrange
    mockWindowLocation("?embeddedSimulationUrl=https://example.com/sim.in");

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe("url");
    expect(result.embedFullscreen).toBe(false);
    expect(result.embedAutoStart).toBe(false);
  });

  it("should detect embedMode 'data' when data param is present", () => {
    // Arrange
    mockWindowLocation("?data=encodedSimulationData");

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe("data");
    expect(result.embedFullscreen).toBe(false);
    expect(result.embedAutoStart).toBe(false);
  });

  it("should detect embedFullscreen when embed=true", () => {
    // Arrange
    mockWindowLocation("?embed=true");

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe(false);
    expect(result.embedFullscreen).toBe(true);
    expect(result.embedAutoStart).toBe(false);
  });

  it("should detect embedAutoStart when autostart=true", () => {
    // Arrange
    mockWindowLocation("?autostart=true");

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe(false);
    expect(result.embedFullscreen).toBe(false);
    expect(result.embedAutoStart).toBe(true);
  });

  it("should handle multiple params together", () => {
    // Arrange
    mockWindowLocation("?data=encodedData&embed=true&autostart=true");

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe("data");
    expect(result.embedFullscreen).toBe(true);
    expect(result.embedAutoStart).toBe(true);
  });

  it("should prioritize embeddedSimulationUrl over data param", () => {
    // Arrange
    mockWindowLocation(
      "?embeddedSimulationUrl=https://example.com&data=someData",
    );

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe("url");
  });

  it("should return false for embedFullscreen when embed param is not 'true'", () => {
    // Arrange
    mockWindowLocation("?embed=false");

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedFullscreen).toBe(false);
  });

  it("should return false for embedAutoStart when autostart param is not 'true'", () => {
    // Arrange
    mockWindowLocation("?autostart=false");

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedAutoStart).toBe(false);
  });

  it("should handle URL with other unrelated params", () => {
    // Arrange
    mockWindowLocation("?someOtherParam=value&anotherParam=test");

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe(false);
    expect(result.embedFullscreen).toBe(false);
    expect(result.embedAutoStart).toBe(false);
  });

  it("should handle complex URL with mixed params", () => {
    // Arrange
    mockWindowLocation(
      "?foo=bar&embeddedSimulationUrl=https://example.com/file.in&baz=qux&embed=true",
    );

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe("url");
    expect(result.embedFullscreen).toBe(true);
    expect(result.embedAutoStart).toBe(false);
  });
});
