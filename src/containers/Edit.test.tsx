import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoreProvider, createStore } from 'easy-peasy';
import Edit from './Edit';
import { StoreModel } from '../store/model';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ options, value }) => (
    <div data-testid="monaco-editor" data-readonly={options.readOnly}>
      {value}
    </div>
  )),
  loader: {
    init: vi.fn(() => Promise.resolve({
      languages: {
        register: vi.fn(),
        setMonarchTokensProvider: vi.fn(),
      },
    })),
  },
}));

describe('Edit', () => {
  let store: any;

  beforeEach(() => {
    // Create a minimal store with the necessary state
    store = createStore<Partial<StoreModel>>({
      app: {
        selectedFile: {
          fileName: 'test.in',
          content: 'units lj\natom_style atomic',
          url: '',
        },
        setSelectedFile: vi.fn(),
        setStatus: vi.fn(),
      },
      simulation: {
        running: false,
        paused: false,
        showConsole: false,
        files: [],
        lammpsOutput: [],
        simulation: {
          id: 'test-sim',
          files: [
            {
              fileName: 'test.in',
              content: 'units lj\natom_style atomic',
              url: '',
            },
          ],
          inputScript: 'test.in',
          start: false,
        },
        resetLammpsOutput: vi.fn(),
        addLammpsOutput: vi.fn(),
        setShowConsole: vi.fn(),
        setPaused: vi.fn(),
        setCameraPosition: vi.fn(),
        setCameraTarget: vi.fn(),
        setSimulation: vi.fn(),
        setRunning: vi.fn(),
        setFiles: vi.fn(),
        setLammps: vi.fn(),
        extractAndApplyAtomifyCommands: vi.fn(),
        syncFilesWasm: vi.fn(),
        syncFilesJupyterLite: vi.fn(),
        run: vi.fn(),
        newSimulation: vi.fn(),
        reset: vi.fn(),
      },
    } as any);
  });

  it('should render editor when file is selected', () => {
    // Arrange & Act
    render(
      <StoreProvider store={store}>
        <Edit />
      </StoreProvider>
    );

    // Assert
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor')).toHaveTextContent('units lj');
  });

  it('should render "No file selected" when no file is selected', () => {
    // Arrange
    store.getState().app.selectedFile = undefined;

    // Act
    render(
      <StoreProvider store={store}>
        <Edit />
      </StoreProvider>
    );

    // Assert
    expect(screen.getByText('No file selected')).toBeInTheDocument();
    expect(screen.queryByTestId('monaco-editor')).not.toBeInTheDocument();
  });

  it('should be editable when simulation is not running', () => {
    // Arrange
    store.getState().simulation.running = false;

    // Act
    render(
      <StoreProvider store={store}>
        <Edit />
      </StoreProvider>
    );

    // Assert
    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toHaveAttribute('data-readonly', 'false');
  });

  it('should be read-only when simulation is running', () => {
    // Arrange
    store.getState().simulation.running = true;

    // Act
    render(
      <StoreProvider store={store}>
        <Edit />
      </StoreProvider>
    );

    // Assert
    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toHaveAttribute('data-readonly', 'true');
  });

  it('should show notification banner when simulation is running', () => {
    // Arrange
    store.getState().simulation.running = true;

    // Act
    render(
      <StoreProvider store={store}>
        <Edit />
      </StoreProvider>
    );

    // Assert
    expect(screen.getByText(/File editing is disabled while simulation is running/i)).toBeInTheDocument();
  });

  it('should not show notification banner when simulation is not running', () => {
    // Arrange
    store.getState().simulation.running = false;

    // Act
    render(
      <StoreProvider store={store}>
        <Edit />
      </StoreProvider>
    );

    // Assert
    expect(screen.queryByText(/File editing is disabled while simulation is running/i)).not.toBeInTheDocument();
  });

  it('should update content when file content changes', () => {
    // Arrange
    const { rerender } = render(
      <StoreProvider store={store}>
        <Edit />
      </StoreProvider>
    );

    // Act - Update the selected file content
    store.getState().app.selectedFile = {
      fileName: 'test.in',
      content: 'units metal\natom_style full',
      url: '',
    };

    rerender(
      <StoreProvider store={store}>
        <Edit />
      </StoreProvider>
    );

    // Assert
    expect(screen.getByTestId('monaco-editor')).toHaveTextContent('units metal');
  });
});
