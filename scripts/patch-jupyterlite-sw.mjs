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
 * Run after `jupyter lite build` (see .github/workflows/deploy.yaml):
 *   node scripts/patch-jupyterlite-sw.mjs [path/to/jupyter/output]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outputDir = process.argv[2] ?? "public/jupyter";
const swPath = join(outputDir, "service-worker.js");

const MARKER = "/* atomify-coi-patch */";

// The wrapped function is the single exit point for every GET response the
// JupyterLite service worker serves (both cache hits and network fetches),
// including the iframe document navigation itself.
const WRAPPED_FUNCTION = "maybeFromCache";

const PATCH = `
${MARKER}
const atomifyWithCoiHeaders = (response) => {
  if (
    !response ||
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
    const body = [101, 103, 204, 205, 304].includes(response.status)
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
    return response;
  }
};
${WRAPPED_FUNCTION} = (
  (original) => async (event) =>
    atomifyWithCoiHeaders(await original(event))
)(${WRAPPED_FUNCTION});
`;

const source = readFileSync(swPath, "utf8");

if (source.includes(MARKER)) {
  console.log(`${swPath} already patched, skipping`);
  process.exit(0);
}

if (!source.includes(`function ${WRAPPED_FUNCTION}(`)) {
  throw new Error(
    `${swPath} does not define ${WRAPPED_FUNCTION}() — the JupyterLite ` +
      "service worker changed upstream; update scripts/patch-jupyterlite-sw.mjs",
  );
}

writeFileSync(swPath, source + PATCH);
console.log(`Patched ${swPath} with COOP/COEP header injection`);
