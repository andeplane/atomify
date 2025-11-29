import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsoleModal from "./ConsoleModal";
import type { StoreModel } from "../store/model";
import { useStoreState, useStoreActions } from "../hooks";

// Mock the Console component
vi.mock("../containers/Console", () => ({
  default: vi.fn(() => <div data-testid="console">Console Content</div>),
}));

// Mock the hooks
const mockSetShowConsole = vi.fn();
const mockSetPreferredView = vi.fn();

vi.mock("../hooks", () => ({
  useStoreState: vi.fn(),
  useStoreActions: vi.fn(),
}));

describe("ConsoleModal", () => {
  let mockClipboard: { writeText: ReturnType<typeof vi.fn> };
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let appendChildSpy: ReturnType<typeof vi.spyOn>;
  let removeChildSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let execCommandSpy: ReturnType<typeof vi.spyOn>;
  let showConsoleValue: boolean;
  let lammpsOutputValue: string[];

  beforeEach(() => {
    // Mock clipboard API
    mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });

    // Mock document methods for download
    createElementSpy = vi.spyOn(document, "createElement");
    appendChildSpy = vi.spyOn(document.body, "appendChild");
    removeChildSpy = vi.spyOn(document.body, "removeChild");
    clickSpy = vi.fn();
    execCommandSpy = vi.spyOn(document, "execCommand").mockReturnValue(true);

    // Mock URL methods
    createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
    revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    // Mock link element
    const mockLink = {
      href: "",
      download: "",
      click: clickSpy,
    } as Partial<HTMLAnchorElement> as HTMLAnchorElement;
    createElementSpy.mockReturnValue(mockLink);

    // Setup store mocks - useStoreState is called multiple times with different selectors
    vi.mocked(useStoreState).mockImplementation((selector: (state: StoreModel) => unknown) => {
      // Check which property is being accessed by calling the selector with a mock state
      const mockState = {
        simulation: {
          showConsole: showConsoleValue,
          lammpsOutput: lammpsOutputValue,
        },
      } as StoreModel;
      return selector(mockState);
    });

    vi.mocked(useStoreActions).mockImplementation(() => ({
      simulation: {
        setShowConsole: mockSetShowConsole,
      },
      app: {
        setPreferredView: mockSetPreferredView,
      },
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should not render when showConsole is false", () => {
      // Arrange
      showConsoleValue = false;
      lammpsOutputValue = [];

      // Act
      const { container } = render(<ConsoleModal />);

      // Assert
      expect(container.firstChild).toBeNull();
    });

    it("should render modal when showConsole is true", () => {
      // Arrange
      showConsoleValue = true;
      lammpsOutputValue = ["log line 1", "log line 2"];

      // Act
      render(<ConsoleModal />);

      // Assert
      expect(screen.getByTestId("console")).toBeInTheDocument();
      expect(screen.getByText("Download logs")).toBeInTheDocument();
      expect(screen.getByText("Copy logs")).toBeInTheDocument();
      expect(screen.getByText("Analyze in notebook")).toBeInTheDocument();
      expect(screen.getByText("Close")).toBeInTheDocument();
    });
  });

  describe("download logs", () => {
    it("should download logs as text file when Download logs button is clicked", async () => {
      // Arrange
      showConsoleValue = true;
      lammpsOutputValue = ["line 1", "line 2", "line 3"];

      render(<ConsoleModal />);
      const downloadButton = screen.getByText("Download logs");

      // Act
      await userEvent.click(downloadButton);

      // Assert
      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:url");

      // Verify blob creation
      const blobCalls = createObjectURLSpy.mock.calls;
      expect(blobCalls.length).toBeGreaterThan(0);
      const blob = blobCalls[0][0] as Blob;
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("text/plain");
    });

    it("should generate filename with current date", async () => {
      // Arrange
      showConsoleValue = true;
      lammpsOutputValue = ["test log"];
      const mockDate = new Date("2024-01-15T12:00:00Z");
      vi.spyOn(global, "Date").mockImplementation(() => mockDate as unknown as Date);
      vi.spyOn(mockDate, "toISOString").mockReturnValue("2024-01-15T12:00:00.000Z");

      render(<ConsoleModal />);
      const downloadButton = screen.getByText("Download logs");

      // Act
      await userEvent.click(downloadButton);

      // Assert
      const linkElement = createElementSpy.mock.results[0].value as HTMLAnchorElement;
      expect(linkElement.download).toBe("lammps-logs-2024-01-15.txt");
    });
  });

  describe("copy logs", () => {
    it("should copy logs to clipboard when Copy logs button is clicked", async () => {
      // Arrange
      showConsoleValue = true;
      lammpsOutputValue = ["line 1", "line 2"];

      render(<ConsoleModal />);
      const copyButton = screen.getByText("Copy logs");

      // Act
      await userEvent.click(copyButton);

      // Assert
      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith("line 1\nline 2");
      });
    });

    it("should use fallback method when clipboard API fails", async () => {
      // Arrange
      showConsoleValue = true;
      lammpsOutputValue = ["fallback test"];
      mockClipboard.writeText.mockRejectedValue(new Error("Clipboard API not available"));

      // Mock textarea element for fallback
      const mockTextArea = {
        value: "",
        style: {} as CSSStyleDeclaration,
        select: vi.fn(),
      } as Partial<HTMLTextAreaElement> as HTMLTextAreaElement;
      createElementSpy.mockReturnValueOnce(mockTextArea);

      render(<ConsoleModal />);
      const copyButton = screen.getByText("Copy logs");

      // Act
      await userEvent.click(copyButton);

      // Assert
      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith("textarea");
        expect(mockTextArea.value).toBe("fallback test");
        expect(appendChildSpy).toHaveBeenCalled();
        expect(mockTextArea.select).toHaveBeenCalled();
        expect(execCommandSpy).toHaveBeenCalledWith("copy");
        expect(removeChildSpy).toHaveBeenCalled();
      });
    });
  });

  describe("analyze in notebook", () => {
    it("should close modal and set preferred view to notebook when Analyze in notebook button is clicked", async () => {
      // Arrange
      showConsoleValue = true;
      lammpsOutputValue = [];

      render(<ConsoleModal />);
      const analyzeButton = screen.getByText("Analyze in notebook");

      // Act
      await userEvent.click(analyzeButton);

      // Assert
      expect(mockSetShowConsole).toHaveBeenCalledWith(false);
      expect(mockSetPreferredView).toHaveBeenCalledTimes(2);
      expect(mockSetPreferredView).toHaveBeenNthCalledWith(1, undefined);
      expect(mockSetPreferredView).toHaveBeenNthCalledWith(2, "notebook");
    });
  });

  describe("close", () => {
    it("should close modal when Close button is clicked", async () => {
      // Arrange
      showConsoleValue = true;
      lammpsOutputValue = [];

      render(<ConsoleModal />);
      const closeButton = screen.getByText("Close");

      // Act
      await userEvent.click(closeButton);

      // Assert
      expect(mockSetShowConsole).toHaveBeenCalledWith(false);
    });

    it("should close modal when onCancel is triggered", async () => {
      // Arrange
      showConsoleValue = true;
      lammpsOutputValue = [];

      render(<ConsoleModal />);
      const modal = screen.getByRole("dialog");

      // Act - simulate ESC key or backdrop click
      await userEvent.keyboard("{Escape}");

      // Assert
      expect(mockSetShowConsole).toHaveBeenCalledWith(false);
    });
  });

  describe("console key update", () => {
    it("should update console key when showConsole changes to true", async () => {
      // Arrange
      showConsoleValue = false;
      lammpsOutputValue = [];

      const { rerender } = render(<ConsoleModal />);
      expect(screen.queryByTestId("console")).not.toBeInTheDocument();

      // Act - change showConsole to true
      showConsoleValue = true;
      rerender(<ConsoleModal />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("console")).toBeInTheDocument();
      });
    });
  });
});
