/**
 * JupyterLite contents-schema helpers (ADR-001 §3).
 *
 * The project filesystem is stored in the same IndexedDB database
 * JupyterLite's contents manager reads ("JupyterLite Storage"), one record
 * per file/directory keyed by full path. Records must match what
 * @jupyterlite/contents' BrowserStorageDrive expects, so the app owns this
 * extension → {type, format, mimetype} table and the record builders.
 */

import type { FileFormat, FileStat, FileType } from "./types";

/** The record shape BrowserStorageDrive stores per path. */
export interface ContentsRecord {
  name: string;
  path: string;
  last_modified: string;
  created: string;
  format: FileFormat | null;
  mimetype: string;
  /** Parsed JSON for json-format records; base64 string for binary; text
   *  string otherwise; null for directories. */
  content: string | object | null;
  size: number;
  writable: boolean;
  type: FileType;
}

/**
 * Extensions stored as base64 binary. Everything else defaults to text —
 * LAMMPS files have arbitrary "extensions" (in.lj, data.spce) and are text.
 */
const BINARY_MIMETYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  zip: "application/zip",
  gz: "application/gzip",
  npy: "application/octet-stream",
  npz: "application/octet-stream",
  bin: "application/octet-stream",
};

function extensionOf(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/** File kind by extension: {type, format, mimetype}. */
export function classifyPath(path: string): {
  type: FileType;
  format: FileFormat;
  mimetype: string;
} {
  const ext = extensionOf(path);
  if (ext === "ipynb") {
    return { type: "notebook", format: "json", mimetype: "application/json" };
  }
  if (ext === "json") {
    return { type: "file", format: "json", mimetype: "application/json" };
  }
  const binary = BINARY_MIMETYPES[ext];
  if (binary) {
    return { type: "file", format: "base64", mimetype: binary };
  }
  return { type: "file", format: "text", mimetype: "text/plain" };
}

/**
 * Validate a project-relative path (ADR-001 §2): no empty/./.. segments, no
 * leading slash, and no "%" anywhere — BrowserStorageDrive decodeURIComponents
 * paths, so a "%" throws inside the Jupyter UI.
 */
export function validateRelativePath(path: string): void {
  if (path.startsWith("/") || path.endsWith("/")) {
    throw new Error(`Invalid path (leading/trailing slash): ${path}`);
  }
  if (path.includes("%")) {
    throw new Error(`Invalid path ("%" is not allowed): ${path}`);
  }
  const segments = path.split("/");
  for (const segment of segments) {
    if (segment === "" || segment === "." || segment === "..") {
      throw new Error(`Invalid path segment in: ${path}`);
    }
  }
}

const CHUNK = 0x8000;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Build the contents record for a file write. String content is stored per
 * the extension table (json records hold parsed objects); Uint8Array content
 * is always stored base64.
 */
export function buildFileRecord(
  path: string,
  content: string | Uint8Array,
  existingCreated?: string,
): ContentsRecord {
  const now = new Date().toISOString();
  const name = path.slice(path.lastIndexOf("/") + 1);
  const kind = classifyPath(path);

  if (content instanceof Uint8Array) {
    return {
      name,
      path,
      last_modified: now,
      created: existingCreated ?? now,
      format: "base64",
      mimetype:
        kind.format === "base64" ? kind.mimetype : "application/octet-stream",
      content: bytesToBase64(content),
      size: content.length,
      writable: true,
      type: "file",
    };
  }

  let stored: string | object = content;
  let { type, format, mimetype } = kind;
  if (format === "json") {
    try {
      // Notebooks/.json are stored parsed (matching BrowserStorageDrive).
      stored = JSON.parse(content) as object;
    } catch {
      // Mid-edit autosaves and truncated outputs are not valid JSON yet.
      // Store as text — losing the user's bytes would be worse than a
      // temporarily unparseable record (it heals on the next valid save).
      stored = content;
      type = "file";
      format = "text";
      mimetype = "text/plain";
    }
  }
  return {
    name,
    path,
    last_modified: now,
    created: existingCreated ?? now,
    format,
    mimetype,
    content: stored,
    size: content.length,
    writable: true,
    type,
  };
}

export function buildDirectoryRecord(
  path: string,
  existingCreated?: string,
): ContentsRecord {
  const now = new Date().toISOString();
  return {
    name: path.slice(path.lastIndexOf("/") + 1),
    path,
    last_modified: now,
    created: existingCreated ?? now,
    format: "json",
    mimetype: "application/json",
    content: null,
    size: 0,
    writable: true,
    type: "directory",
  };
}

/** The FileStat view of a record, with the path made project-relative. */
export function recordToStat(
  record: ContentsRecord,
  relativePath: string,
): FileStat {
  return {
    path: relativePath,
    type: record.type,
    format: record.format ?? "text",
    mimetype: record.mimetype,
    lastModified: record.last_modified,
    size: record.size,
  };
}

/** Record content -> what ProjectStorage.read returns (ADR-001 §4). */
export function recordToReadResult(
  record: ContentsRecord,
): string | Uint8Array {
  if (record.type === "directory") {
    throw new Error(`Cannot read a directory: ${record.path}`);
  }
  if (record.format === "base64") {
    return base64ToBytes(record.content as string);
  }
  if (record.format === "json") {
    return JSON.stringify(record.content);
  }
  return (record.content as string) ?? "";
}

/**
 * Decode worker-snapshot bytes into what write() should store: text files
 * (the LAMMPS common case) become strings so they stay readable in the
 * notebook; known-binary extensions stay bytes.
 */
export function bytesToWriteContent(
  path: string,
  bytes: Uint8Array,
): string | Uint8Array {
  if (classifyPath(path).format === "base64") {
    return bytes;
  }
  return new TextDecoder().decode(bytes);
}
