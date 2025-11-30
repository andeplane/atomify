import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { plotDataToCsv, exportPlotDataToCsv } from "./exportCsv";
import { Data1D } from "../types";

describe("plotDataToCsv", () => {
  it("should convert simple plot data to CSV format", () => {
    // Arrange
    const data1D: Data1D = {
      data: [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
      labels: ["x", "y"],
    };

    // Act
    const csv = plotDataToCsv(data1D);

    // Assert
    const expected = "x,y\n0,1\n1,2\n2,3";
    expect(csv).toBe(expected);
  });

  it("should handle multiple columns", () => {
    // Arrange
    const data1D: Data1D = {
      data: [
        [0, 1, 2, 3],
        [1, 2, 3, 4],
      ],
      labels: ["time", "temperature", "pressure", "energy"],
    };

    // Act
    const csv = plotDataToCsv(data1D);

    // Assert
    const expected = "time,temperature,pressure,energy\n0,1,2,3\n1,2,3,4";
    expect(csv).toBe(expected);
  });

  it("should handle empty data array", () => {
    // Arrange
    const data1D: Data1D = {
      data: [],
      labels: ["x", "y"],
    };

    // Act
    const csv = plotDataToCsv(data1D);

    // Assert
    expect(csv).toBe("x,y\n");
  });

  it("should handle single data row", () => {
    // Arrange
    const data1D: Data1D = {
      data: [[42, 3.14]],
      labels: ["answer", "pi"],
    };

    // Act
    const csv = plotDataToCsv(data1D);

    // Assert
    expect(csv).toBe("answer,pi\n42,3.14");
  });

  it("should handle decimal numbers", () => {
    // Arrange
    const data1D: Data1D = {
      data: [
        [0.0, 1.234],
        [0.5, 2.345],
        [1.0, 3.456],
      ],
      labels: ["time", "value"],
    };

    // Act
    const csv = plotDataToCsv(data1D);

    // Assert
    const expected = "time,value\n0,1.234\n0.5,2.345\n1,3.456";
    expect(csv).toBe(expected);
  });

  it("should handle negative numbers", () => {
    // Arrange
    const data1D: Data1D = {
      data: [
        [-1, -2],
        [0, 0],
        [1, 2],
      ],
      labels: ["x", "y"],
    };

    // Act
    const csv = plotDataToCsv(data1D);

    // Assert
    const expected = "x,y\n-1,-2\n0,0\n1,2";
    expect(csv).toBe(expected);
  });

  it("should handle scientific notation", () => {
    // Arrange
    const data1D: Data1D = {
      data: [
        [0, 1e-10],
        [1, 2e10],
      ],
      labels: ["x", "y"],
    };

    // Act
    const csv = plotDataToCsv(data1D);

    // Assert
    const expected = "x,y\n0,1e-10\n1,20000000000";
    expect(csv).toBe(expected);
  });
});

describe("exportPlotDataToCsv", () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let mockLink: {
    setAttribute: ReturnType<typeof vi.fn>;
    click: ReturnType<typeof vi.fn>;
    style: { visibility: string };
  };

  beforeEach(() => {
    // Create mock link element
    mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: { visibility: "" },
    };

    // Mock document.createElement
    createElementSpy = vi.spyOn(document, "createElement").mockReturnValue(
      mockLink as unknown as HTMLElement,
    );

    // Mock URL.createObjectURL and URL.revokeObjectURL
    createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("mock-url");
    revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    // Mock document.body methods
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockLink as unknown as Node);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockLink as unknown as Node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create a downloadable CSV file", () => {
    // Arrange
    const data1D: Data1D = {
      data: [
        [0, 1],
        [1, 2],
      ],
      labels: ["x", "y"],
    };

    // Act
    exportPlotDataToCsv(data1D);

    // Assert
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(mockLink.setAttribute).toHaveBeenCalledWith("href", "mock-url");
    expect(mockLink.setAttribute).toHaveBeenCalledWith("download", "plot-data.csv");
    expect(mockLink.click).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("mock-url");
  });

  it("should use custom filename when provided", () => {
    // Arrange
    const data1D: Data1D = {
      data: [[0, 1]],
      labels: ["x", "y"],
    };
    const customFilename = "my-custom-plot.csv";

    // Act
    exportPlotDataToCsv(data1D, customFilename);

    // Assert
    expect(mockLink.setAttribute).toHaveBeenCalledWith("download", customFilename);
  });

  it("should create blob with correct CSV content", () => {
    // Arrange
    const data1D: Data1D = {
      data: [
        [0, 1],
        [1, 2],
      ],
      labels: ["time", "value"],
    };

    const blobSpy = vi.spyOn(global, "Blob");

    // Act
    exportPlotDataToCsv(data1D);

    // Assert
    expect(blobSpy).toHaveBeenCalledWith(
      ["time,value\n0,1\n1,2"],
      { type: "text/csv;charset=utf-8;" },
    );
  });

  it("should set link visibility to hidden", () => {
    // Arrange
    const data1D: Data1D = {
      data: [[0, 1]],
      labels: ["x", "y"],
    };

    // Act
    exportPlotDataToCsv(data1D);

    // Assert
    expect(mockLink.style.visibility).toBe("hidden");
  });

  it("should append and remove link from document body", () => {
    // Arrange
    const data1D: Data1D = {
      data: [[0, 1]],
      labels: ["x", "y"],
    };
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    // Act
    exportPlotDataToCsv(data1D);

    // Assert
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
  });
});
