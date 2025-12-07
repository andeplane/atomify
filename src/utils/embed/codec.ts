// Encoding/decoding utilities for embedding simulations in URLs
// Based on https://github.com/whitphx/stlite/tree/main/packages/sharing-common

import type { SimulationFile } from "../../store/app";
import type { Simulation } from "../../store/simulation";
import { SimulationData } from "./proto";

/**
 * Ad-hoc value that works at least on Chromium: 105.0.5195.102（Official Build） （arm64）.
 * Decrease this if `RangeError: Maximum call stack size exceeded` is reported.
 */
const DEFAULT_APPLY_MAX = 2 ** 16;

export function u8aToBase64(buf: Uint8Array, applyMax?: number): string {
  // If `buf` is too long, `String.fromCharCode.apply(null, buf)`
  // throws `RangeError: Maximum call stack size exceeded`,
  // so we split the buffer into chunks and process them one by one.
  let str = "";
  const chunkSize = applyMax ?? DEFAULT_APPLY_MAX;
  const nChunks = Math.ceil(buf.length / chunkSize);
  for (let i = 0; i < nChunks; ++i) {
    const offset = chunkSize * i;
    const chunk = buf.slice(offset, offset + chunkSize);
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
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ",");
}

function b64urlToB64(hashSafe: string): string {
  return hashSafe.replace(/-/g, "+").replace(/_/g, "/").replace(/,/g, "=");
}

/**
 * Fetches file content from URL if not already present
 */
async function ensureFileContent(file: SimulationFile): Promise<string> {
  if (file.content) {
    return file.content;
  }

  if (file.url) {
    const response = await fetch(file.url);
    return await response.text();
  }

  throw new Error(`File ${file.fileName} has neither content nor url`);
}

/**
 * Encodes a Simulation object to a base64url string for URL embedding
 */
export async function encodeSimulation(simulation: Simulation): Promise<string> {
  const simulationData: SimulationData = {
    id: simulation.id,
    inputScript: simulation.inputScript,
    analysisScript: simulation.analysisScript,
    files: {},
  };

  // Fetch all file contents
  for (const file of simulation.files) {
    const content = await ensureFileContent(file);
    simulationData.files[file.fileName] = {
      content: { $case: "text", text: content },
    };
  }

  const encodedProto = SimulationData.encode(simulationData).finish();

  // NOTE: Both `u8aToBase64(encodedProto)` and `u8aToBase64(new Uint8Array(encodedProto))` causes an error: https://github.com/whitphx/stlite/issues/235
  //       Creating a new array buffer with `Uint8Array.from(encodedProto)` and passing it as below is necessary.
  //
  // `encodedProto` is NOT Uint8Array but Buffer, although it is typed as Uint8Array (we can find it by printing it with `console.log(encodedProto)`).
  // With respect to static typing, Buffer is a subtype of Uint8Array (https://github.com/protobufjs/protobuf.js/blob/48457c47372c39e07a8ecf1360f80de7f263ab2e/index.d.ts#L1850),
  // however, the implementations are different and it causes the problem at runtime.
  // Probably Buffer holds its raw binary data in its internals and only exposes some views of it.
  // This usually works well, but it becomes a problem when passed to a constructor of an array buffer view class like `Uint8Array`.
  // `new Uint8Array(buffer)` may provide the direct accessor to the underlying binary data in the original Buffer instance,
  // and the data read from the Uint8Array instance can differ from the one from the buffer.
  // So, we need to create a new array buffer with `Uint8Array.from()` sourced from the data read through the buffer interface here.
  const base64 = u8aToBase64(Uint8Array.from(encodedProto));
  return b64ToB64url(base64);
}

/**
 * Decodes a base64url string to a Simulation object
 */
export function decodeSimulation(base64url: string, autoStart: boolean = true): Simulation {
  const base64 = b64urlToB64(base64url);
  const buf = base64ToU8A(base64);
  const simulationData = SimulationData.decode(buf);

  const files: SimulationFile[] = Object.entries(simulationData.files).map(([fileName, file]) => {
    let content = "";
    if (file.content?.$case === "text") {
      content = file.content.text;
    } else if (file.content?.$case === "data") {
      // Convert binary data to text if needed
      const decoder = new TextDecoder();
      content = decoder.decode(file.content.data);
    }

    return {
      fileName,
      content,
    };
  });

  return {
    id: simulationData.id,
    inputScript: simulationData.inputScript,
    analysisScript: simulationData.analysisScript,
    files,
    start: autoStart,
  };
}
