import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { base64ToU8A, u8aToBase64 } from "./codec";

// Store original implementations for restoration
let originalBtoa: typeof global.btoa;
let originalAtob: typeof global.atob;

// Mock window.btoa and window.atob for testing
beforeEach(() => {
  // Save original implementations
  originalBtoa = global.btoa;
  originalAtob = global.atob;

  // Ensure they're available (they should be in jsdom, but just in case)
  if (!global.btoa) {
    global.btoa = (str: string) => Buffer.from(str, "binary").toString("base64");
  }
  if (!global.atob) {
    global.atob = (str: string) => Buffer.from(str, "base64").toString("binary");
  }
});

afterEach(() => {
  // Restore original implementations to prevent test pollution
  global.btoa = originalBtoa;
  global.atob = originalAtob;
});

describe("u8aToBase64", () => {
  it("should convert Uint8Array to base64 string", () => {
    // Arrange
    const input = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

    // Act
    const result = u8aToBase64(input);

    // Assert
    expect(result).toBe("SGVsbG8=");
  });

  it("should handle empty array", () => {
    // Arrange
    const input = new Uint8Array([]);

    // Act
    const result = u8aToBase64(input);

    // Assert
    expect(result).toBe("");
  });

  it("should handle single byte", () => {
    // Arrange
    const input = new Uint8Array([65]); // "A"

    // Act
    const result = u8aToBase64(input);

    // Assert
    expect(result).toBe("QQ==");
  });

  it("should handle binary data", () => {
    // Arrange
    const input = new Uint8Array([0, 1, 2, 3, 4, 5]);

    // Act
    const result = u8aToBase64(input);

    // Assert
    expect(result).toBe("AAECAwQF");
  });

  it("should handle large arrays by chunking", () => {
    // Arrange
    const size = 100000;
    const input = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      input[i] = i % 256;
    }

    // Act
    const result = u8aToBase64(input);

    // Assert
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });

  it("should respect custom applyMax parameter", () => {
    // Arrange
    const input = new Uint8Array([72, 101, 108, 108, 111]);
    const applyMax = 2; // Force chunking

    // Act
    const result = u8aToBase64(input, applyMax);

    // Assert
    expect(result).toBe("SGVsbG8=");
  });
});

describe("base64ToU8A", () => {
  it("should convert base64 string to Uint8Array", () => {
    // Arrange
    const input = "SGVsbG8="; // "Hello"

    // Act
    const result = base64ToU8A(input);

    // Assert
    expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });

  it("should handle empty string", () => {
    // Arrange
    const input = "";

    // Act
    const result = base64ToU8A(input);

    // Assert
    expect(result).toEqual(new Uint8Array([]));
  });

  it("should handle single character", () => {
    // Arrange
    const input = "QQ=="; // "A"

    // Act
    const result = base64ToU8A(input);

    // Assert
    expect(result).toEqual(new Uint8Array([65]));
  });

  it("should handle binary data", () => {
    // Arrange
    const input = "AAECAwQF";

    // Act
    const result = base64ToU8A(input);

    // Assert
    expect(result).toEqual(new Uint8Array([0, 1, 2, 3, 4, 5]));
  });
});

describe("base64 round-trip", () => {
  it("should correctly encode and decode text", () => {
    // Arrange
    const originalText = "Hello, World!";
    const encoder = new TextEncoder();
    const originalBytes = encoder.encode(originalText);

    // Act
    const encoded = u8aToBase64(originalBytes);
    const decoded = base64ToU8A(encoded);
    const decoder = new TextDecoder();
    const decodedText = decoder.decode(decoded);

    // Assert
    expect(decodedText).toBe(originalText);
  });

  it("should correctly encode and decode binary data", () => {
    // Arrange
    const original = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);

    // Act
    const encoded = u8aToBase64(original);
    const decoded = base64ToU8A(encoded);

    // Assert
    expect(decoded).toEqual(original);
  });

  it("should handle special characters", () => {
    // Arrange
    const originalText = "Test with émojis 🚀 and spëcial çhars!";
    const encoder = new TextEncoder();
    const originalBytes = encoder.encode(originalText);

    // Act
    const encoded = u8aToBase64(originalBytes);
    const decoded = base64ToU8A(encoded);
    const decoder = new TextDecoder();
    const decodedText = decoder.decode(decoded);

    // Assert
    expect(decodedText).toBe(originalText);
  });

  it("should handle large data", () => {
    // Arrange
    const size = 10000;
    const original = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      original[i] = i % 256;
    }

    // Act
    const encoded = u8aToBase64(original);
    const decoded = base64ToU8A(encoded);

    // Assert
    expect(decoded).toEqual(original);
  });
});
