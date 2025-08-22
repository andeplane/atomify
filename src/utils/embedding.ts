/* eslint-disable */
import _m0 from 'protobufjs/minimal';

export const protobufPackage = '';

export interface SimulationData {
  id: string;
  title: string;
  description: string;
  analysisDescription?: string;
  analysisScript?: string;
  inputScript: string;
  keywords: string[];
  files: { [key: string]: SimulationFile };
}

export interface SimulationData_FilesEntry {
  key: string;
  value: SimulationFile | undefined;
}

export interface SimulationFile {
  content?:
    | { $case: 'text'; text: string }
    | { $case: 'data'; data: Uint8Array };
}

function createBaseSimulationData(): SimulationData {
  return { 
    id: '', 
    title: '', 
    description: '', 
    analysisDescription: '', 
    analysisScript: '', 
    inputScript: '', 
    keywords: [], 
    files: {} 
  };
}

export const SimulationData = {
  encode(
    message: SimulationData,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== '') {
      writer.uint32(10).string(message.id);
    }
    if (message.title !== '') {
      writer.uint32(18).string(message.title);
    }
    if (message.description !== '') {
      writer.uint32(26).string(message.description);
    }
    if (message.analysisDescription !== '') {
      writer.uint32(34).string(message.analysisDescription!);
    }
    if (message.analysisScript !== '') {
      writer.uint32(42).string(message.analysisScript!);
    }
    if (message.inputScript !== '') {
      writer.uint32(50).string(message.inputScript);
    }
    for (const v of message.keywords) {
      writer.uint32(58).string(v!);
    }
    Object.entries(message.files).forEach(([key, value]) => {
      SimulationData_FilesEntry.encode(
        { key: key as any, value },
        writer.uint32(66).fork()
      ).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SimulationData {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSimulationData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.title = reader.string();
          break;
        case 3:
          message.description = reader.string();
          break;
        case 4:
          message.analysisDescription = reader.string();
          break;
        case 5:
          message.analysisScript = reader.string();
          break;
        case 6:
          message.inputScript = reader.string();
          break;
        case 7:
          message.keywords.push(reader.string());
          break;
        case 8:
          const entry8 = SimulationData_FilesEntry.decode(reader, reader.uint32());
          if (entry8.value !== undefined) {
            message.files[entry8.key] = entry8.value;
          }
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SimulationData {
    return {
      id: isSet(object.id) ? String(object.id) : '',
      title: isSet(object.title) ? String(object.title) : '',
      description: isSet(object.description) ? String(object.description) : '',
      analysisDescription: isSet(object.analysisDescription) ? String(object.analysisDescription) : '',
      analysisScript: isSet(object.analysisScript) ? String(object.analysisScript) : '',
      inputScript: isSet(object.inputScript) ? String(object.inputScript) : '',
      keywords: Array.isArray(object?.keywords)
        ? object.keywords.map((e: any) => String(e))
        : [],
      files: isObject(object.files)
        ? Object.entries(object.files).reduce<{ [key: string]: SimulationFile }>(
            (acc, [key, value]) => {
              acc[key] = SimulationFile.fromJSON(value);
              return acc;
            },
            {}
          )
        : {},
    };
  },

  toJSON(message: SimulationData): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.title !== undefined && (obj.title = message.title);
    message.description !== undefined && (obj.description = message.description);
    message.analysisDescription !== undefined && (obj.analysisDescription = message.analysisDescription);
    message.analysisScript !== undefined && (obj.analysisScript = message.analysisScript);
    message.inputScript !== undefined && (obj.inputScript = message.inputScript);
    if (message.keywords) {
      obj.keywords = message.keywords.map(e => e);
    } else {
      obj.keywords = [];
    }
    obj.files = {};
    if (message.files) {
      Object.entries(message.files).forEach(([k, v]) => {
        obj.files[k] = SimulationFile.toJSON(v);
      });
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SimulationData>, I>>(object: I): SimulationData {
    const message = createBaseSimulationData();
    message.id = object.id ?? '';
    message.title = object.title ?? '';
    message.description = object.description ?? '';
    message.analysisDescription = object.analysisDescription ?? '';
    message.analysisScript = object.analysisScript ?? '';
    message.inputScript = object.inputScript ?? '';
    message.keywords = object.keywords?.map(e => e) || [];
    message.files = Object.entries(object.files ?? {}).reduce<{
      [key: string]: SimulationFile;
    }>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = SimulationFile.fromPartial(value);
      }
      return acc;
    }, {});
    return message;
  }
};

function createBaseSimulationData_FilesEntry(): SimulationData_FilesEntry {
  return { key: '', value: undefined };
}

export const SimulationData_FilesEntry = {
  encode(
    message: SimulationData_FilesEntry,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.key !== '') {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      SimulationFile.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SimulationData_FilesEntry {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSimulationData_FilesEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.key = reader.string();
          break;
        case 2:
          message.value = SimulationFile.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SimulationData_FilesEntry {
    return {
      key: isSet(object.key) ? String(object.key) : '',
      value: isSet(object.value) ? SimulationFile.fromJSON(object.value) : undefined
    };
  },

  toJSON(message: SimulationData_FilesEntry): unknown {
    const obj: any = {};
    message.key !== undefined && (obj.key = message.key);
    message.value !== undefined &&
      (obj.value = message.value ? SimulationFile.toJSON(message.value) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SimulationData_FilesEntry>, I>>(
    object: I
  ): SimulationData_FilesEntry {
    const message = createBaseSimulationData_FilesEntry();
    message.key = object.key ?? '';
    message.value =
      object.value !== undefined && object.value !== null
        ? SimulationFile.fromPartial(object.value)
        : undefined;
    return message;
  }
};

function createBaseSimulationFile(): SimulationFile {
  return { content: undefined };
}

export const SimulationFile = {
  encode(message: SimulationFile, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.content?.$case === 'text') {
      writer.uint32(10).string(message.content.text);
    }
    if (message.content?.$case === 'data') {
      writer.uint32(18).bytes(message.content.data);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SimulationFile {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSimulationFile();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.content = { $case: 'text', text: reader.string() };
          break;
        case 2:
          message.content = { $case: 'data', data: reader.bytes() };
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): SimulationFile {
    return {
      content: isSet(object.text)
        ? { $case: 'text', text: String(object.text) }
        : isSet(object.data)
        ? { $case: 'data', data: bytesFromBase64(object.data) }
        : undefined
    };
  },

  toJSON(message: SimulationFile): unknown {
    const obj: any = {};
    message.content?.$case === 'text' && (obj.text = message.content?.text);
    message.content?.$case === 'data' &&
      (obj.data =
        message.content?.data !== undefined
          ? base64FromBytes(message.content?.data)
          : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SimulationFile>, I>>(object: I): SimulationFile {
    const message = createBaseSimulationFile();
    if (
      object.content?.$case === 'text' &&
      object.content?.text !== undefined &&
      object.content?.text !== null
    ) {
      message.content = { $case: 'text', text: object.content.text };
    }
    if (
      object.content?.$case === 'data' &&
      object.content?.data !== undefined &&
      object.content?.data !== null
    ) {
      message.content = { $case: 'data', data: object.content.data };
    }
    return message;
  }
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var globalThis: any = (() => {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw 'Unable to locate global object';
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (globalThis.Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, 'base64'));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (globalThis.Buffer) {
    return globalThis.Buffer.from(arr).toString('base64');
  } else {
    const bin: string[] = [];
    arr.forEach(byte => {
      bin.push(String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(''));
  }
}

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends { $case: string }
  ? { [K in keyof Omit<T, '$case'>]?: DeepPartial<T[K]> } & {
      $case: T['$case'];
    }
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & {
      [K in Exclude<keyof I, KeysOfUnion<P>>]: never;
    };

function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

/**
 * Ad-hoc value that works at least on Chromium: 105.0.5195.102（Official Build） （arm64）.
 * Decrease this if `RangeError: Maximum call stack size exceeded` is reported.
 */
const DEFAULT_APPLY_MAX = 2 ** 16;

export function u8aToBase64(buf: Uint8Array, applyMax?: number): string {
  // If `buf` is too long, `String.fromCharCode.apply(null, buf)`
  // throws `RangeError: Maximum call stack size exceeded`,
  // so we split the buffer into chunks and process them one by one.
  let str = '';
  const nChunks = Math.ceil(buf.length / (applyMax ?? DEFAULT_APPLY_MAX));
  for (let i = 0; i < nChunks; ++i) {
    const offset = DEFAULT_APPLY_MAX * i;
    const chunk = buf.slice(offset, offset + DEFAULT_APPLY_MAX);
    str += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }

  return window.btoa(str);
}

export function base64ToU8A(base64: string): Uint8Array {
  const s = window.atob(base64);

  const len = s.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buf[i] = s.charCodeAt(i);
  }
  return buf;
}

// Conversion between base64 and base64url
// * https://gist.github.com/tomfordweb/bcb36baaa6db538b28d2f9a155debe0f
// * https://en.wikipedia.org/wiki/Base64
// * https://datatracker.ietf.org/doc/html/rfc4648#section-5
function b64ToB64url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ',');
}

function b64urlToB64(hashSafe: string): string {
  return hashSafe.replace(/-/g, '+').replace(/_/g, '/').replace(/,/g, '=');
}

// Interface for the original atomify simulation format
export interface AtomifySimulation {
  id: string;
  title: string;
  description: string;
  analysisDescription?: string;
  analysisScript?: string;
  imageUrl?: string;
  inputScript: string;
  keywords?: string[];
  files: Array<{
    fileName: string;
    url: string;
  }>;
}

// Convert atomify simulation format to our embeddable format
export async function convertAtomifySimulationToEmbeddable(
  simulation: AtomifySimulation
): Promise<SimulationData> {
  const simulationData = createBaseSimulationData();
  simulationData.id = simulation.id;
  simulationData.title = simulation.title;
  simulationData.description = simulation.description;
  simulationData.analysisDescription = simulation.analysisDescription || '';
  simulationData.analysisScript = simulation.analysisScript || '';
  simulationData.inputScript = simulation.inputScript;
  simulationData.keywords = simulation.keywords || [];

  // Fetch all files and convert to embedded format
  for (const file of simulation.files) {
    try {
      const response = await fetch(file.url);
      const content = await response.text();
      simulationData.files[file.fileName] = {
        content: { $case: 'text', text: content }
      };
    } catch (error) {
      console.error(`Failed to fetch file ${file.fileName}:`, error);
    }
  }

  return simulationData;
}

export function encodeSimulationData(simulationData: SimulationData): string {
  const encodedProto = SimulationData.encode(simulationData).finish();
  const base64 = u8aToBase64(Uint8Array.from(encodedProto));
  return b64ToB64url(base64);
}

export function decodeSimulationData(base64url: string): SimulationData {
  const base64 = b64urlToB64(base64url);
  const buf = base64ToU8A(base64);
  const simulationData = SimulationData.decode(buf);
  return simulationData;
}

// Convert embeddable format back to atomify simulation format
export function convertEmbeddableToAtomifySimulation(
  simulationData: SimulationData
): AtomifySimulation & { fileContents: { [key: string]: string } } {
  const fileContents: { [key: string]: string } = {};
  const files = Object.entries(simulationData.files).map(([fileName, file]) => {
    if (file.content?.$case === 'text') {
      fileContents[fileName] = file.content.text;
    }
    return {
      fileName,
      url: '' // We don't need URLs since we have the content
    };
  });

  return {
    id: simulationData.id,
    title: simulationData.title,
    description: simulationData.description,
    analysisDescription: simulationData.analysisDescription,
    analysisScript: simulationData.analysisScript,
    inputScript: simulationData.inputScript,
    keywords: simulationData.keywords,
    files,
    fileContents
  };
}

// Helper function to generate an embedded URL
export function generateEmbeddedUrl(
  baseUrl: string,
  simulationData: SimulationData
): string {
  const encoded = encodeSimulationData(simulationData);
  const url = new URL(baseUrl);
  url.searchParams.set('embeddedSimulationData', encoded);
  return url.toString();
}

// Helper function to create a full embedded URL from an atomify simulation
export async function generateEmbeddedUrlFromAtomifySimulation(
  baseUrl: string,
  simulation: AtomifySimulation
): Promise<string> {
  const embeddableData = await convertAtomifySimulationToEmbeddable(simulation);
  return generateEmbeddedUrl(baseUrl, embeddableData);
}

// Helper function to create embedded data from a simple simulation specification
export function createSimulationDataFromFiles(
  id: string,
  title: string,
  description: string,
  inputScript: string,
  fileContents: { [fileName: string]: string },
  options: {
    analysisDescription?: string;
    analysisScript?: string;
    keywords?: string[];
  } = {}
): SimulationData {
  const simulationData = createBaseSimulationData();
  simulationData.id = id;
  simulationData.title = title;
  simulationData.description = description;
  simulationData.analysisDescription = options.analysisDescription || '';
  simulationData.analysisScript = options.analysisScript || '';
  simulationData.inputScript = inputScript;
  simulationData.keywords = options.keywords || [];

  // Convert file contents to embedded format
  Object.entries(fileContents).forEach(([fileName, content]) => {
    simulationData.files[fileName] = {
      content: { $case: 'text', text: content }
    };
  });

  return simulationData;
}

// Browser utility function to generate embedded URL from current simulation
// This can be called from the browser console when a simulation is loaded
export function generateEmbeddedUrlFromCurrentSimulation(): string | null {
  // @ts-ignore - accessing global store
  const store = window.store;
  if (!store) {
    console.error('Store not found. Make sure Atomify is loaded.');
    return null;
  }

  const state = store.getState();
  const simulation = state.simulation.simulation;
  
  if (!simulation) {
    console.error('No simulation currently loaded.');
    return null;
  }

  try {
    // Create simulation data from current simulation
    const fileContents: { [fileName: string]: string } = {};
    simulation.files.forEach((file: any) => {
      if (file.content) {
        fileContents[file.fileName] = file.content;
      }
    });

    const simulationData = createSimulationDataFromFiles(
      simulation.id,
      `Embedded ${simulation.id}`,
      'Simulation embedded from Atomify',
      simulation.inputScript,
      fileContents,
      {
        analysisDescription: simulation.analysisDescription,
        analysisScript: simulation.analysisScript,
        keywords: [] // Could extract from somewhere if available
      }
    );

    const embeddedUrl = generateEmbeddedUrl(window.location.origin + window.location.pathname, simulationData);
    console.log('Generated embedded URL:', embeddedUrl);
    return embeddedUrl;
  } catch (error) {
    console.error('Error generating embedded URL:', error);
    return null;
  }
}

// Make the function globally available for console use
declare global {
  interface Window {
    generateEmbeddedUrl?: () => string | null;
    store?: any;
  }
}

// Auto-attach to window when in browser
if (typeof window !== 'undefined') {
  window.generateEmbeddedUrl = generateEmbeddedUrlFromCurrentSimulation;
  (window as any).createSimulationDataFromFiles = createSimulationDataFromFiles;
  (window as any).generateEmbeddedUrlFn = generateEmbeddedUrl;
}