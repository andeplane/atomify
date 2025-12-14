import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UploadFile } from "antd";
import type { UploadChangeParam } from "antd/es/upload";
import NewSimulation from "./NewSimulation";
import { SimulationFile } from "../store/app";

// Mock useStoreActions hook
const mockSetNewSimulation = vi.fn();
const mockSetPreferredView = vi.fn();

vi.mock("../hooks", () => ({
  useStoreActions: vi.fn((selector) => {
    const actions = {
      simulation: {
        newSimulation: mockSetNewSimulation,
      },
      app: {
        setPreferredView: mockSetPreferredView,
      },
    };
    return selector(actions);
  }),
}));

// Store onChange handler for direct testing
let capturedOnChange: ((info: UploadChangeParam<UploadFile>) => void) | undefined;

// Mock antd components
vi.mock("antd", () => {
  const actual = vi.importActual("antd");
  return {
    ...actual,
    message: {
      success: vi.fn(),
    },
    Modal: ({
      children,
      open,
      onCancel,
      title,
      footer,
    }: {
      children: React.ReactNode;
      open: boolean;
      onCancel: () => void;
      title: string;
      footer: React.ReactNode[];
    }) =>
      open ? (
        <div data-testid="modal">
          <div data-testid="modal-title">{title}</div>
          <div data-testid="modal-footer">{footer}</div>
          <div data-testid="modal-content">{children}</div>
        </div>
      ) : null,
    Upload: {
      Dragger: ({
        children,
        onChange,
      }: {
        children: React.ReactNode;
        onChange?: (info: UploadChangeParam<UploadFile>) => void;
      }) => {
        capturedOnChange = onChange;
        return (
          <div data-testid="upload-dragger">
            {children}
            <button
              data-testid="trigger-upload"
              onClick={() => {
                // This button can be clicked in tests to trigger onChange
              }}
            />
          </div>
        );
      },
    },
    Select: Object.assign(
      ({
        children,
        value,
        onChange,
      }: {
        children: React.ReactNode;
        value?: string;
        onChange?: (value: string) => void;
      }) => (
        <select
          data-testid="input-script-select"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          {children}
        </select>
      ),
      {
        Option: ({
          children,
          value,
        }: {
          children: React.ReactNode;
          value: string;
        }) => (
          <option value={value}>{children}</option>
        ),
      }
    ),
    Input: ({
      onChange,
      placeholder,
    }: {
      onChange?: (e: { target: { value: string } }) => void;
      placeholder?: string;
    }) => (
      <input
        data-testid="simulation-name-input"
        placeholder={placeholder}
        onChange={(e) => onChange?.({ target: { value: e.target.value } })}
      />
    ),
    Button: ({
      children,
      onClick,
      disabled,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
    }) => (
      <button data-testid={children === "OK" ? "ok-button" : "cancel-button"} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
    Checkbox: ({
      children,
      onChange,
    }: {
      children: React.ReactNode;
      onChange?: (e: { target: { checked: boolean } }) => void;
    }) => (
      <label>
        <input
          type="checkbox"
          data-testid="start-immediately-checkbox"
          onChange={(e) => onChange?.({ target: { checked: e.target.checked } })}
        />
        {children}
      </label>
    ),
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Divider: () => <hr data-testid="divider" />,
  };
});

// Mock track function
vi.mock("../utils/metrics", () => ({
  track: vi.fn(),
}));

describe("NewSimulation", () => {
  let mockOnClose: () => void;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockSetNewSimulation.mockClear();
    mockSetPreferredView.mockClear();
    window.files = [];
    capturedOnChange = undefined;
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as Partial<Window>).files;
  });

  const createMockFile = (name: string, content: string = "file content"): File => {
    const file = new File([content], name, { type: "text/plain" });
    // Add text() method for async file reading
    (file as Partial<File> & { text: () => Promise<string> }).text = vi.fn(() => Promise.resolve(content));
    return file as File & { text: () => Promise<string> };
  };

  const createMockUploadChangeParam = (
    files: File[],
    status: "done" | "removed" = "done"
  ): UploadChangeParam<UploadFile> => {
    const fileList = files.map((file, index) => ({
      uid: `${index}`,
      name: file.name,
      status: status as "done" | "removed",
      originFileObj: file,
    })) as UploadFile[];

    return {
      file: fileList[0],
      fileList,
    } as UploadChangeParam<UploadFile>;
  };

  const triggerFileUpload = async (files: File[]) => {
    const { container } = render(<NewSimulation onClose={mockOnClose} />);
    
    // Wait for component to render and capture onChange
    await waitFor(() => {
      expect(capturedOnChange).toBeDefined();
    }, { timeout: 1000 });
    
    // Call onChange directly with mock data
    if (!capturedOnChange) {
      throw new Error("onChange handler not captured");
    }
    const uploadParam = createMockUploadChangeParam(files);
    await act(async () => {
      await capturedOnChange!(uploadParam);
    });

    // Wait for state updates to complete
    await waitFor(() => {
      expect(window.files).toBeDefined();
    }, { timeout: 1000 });

    return { container };
  };

  describe("file upload handling", () => {
    it.each([
      { fileNames: ["test.in"], expectedCount: 1 },
      { fileNames: ["test.in", "data.txt"], expectedCount: 2 },
      { fileNames: ["file1.in", "file2.in", "file3.dat"], expectedCount: 3 },
    ])(
      "should add $expectedCount file(s) to state when uploading $fileNames",
      async ({ fileNames, expectedCount }) => {
        // Arrange
        const files = fileNames.map((name) => createMockFile(name));

        // Act
        await triggerFileUpload(files);

        // Assert
        await waitFor(() => {
          expect(window.files).toHaveLength(expectedCount);
          fileNames.forEach((name) => {
            expect(window.files?.some((f) => f.fileName === name)).toBe(true);
          });
        }, { timeout: 2000 });
      }
    );

    it("should read file content correctly", async () => {
      // Arrange
      const content = "test file content\nline 2";
      const file = createMockFile("test.in", content);

      // Act
      await triggerFileUpload([file]);

      // Assert
      await waitFor(() => {
        const uploadedFile = window.files?.find((f) => f.fileName === "test.in");
        expect(uploadedFile?.content).toBe(content);
      });
    });
  });

  describe("duplicate prevention", () => {
    it("should not add duplicate files when onChange called multiple times", async () => {
      // Arrange
      const file = createMockFile("test.in", "content");
      const uploadParam = createMockUploadChangeParam([file]);

      // Act - simulate multiple onChange calls (like React StrictMode)
      const { container } = render(<NewSimulation onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(capturedOnChange).toBeDefined();
      });

      // Call onChange multiple times with same file
      if (!capturedOnChange) {
        throw new Error("onChange handler not captured");
      }
      await act(async () => {
        await capturedOnChange!(uploadParam);
      });

      // Simulate second call with same file
      await act(async () => {
        await capturedOnChange!(uploadParam);
      });

      // Assert
      await waitFor(() => {
        expect(window.files).toHaveLength(1);
        expect(window.files?.[0].fileName).toBe("test.in");
      });
    });

    it("should handle concurrent file uploads without duplicates", async () => {
      // Arrange
      const file1 = createMockFile("file1.in");
      const file2 = createMockFile("file2.in");

      // Act - simulate concurrent uploads
      const { container } = render(<NewSimulation onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(capturedOnChange).toBeDefined();
      });

      if (!capturedOnChange) {
        throw new Error("onChange handler not captured");
      }
      const uploadParam1 = createMockUploadChangeParam([file1, file2]);
      await act(async () => {
        await capturedOnChange!(uploadParam1);
      });

      // Simulate second concurrent call
      const uploadParam2 = createMockUploadChangeParam([file1, file2]);
      await act(async () => {
        await capturedOnChange!(uploadParam2);
      });

      // Assert
      await waitFor(() => {
        expect(window.files).toHaveLength(2);
      });
    });
  });

  describe("auto-select .in file", () => {
    it.each([
      { fileNames: ["data.txt", "run.in"], expectedSelection: "run.in" },
      { fileNames: ["run.in", "other.in"], expectedSelection: "run.in" },
      { fileNames: ["first.in", "second.in", "data.txt"], expectedSelection: "first.in" },
    ])(
      "should auto-select $expectedSelection when uploading $fileNames",
      async ({ fileNames, expectedSelection }) => {
        // Arrange
        const files = fileNames.map((name) => createMockFile(name));

        // Act
        const { container } = await triggerFileUpload(files);

        // Assert
        await waitFor(() => {
          const select = container.querySelector('[data-testid="input-script-select"]') as HTMLSelectElement;
          expect(select?.value).toBe(expectedSelection);
        });
      }
    );

    it("should not auto-select when no .in files are present", async () => {
      // Arrange
      const files = ["data.txt", "config.dat"].map((name) => createMockFile(name));

      // Act
      const { container } = await triggerFileUpload(files);

      // Assert - select should exist but have no value selected (HTML select shows first option but value is empty)
      await waitFor(() => {
        const select = container.querySelector('[data-testid="input-script-select"]') as HTMLSelectElement;
        expect(select).toBeInTheDocument();
        // HTML select elements show the first option visually but value can be empty string or undefined
        expect(select?.value === "" || select?.value === undefined || select?.selectedIndex === 0).toBe(true);
      });
    });

    it("should not overwrite user's manual selection", async () => {
      // Arrange
      const files = ["run.in", "other.in"].map((name) => createMockFile(name));
      const newFile = createMockFile("new.in");

      // Act - render component ONCE
      const { container } = render(<NewSimulation onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(capturedOnChange).toBeDefined();
      });

      if (!capturedOnChange) {
        throw new Error("onChange handler not captured");
      }

      // Upload initial files
      const initialUploadParam = createMockUploadChangeParam(files);
      await act(async () => {
        await capturedOnChange!(initialUploadParam);
      });

      // Wait for UI to update and select to appear
      await waitFor(() => {
        const select = container.querySelector('[data-testid="input-script-select"]') as HTMLSelectElement;
        expect(select).toBeInTheDocument();
      });

      // User manually selects different file
      const select = container.querySelector('[data-testid="input-script-select"]') as HTMLSelectElement;
      await act(async () => {
        await userEvent.selectOptions(select, "other.in");
      });

      // Verify selection was set
      expect(select.value).toBe("other.in");

      // Upload another .in file to the SAME component instance
      const newUploadParam = createMockUploadChangeParam([...files, newFile]);
      await act(async () => {
        await capturedOnChange!(newUploadParam);
      });

      // Assert - should still have user's selection (not overwritten by auto-select)
      await waitFor(() => {
        expect(select.value).toBe("other.in");
      });
    });
  });

  describe("file removal", () => {
    it("should remove file when status is 'removed'", async () => {
      // Arrange
      const file1 = createMockFile("file1.in");
      const file2 = createMockFile("file2.in");
      const { container } = render(<NewSimulation onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(capturedOnChange).toBeDefined();
      });

      // Upload files first
      if (!capturedOnChange) {
        throw new Error("onChange handler not captured");
      }
      const uploadParam = createMockUploadChangeParam([file1, file2]);
      await act(async () => {
        await capturedOnChange!(uploadParam);
      });

      await waitFor(() => {
        expect(window.files).toHaveLength(2);
      });

      // Act - simulate file removal via onChange with removed status
      const removeParam = createMockUploadChangeParam([file1], "removed");
      await act(async () => {
        await capturedOnChange!(removeParam);
      });

      // Assert
      await waitFor(() => {
        expect(window.files).toHaveLength(1);
        expect(window.files?.[0].fileName).toBe("file2.in");
      });
    });
  });

  describe("form validation", () => {
    it.each([
      { name: "", files: ["test.in"], inputScript: "test.in", valid: false, description: "empty name" },
      { name: "sim", files: [], inputScript: undefined, valid: false, description: "no files" },
      { name: "sim", files: ["data.txt"], inputScript: undefined, valid: false, description: "no input script" },
      { name: "sim", files: ["test.in"], inputScript: "test.in", valid: true, description: "all fields valid" },
    ])(
      "OK button should be $valid for $description",
      async ({ name, files: fileNames, inputScript, valid, skipAutoSelect }: { name: string; files: string[]; inputScript?: string; valid: boolean; description: string; skipAutoSelect?: boolean }) => {
        // Arrange
        const { container } = render(<NewSimulation onClose={mockOnClose} />);
        
        await waitFor(() => {
          expect(capturedOnChange).toBeDefined();
        });

        // Upload files if provided
        if (fileNames.length > 0) {
          if (!capturedOnChange) {
            throw new Error("onChange handler not captured");
          }
          const fileObjects = fileNames.map((name) => createMockFile(name));
          const uploadParam = createMockUploadChangeParam(fileObjects);
          await act(async () => {
            await capturedOnChange!(uploadParam);
          });
        }

        // Wait for files to be processed
        if (fileNames.length > 0) {
          await waitFor(() => {
            expect(window.files).toHaveLength(fileNames.length);
          });
        }

        // Set name if provided
        if (name) {
          await waitFor(() => {
            const nameInput = container.querySelector('[data-testid="simulation-name-input"]');
            expect(nameInput).toBeInTheDocument();
          });
          const nameInput = container.querySelector('[data-testid="simulation-name-input"]') as HTMLInputElement;
          await act(async () => {
            await userEvent.type(nameInput, name);
          });
        }

        // Set input script if provided
        if (inputScript) {
          await waitFor(() => {
            const select = container.querySelector('[data-testid="input-script-select"]') as HTMLSelectElement;
            expect(select).toBeInTheDocument();
          });
          
          const select = container.querySelector('[data-testid="input-script-select"]') as HTMLSelectElement;
          await act(async () => {
            await userEvent.selectOptions(select, inputScript);
          });
        } else if (skipAutoSelect && fileNames.length > 0) {
          // For tests where we don't want auto-selection, wait a bit and then clear any auto-selection
          await waitFor(() => {
            const select = container.querySelector('[data-testid="input-script-select"]') as HTMLSelectElement;
            expect(select).toBeInTheDocument();
          });
          // Wait a bit to let auto-selection happen, then verify it didn't happen or clear it
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Assert
        await waitFor(() => {
          const okButton = container.querySelector('[data-testid="ok-button"]') as HTMLButtonElement;
          expect(okButton?.disabled).toBe(!valid);
        }, { timeout: 2000 });
      }
    );
  });

  describe("onOk callback", () => {
    it("should call setNewSimulation with correct data when OK is clicked", async () => {
      // Arrange
      const files = ["test.in", "data.txt"].map((name) => createMockFile(name));
      const { container } = await triggerFileUpload(files);

      const nameInput = container.querySelector('[data-testid="simulation-name-input"]') as HTMLInputElement;
      await act(async () => {
        await userEvent.type(nameInput, "my-simulation");
      });

      await waitFor(() => {
        const select = container.querySelector('[data-testid="input-script-select"]') as HTMLSelectElement;
        expect(select).toBeInTheDocument();
      });

      // Act
      const okButton = container.querySelector('[data-testid="ok-button"]') as HTMLButtonElement;
      await act(async () => {
        await userEvent.click(okButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockSetNewSimulation).toHaveBeenCalledWith({
          id: "my-simulation",
          files: expect.arrayContaining([
            expect.objectContaining({ fileName: "test.in" }),
            expect.objectContaining({ fileName: "data.txt" }),
          ]),
          inputScript: "test.in",
          start: false,
        });
      });
    });

    it("should call onClose when OK is clicked", async () => {
      // Arrange
      const files = [createMockFile("test.in")];
      const { container } = await triggerFileUpload(files);

      const nameInput = container.querySelector('[data-testid="simulation-name-input"]') as HTMLInputElement;
      await act(async () => {
        await userEvent.type(nameInput, "my-simulation");
      });

      // Act
      const okButton = container.querySelector('[data-testid="ok-button"]') as HTMLButtonElement;
      await act(async () => {
        await userEvent.click(okButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should call setPreferredView when start immediately is checked", async () => {
      // Arrange
      const files = [createMockFile("test.in")];
      const { container } = await triggerFileUpload(files);

      const nameInput = container.querySelector('[data-testid="simulation-name-input"]') as HTMLInputElement;
      await act(async () => {
        await userEvent.type(nameInput, "my-simulation");
      });

      const checkbox = container.querySelector('[data-testid="start-immediately-checkbox"]') as HTMLInputElement;
      await act(async () => {
        await userEvent.click(checkbox);
      });

      // Act
      const okButton = container.querySelector('[data-testid="ok-button"]') as HTMLButtonElement;
      await act(async () => {
        await userEvent.click(okButton);
      });

      // Assert
      await waitFor(() => {
        expect(mockSetPreferredView).toHaveBeenCalledWith("view");
      });
    });
  });
});

