export interface SimulationEditStorage {
  originalFiles: { [fileName: string]: string };
  editedFiles: { [fileName: string]: string };
  lastModified: number;
}

const STORAGE_KEY_PREFIX = 'simulation_edits_';

export const SimulationEditStorageUtils = {
  /**
   * Store the original simulation files when a simulation is first loaded
   */
  storeOriginalFiles: (simulationId: string, files: Array<{ fileName: string; content?: string }>) => {
    const storageKey = STORAGE_KEY_PREFIX + simulationId;
    const existing = localStorage.getItem(storageKey);
    
    // Only store originals if they don't exist yet
    if (!existing) {
      const originalFiles: { [fileName: string]: string } = {};
      files.forEach(file => {
        if (file.content) {
          originalFiles[file.fileName] = file.content;
        }
      });
      
      const storage: SimulationEditStorage = {
        originalFiles,
        editedFiles: {},
        lastModified: Date.now()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(storage));
    }
  },

  /**
   * Store an edited version of a file
   */
  storeEditedFile: (simulationId: string, fileName: string, content: string) => {
    const storageKey = STORAGE_KEY_PREFIX + simulationId;
    const existing = localStorage.getItem(storageKey);
    
    if (existing) {
      const storage: SimulationEditStorage = JSON.parse(existing);
      storage.editedFiles[fileName] = content;
      storage.lastModified = Date.now();
      localStorage.setItem(storageKey, JSON.stringify(storage));
    }
  },

  /**
   * Get the original content of a file
   */
  getOriginalFile: (simulationId: string, fileName: string): string | null => {
    const storageKey = STORAGE_KEY_PREFIX + simulationId;
    const existing = localStorage.getItem(storageKey);
    
    if (existing) {
      const storage: SimulationEditStorage = JSON.parse(existing);
      return storage.originalFiles[fileName] || null;
    }
    
    return null;
  },

  /**
   * Get the edited content of a file
   */
  getEditedFile: (simulationId: string, fileName: string): string | null => {
    const storageKey = STORAGE_KEY_PREFIX + simulationId;
    const existing = localStorage.getItem(storageKey);
    
    if (existing) {
      const storage: SimulationEditStorage = JSON.parse(existing);
      return storage.editedFiles[fileName] || null;
    }
    
    return null;
  },

  /**
   * Restore a file to its original content
   */
  restoreOriginalFile: (simulationId: string, fileName: string): string | null => {
    const storageKey = STORAGE_KEY_PREFIX + simulationId;
    const existing = localStorage.getItem(storageKey);
    
    if (existing) {
      const storage: SimulationEditStorage = JSON.parse(existing);
      const originalContent = storage.originalFiles[fileName];
      
      if (originalContent) {
        // Remove from edited files
        delete storage.editedFiles[fileName];
        storage.lastModified = Date.now();
        localStorage.setItem(storageKey, JSON.stringify(storage));
        return originalContent;
      }
    }
    
    return null;
  },

  /**
   * Check if a file has been edited
   */
  hasEdits: (simulationId: string, fileName: string): boolean => {
    const storageKey = STORAGE_KEY_PREFIX + simulationId;
    const existing = localStorage.getItem(storageKey);
    
    if (existing) {
      const storage: SimulationEditStorage = JSON.parse(existing);
      return fileName in storage.editedFiles;
    }
    
    return false;
  },

  /**
   * Get all edited files for a simulation
   */
  getAllEditedFiles: (simulationId: string): { [fileName: string]: string } => {
    const storageKey = STORAGE_KEY_PREFIX + simulationId;
    const existing = localStorage.getItem(storageKey);
    
    if (existing) {
      const storage: SimulationEditStorage = JSON.parse(existing);
      return storage.editedFiles;
    }
    
    return {};
  },

  /**
   * Clear all edits for a simulation
   */
  clearAllEdits: (simulationId: string): void => {
    const storageKey = STORAGE_KEY_PREFIX + simulationId;
    localStorage.removeItem(storageKey);
  },

  /**
   * Load edited files into simulation files
   */
  loadEditedFiles: (simulationId: string, files: Array<{ fileName: string; content?: string }>) => {
    const editedFiles = SimulationEditStorageUtils.getAllEditedFiles(simulationId);
    
    files.forEach(file => {
      if (editedFiles[file.fileName]) {
        file.content = editedFiles[file.fileName];
      }
    });
  }
};