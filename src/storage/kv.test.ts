// Must load before localforage, which captures `indexedDB` at import time.
import "fake-indexeddb/auto";
import { describe, expect, it, vi, afterEach } from "vitest";
import { createIndexedDbProjectStorage } from "./contentsProjectStorage";
import {
  createJupyterCheckpointsStore,
  createJupyterFilesStore,
  isQuotaExceededError,
  StorageFullError,
} from "./kv";

/** Read one value straight from the database JupyterLite reads. */
function rawGet(storeName: string, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("JupyterLite Storage");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const req = db
        .transaction(storeName, "readonly")
        .objectStore(storeName)
        .get(key);
      req.onsuccess = () => {
        db.close();
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    };
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("IndexedDB key-value store", () => {
  // One shared fake database per file (as in the browser); each test uses
  // its own top-level names.

  it("keeps localforage's storage format: plain values under path keys", async () => {
    const files = createJupyterFilesStore();
    const record = { path: "fmt/a.txt", content: "hello", size: 5 };

    await files.setItem("fmt/a.txt", record);

    expect(await rawGet("files", "fmt/a.txt")).toEqual(record);
  });

  it("lists keys under a prefix with a key-range query", async () => {
    const files = createJupyterFilesStore();
    for (const key of ["kp", "kp/a", "kp/b/c", "kp-2/x", "kp0", "kq/y"]) {
      await files.setItem(key, { key });
    }
    const getAllKeys = vi.spyOn(IDBObjectStore.prototype, "getAllKeys");

    expect(await files.keysWithPrefix!("kp/")).toEqual(["kp/a", "kp/b/c"]);
    expect(getAllKeys).toHaveBeenCalled();
    expect(await files.keysWithPrefix!("kp-2/")).toEqual(["kp-2/x"]);
    expect(await files.keysWithPrefix!("missing/")).toEqual([]);
  });

  it("finds top-level names with one seek per entry, not per file", async () => {
    const files = createJupyterFilesStore();
    const before = await files.topLevelNames!();
    await files.setItem("tl", {});
    await files.setItem("tl-2", {});
    await files.setItem("tl.ipynb", {});
    for (let i = 0; i < 40; i++) {
      await files.setItem(`tl/runs/run-${i}/log.lammps`, {});
    }
    const advance = vi.spyOn(IDBCursor.prototype, "continue");

    const names = await files.topLevelNames!();

    expect(names.filter((name) => !before.includes(name))).toEqual([
      "tl",
      "tl-2",
      "tl.ipynb",
    ]);
    expect(advance.mock.calls.length).toBeLessThan(before.length + 10);
    expect(advance).toHaveBeenCalledWith("tl0");
  });

  it("steps aside when localforage upgrades the database to add a store", async () => {
    const files = createJupyterFilesStore();
    await files.setItem("up/a", {});
    // Holds the raw read connection open…
    expect(await files.keysWithPrefix!("up/")).toEqual(["up/a"]);

    // …which must not block localforage adding the checkpoints store.
    const checkpoints = createJupyterCheckpointsStore();
    await checkpoints.setItem("up/a", [{ id: "0" }]);

    // Both still answer through the raw key range (reconnected), not the
    // keys() fallback.
    const getAllKeys = vi.spyOn(IDBObjectStore.prototype, "getAllKeys");
    expect(await checkpoints.keysWithPrefix!("up/")).toEqual(["up/a"]);
    expect(await files.keysWithPrefix!("up/")).toEqual(["up/a"]);
    expect(getAllKeys).toHaveBeenCalledTimes(2);
  });

  it("surfaces quota errors from writes as StorageFullError", async () => {
    const files = createJupyterFilesStore();
    await files.setItem("quota/ok", {});
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    const write = files.setItem("quota/big", { content: "x" });

    await expect(write).rejects.toBeInstanceOf(StorageFullError);
    await expect(write).rejects.toSatisfy(isQuotaExceededError);
  });

  it("runs ContentsProjectStorage end to end on the shared database", async () => {
    const storage = createIndexedDbProjectStorage();
    const { dirName } = await storage.createProject({ displayName: "E2E" });
    await storage.write(dirName, "data/one.txt", "1");
    await storage.write(dirName, "data/deep/two.txt", "2");

    await storage.rename(dirName, "data", "inputs");

    expect((await storage.list(dirName, "inputs")).map((s) => s.path)).toEqual([
      "inputs/deep",
      "inputs/one.txt",
    ]);
    expect(await storage.stat(dirName, "data")).toBeNull();
    expect((await storage.listProjects()).map((p) => p.dirName)).toContain(
      dirName,
    );

    await storage.deleteProject(dirName);
    expect((await storage.listProjects()).map((p) => p.dirName)).not.toContain(
      dirName,
    );
    expect(await createJupyterFilesStore().keysWithPrefix!(dirName)).toEqual(
      [],
    );
  });
});

describe("isQuotaExceededError", () => {
  it("recognizes the browser and localforage shapes", () => {
    expect(
      isQuotaExceededError(new DOMException("full", "QuotaExceededError")),
    ).toBe(true);
    expect(isQuotaExceededError({ name: "NS_ERROR_DOM_QUOTA_REACHED" })).toBe(
      true,
    );
    expect(isQuotaExceededError({ code: 22 })).toBe(true);
    expect(
      isQuotaExceededError(
        new Error("wrapped", {
          cause: new DOMException("full", "QuotaExceededError"),
        }),
      ),
    ).toBe(true);
    expect(isQuotaExceededError(new StorageFullError())).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isQuotaExceededError(new Error("nope"))).toBe(false);
    expect(
      isQuotaExceededError(new DOMException("closed", "InvalidStateError")),
    ).toBe(false);
    expect(isQuotaExceededError(undefined)).toBe(false);
    expect(isQuotaExceededError("QuotaExceededError")).toBe(false);
  });
});
