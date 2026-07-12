/**
 * Minimal async key-value contract under ContentsProjectStorage.
 *
 * The IndexedDB backend is localforage over the "JupyterLite Storage"
 * database (the same one JupyterLite's contents manager uses — that sharing
 * is the whole point, ADR-001 §3). The memory backend serves quick runs,
 * embeds, and tests, where nothing may touch the visitor's real library.
 */

import localforage from "localforage";

export interface KeyValueStore {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

class LocalForageStore implements KeyValueStore {
  constructor(private readonly instance: LocalForage) {}

  async getItem<T>(key: string): Promise<T | null> {
    return this.instance.getItem<T>(key);
  }
  async setItem<T>(key: string, value: T): Promise<void> {
    await this.instance.setItem(key, value);
  }
  async removeItem(key: string): Promise<void> {
    await this.instance.removeItem(key);
  }
  async keys(): Promise<string[]> {
    return this.instance.keys();
  }
}

export class MemoryStore implements KeyValueStore {
  private readonly map = new Map<string, unknown>();

  async getItem<T>(key: string): Promise<T | null> {
    return (this.map.get(key) as T | undefined) ?? null;
  }
  async setItem<T>(key: string, value: T): Promise<void> {
    // Deep-copy so callers can't mutate stored records in place — matches
    // the structured-clone semantics of the IndexedDB backend.
    this.map.set(key, structuredClone(value));
  }
  async removeItem(key: string): Promise<void> {
    this.map.delete(key);
  }
  async keys(): Promise<string[]> {
    return [...this.map.keys()];
  }
}

const JUPYTERLITE_DB = "JupyterLite Storage";

/** The `files` object store JupyterLite's contents manager reads. */
export function createJupyterFilesStore(): KeyValueStore {
  return new LocalForageStore(
    localforage.createInstance({
      driver: localforage.INDEXEDDB,
      name: JUPYTERLITE_DB,
      storeName: "files",
    }),
  );
}

/**
 * JupyterLite's `checkpoints` object store (up to 5 full copies per edited
 * file). Delete/rename must clear these too or deleted projects leak quota
 * and can be resurrected from the checkpoint UI (ADR-001 §3).
 */
export function createJupyterCheckpointsStore(): KeyValueStore {
  return new LocalForageStore(
    localforage.createInstance({
      driver: localforage.INDEXEDDB,
      name: JUPYTERLITE_DB,
      storeName: "checkpoints",
    }),
  );
}
