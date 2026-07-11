/**
 * Patch the built JupyterLite service worker to inject COOP/COEP headers.
 *
 * The Atomify page is cross-origin isolated (COOP/COEP, required for
 * SharedArrayBuffer in the KOKKOS wasm build). A cross-origin-isolated
 * document may only embed iframes whose responses also carry a COEP
 * header. GitHub Pages cannot set response headers, and the Notebook
 * iframe (/jupyter/lab/) is controlled by JupyterLite's own service
 * worker — its scope is more specific than the coi-serviceworker shim's,
 * so the shim never sees those requests. Without this patch the browser
 * blocks the iframe with ERR_BLOCKED_BY_RESPONSE (blocked:COEP).
 *
 * The patch wraps FetchEvent.prototype.respondWith so every response the
 * service worker serves gets the headers, regardless of which internal
 * code path produced it. Re-running after editing the template below
 * replaces a previously applied patch.
 *
 * Run after `jupyter lite build` (see .github/workflows/deploy.yaml):
 *   node scripts/patch-jupyterlite-sw.mjs [path/to/jupyter/output]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outputDir = process.argv[2] ?? "public/jupyter";
const swPath = join(outputDir, "service-worker.js");

const MARKER = "/* atomify-coi-patch */";

const PATCH = `
${MARKER}
const atomifyWithCoiHeaders = (response) => {
  if (
    !(response instanceof Response) ||
    response.status === 0 ||
    response.type === "opaque" ||
    response.type === "opaqueredirect"
  ) {
    return response;
  }
  try {
    const headers = new Headers(response.headers);
    headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    // Null-body statuses reject a body stream in the Response constructor.
    const body = [204, 205, 304].includes(response.status)
      ? null
      : response.body;
    const patched = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    // The Response constructor resets url/redirected; restore them for
    // consumers that read them.
    if (response.url) {
      Object.defineProperty(patched, "url", { value: response.url });
    }
    if (response.redirected) {
      Object.defineProperty(patched, "redirected", { value: true });
    }
    return patched;
  } catch (error) {
    // Never wedge the service worker on an unexpected response shape;
    // worst case the un-patched response re-blocks the notebook iframe.
    console.warn(
      "atomify-coi-patch: could not inject COOP/COEP headers",
      error,
    );
    return response;
  }
};
const atomifyOriginalRespondWith = FetchEvent.prototype.respondWith;
FetchEvent.prototype.respondWith = function (response) {
  return atomifyOriginalRespondWith.call(
    this,
    Promise.resolve(response).then(atomifyWithCoiHeaders),
  );
};
`;

let source = readFileSync(swPath, "utf8");

if (!source.includes('addEventListener("fetch"')) {
  throw new Error(
    `${swPath} does not register a fetch handler — the JupyterLite ` +
      "service worker changed upstream; update scripts/patch-jupyterlite-sw.mjs",
  );
}

const markerIndex = source.indexOf(MARKER);
if (markerIndex !== -1) {
  // Already patched (possibly by an older version of this script):
  // strip the previous patch so the current template always applies.
  source = source.slice(0, markerIndex).trimEnd() + "\n";
  console.log(`${swPath} was already patched, replacing the patch`);
}

writeFileSync(swPath, source + PATCH);
console.log(`Patched ${swPath} with COOP/COEP header injection`);
