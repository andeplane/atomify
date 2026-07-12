import { describe, it, expect } from "vitest";
import {
  formatBytes,
  formatDuration,
  greeting,
  relativeTime,
  runNumber,
} from "./format";

describe("formatBytes", () => {
  it("formats across unit boundaries", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2.1 * 1024)).toBe("2.1 KB");
    expect(formatBytes(320 * 1024 * 1024)).toBe("320 MB");
  });

  it("handles invalid input", () => {
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-07-11T12:00:00Z");

  it("formats recent and older timestamps", () => {
    expect(relativeTime("2026-07-11T11:59:50Z", now)).toBe("just now");
    expect(relativeTime("2026-07-11T11:58:00Z", now)).toBe("2 min ago");
    expect(relativeTime("2026-07-11T09:00:00Z", now)).toBe("3 h ago");
    expect(relativeTime("2026-07-10T09:00:00Z", now)).toBe("Yesterday");
    expect(relativeTime("2026-07-08T09:00:00Z", now)).toBe("3 days ago");
    expect(relativeTime("2026-07-01T09:00:00Z", now)).toBe("Last week");
  });

  it("handles invalid dates", () => {
    expect(relativeTime("not a date", now)).toBe("—");
  });
});

describe("runNumber", () => {
  it("strips the run- prefix and keeps padding", () => {
    expect(runNumber("run-005")).toBe("005");
    expect(runNumber("run-123")).toBe("123");
  });

  it("passes external run names through", () => {
    expect(runNumber("run-T3.0")).toBe("run-T3.0");
    expect(runNumber("my-sweep")).toBe("my-sweep");
  });
});

describe("formatDuration", () => {
  it("formats seconds, minutes, and hours", () => {
    expect(formatDuration(42)).toBe("42 s");
    expect(formatDuration(8 * 60 + 12)).toBe("8 min 12 s");
    expect(formatDuration(3 * 3600 + 20 * 60)).toBe("3 h 20 min");
    expect(formatDuration(undefined)).toBe("—");
  });
});

describe("greeting", () => {
  it("matches the time of day", () => {
    expect(greeting(new Date("2026-07-11T08:00:00"))).toBe("Good morning");
    expect(greeting(new Date("2026-07-11T14:00:00"))).toBe("Good afternoon");
    expect(greeting(new Date("2026-07-11T21:00:00"))).toBe("Good evening");
  });
});
