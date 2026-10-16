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
  /**
   * Keys starting with `prefix`, in ascending order. Optional: callers go
   * through the module-level keysWithPrefix(), which falls back to
   * filtering keys().
   */
  keysWithPrefix?(prefix: string): Promise<string[]>;
  /**
   * Distinct first path segments (text before the first "/") of all keys —
   * the top-level entries of the contents tree. Optional, see topLevelNames().
   */
  topLevelNames?(): Promise<string[]>;
}

/**
 * A write was refused because the origin's storage quota is exhausted.
 * Thrown by the IndexedDB backend so callers can tell "storage full" apart
 * from other failures (ADR-001 Consequences: such a run is marked failed).
 */
export class StorageFullError extends Error {
  constructor(cause?: unknown) {
    super("Browser storage is full.", { cause });
    this.name = "StorageFullError";
  }
}

/**
 * Whether an error (as thrown by IndexedDB, localforage, or a wrapper that
 * sets `cause`) means the storage quota was exceeded.
 */
export function isQuotaExceededError(error: unknown): boolean {
  for (let current = error, depth = 0; current && depth < 5; depth++) {
    if (current instanceof StorageFullError) {
      return true;
    }
    const { name, code } = current as { name?: unknown; code?: unknown };
    if (
      name === "QuotaExceededError" ||
      // Firefox's legacy name (localStorage driver).
      name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      // Legacy DOMException.QUOTA_EXCEEDED_ERR.
      code === 22
    ) {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

/** keysWithPrefix via the store's own implementation, else keys(). */
export async function keysWithPrefix(
  store: KeyValueStore,
  prefix: string,
): Promise<string[]> {
  if (store.keysWithPrefix) {
    return store.keysWithPrefix(prefix);
  }
  return (await store.keys()).filter((key) => key.startsWith(prefix)).sort();
}

/** topLevelNames via the store's own implementation, else keys(). */
export async function topLevelNames(store: KeyValueStore): Promise<string[]> {
  if (store.topLevelNames) {
    return store.topLevelNames();
  }
  return firstSegments(await store.keys());
}

function firstSegments(keys: string[]): string[] {
  const names = new Set<string>();
  for (const key of keys) {
    const slash = key.indexOf("/");
    names.add(slash === -1 ? key : key.slice(0, slash));
  }
  return [...names].sort();
}

/**
 * The smallest string greater than every string starting with `prefix`
 * (IndexedDB compares string keys by UTF-16 code unit, like JS `<`), or
 * null when no such bound exists (prefix ends in U+FFFF).
 */
function prefixUpperBound(prefix: string): string | null {
  const last = prefix.charCodeAt(prefix.length - 1);
  if (prefix.length === 0 || last === 0xffff) {
    return null;
  }
  return prefix.slice(0, -1) + String.fromCharCode(last + 1);
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

class LocalForageStore implements KeyValueStore {
  /** Cached raw connection for key-range reads (see withRawStore). */
  private rawDb?: Promise<IDBDatabase>;

  constructor(private readonly instance: LocalForage) {}

  async getItem<T>(key: string): Promise<T | null> {
    return this.instance.getItem<T>(key);
  }
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await this.instance.setItem(key, value);
    } catch (error) {
      throw isQuotaExceededError(error) ? new StorageFullError(error) : error;
    }
  }
  async removeItem(key: string): Promise<void> {
    await this.instance.removeItem(key);
  }
  async keys(): Promise<string[]> {
    return this.instance.keys();
  }

  async keysWithPrefix(prefix: string): Promise<string[]> {
    const upper = prefixUpperBound(prefix);
    const fallback = async () =>
      (await this.keys()).filter((key) => key.startsWith(prefix)).sort();
    if (upper === null) {
      return fallback();
    }
    return this.withRawStore(async (store) => {
      const keys = await request(
        store.getAllKeys(IDBKeyRange.bound(prefix, upper, false, true)),
      );
      return keys.filter((key): key is string => typeof key === "string");
    }, fallback);
  }

  async topLevelNames(): Promise<string[]> {
    return this.withRawStore(
      (store) =>
        // Skip-scan: after the first key under "name/", seek straight past
        // the whole subtree ("name0" — "0" is the code unit after "/"), so
        // the cost is one seek per top-level entry, not one per stored file.
        new Promise<string[]>((resolve, reject) => {
          const names = new Set<string>();
          const cursorRequest = store.openKeyCursor();
          cursorRequest.onerror = () => reject(cursorRequest.error);
          cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (!cursor) {
              resolve([...names].sort());
              return;
            }
            const key = String(cursor.key);
            const slash = key.indexOf("/");
            const name = slash === -1 ? key : key.slice(0, slash);
            names.add(name);
            if (slash === -1) {
              cursor.continue();
            } else {
              cursor.continue(`${name}0`);
            }
          };
        }),
      async () => firstSegments(await this.keys()),
    );
  }

  /**
   * Run a key read against the raw IndexedDB object store localforage
   * writes to, or `fallback` when that path is unavailable (non-IndexedDB
   * driver, store missing, connection closed, request failed).
   *
   * Only key reads go through this path; every write stays on localforage
   * so its storage format (and blob handling) is never second-guessed.
   * localforage's IndexedDB driver keeps keys as plain out-of-line strings
   * in an object store named after `storeName` inside the `name` database
   * (here "JupyterLite Storage" / "files" or "checkpoints"), so a key range
   * over that store sees exactly what keys() returns.
   */
  private async withRawStore<T>(
    read: (store: IDBObjectStore) => Promise<T>,
    fallback: () => Promise<T>,
  ): Promise<T> {
    let pending: Promise<T>;
    try {
      // ready() makes localforage create the database and object store
      // first, so the raw open below never creates or upgrades anything.
      await this.instance.ready();
      if (
        this.instance.driver() !== localforage.INDEXEDDB ||
        typeof indexedDB === "undefined"
      ) {
        return fallback();
      }
      const name = this.instance.config("name") as string;
      const storeName = this.instance.config("storeName") as string;
      this.rawDb ??= this.openRaw(name);
      const db = await this.rawDb;
      if (!db.objectStoreNames.contains(storeName)) {
        // Opened before localforage added this store (e.g. by another
        // instance on the same database) — reopen next time.
        this.dropRaw(db);
        return fallback();
      }
      // Transaction and request in one synchronous block: an IndexedDB
      // transaction auto-commits once control returns with nothing queued.
      pending = read(
        db.transaction(storeName, "readonly").objectStore(storeName),
      );
    } catch {
      // E.g. InvalidStateError on a connection the browser closed.
      this.rawDb = undefined;
      return fallback();
    }
    return pending.catch(() => fallback());
  }

  private openRaw(name: string): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      // No version: open at whatever version localforage left it.
      const req = indexedDB.open(name);
      req.onupgradeneeded = () => {
        // The database did not exist — never create it from here.
        req.transaction?.abort();
      };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result;
        // localforage (here or in the JupyterLite iframe) bumps the version
        // to add object stores; an open connection would block that, so
        // step aside like localforage's own connections do.
        db.onversionchange = () => this.dropRaw(db);
        db.onclose = () => this.dropRaw(db);
        resolve(db);
      };
    }).catch((error: unknown) => {
      this.rawDb = undefined;
      throw error;
    });
  }

  private dropRaw(db: IDBDatabase): void {
    db.close();
    this.rawDb = undefined;
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
  async keysWithPrefix(prefix: string): Promise<string[]> {
    return [...this.map.keys()].filter((key) => key.startsWith(prefix)).sort();
  }
  async topLevelNames(): Promise<string[]> {
    return firstSegments([...this.map.keys()]);
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
