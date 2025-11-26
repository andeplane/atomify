import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  it("should return embedMode false when no embed params are present", () => {
    // Arrange
    const mockLocation = {
      ...originalLocation,
      search: "",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe(false);
    expect(result.embedFullscreen).toBe(false);
    expect(result.embedAutoStart).toBe(false);
  });

  it("should detect embedMode 'url' when embeddedSimulationUrl is present", () => {
    // Arrange
    const mockLocation = {
      ...originalLocation,
      search: "?embeddedSimulationUrl=https://example.com/sim.in",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe("url");
    expect(result.embedFullscreen).toBe(false);
    expect(result.embedAutoStart).toBe(false);
  });

  it("should detect embedMode 'data' when data param is present", () => {
    // Arrange
    const mockLocation = {
      ...originalLocation,
      search: "?data=encodedSimulationData",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe("data");
    expect(result.embedFullscreen).toBe(false);
    expect(result.embedAutoStart).toBe(false);
  });

  it("should detect embedFullscreen when embed=true", () => {
    // Arrange
    const mockLocation = {
      ...originalLocation,
      search: "?embed=true",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe(false);
    expect(result.embedFullscreen).toBe(true);
    expect(result.embedAutoStart).toBe(false);
  });

  it("should detect embedAutoStart when autostart=true", () => {
    // Arrange
    const mockLocation = {
      ...originalLocation,
      search: "?autostart=true",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe(false);
    expect(result.embedFullscreen).toBe(false);
    expect(result.embedAutoStart).toBe(true);
  });

  it("should handle multiple params together", () => {
    // Arrange
    const mockLocation = {
      ...originalLocation,
      search:
        "?data=encodedData&embed=true&autostart=true",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe("data");
    expect(result.embedFullscreen).toBe(true);
    expect(result.embedAutoStart).toBe(true);
  });

  it("should prioritize embeddedSimulationUrl over data param", () => {
    // Arrange
    const mockLocation = {
      ...originalLocation,
      search: "?embeddedSimulationUrl=https://example.com&data=someData",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe("url");
  });

  it("should return false for embedFullscreen when embed param is not 'true'", () => {
    // Arrange
    const mockLocation = {
      ...originalLocation,
      search: "?embed=false",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedFullscreen).toBe(false);
  });

  it("should return false for embedAutoStart when autostart param is not 'true'", () => {
    // Arrange
    const mockLocation = {
      ...originalLocation,
      search: "?autostart=false",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedAutoStart).toBe(false);
  });

  it("should handle URL with other unrelated params", () => {
    // Arrange
    const mockLocation = {
      ...originalLocation,
      search: "?someOtherParam=value&anotherParam=test",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe(false);
    expect(result.embedFullscreen).toBe(false);
    expect(result.embedAutoStart).toBe(false);
  });

  it("should handle complex URL with mixed params", () => {
    // Arrange
    const mockLocation = {
      ...originalLocation,
      search:
        "?foo=bar&embeddedSimulationUrl=https://example.com/file.in&baz=qux&embed=true",
    };
    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    // Act
    const result = getEmbeddingParams();

    // Assert
    expect(result.embedMode).toBe("url");
    expect(result.embedFullscreen).toBe(true);
    expect(result.embedAutoStart).toBe(false);
  });
});

