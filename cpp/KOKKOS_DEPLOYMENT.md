# KOKKOS WASM Deployment Guide

## Overview

Atomify now includes KOKKOS acceleration with multithreading support, providing up to 3x performance improvement with 4 threads. This guide explains how to deploy and configure the application properly.

## Required HTTP Headers for Browser Deployment

KOKKOS multithreading uses Web Workers with `SharedArrayBuffer`, which requires specific HTTP headers for security reasons. These headers **must** be configured on your web server:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Why These Headers Are Required

- **SharedArrayBuffer**: KOKKOS uses pthreads compiled to Web Workers, which require SharedArrayBuffer for shared memory between threads
- **Security**: Browsers require these headers to enable SharedArrayBuffer due to Spectre/Meltdown vulnerabilities
- Without these headers, the application will load but multithreading will not work

## Server Configuration Examples

### Vite (vite.config.ts)

```typescript
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
```

### Nginx

```nginx
location / {
    add_header Cross-Origin-Opener-Policy same-origin;
    add_header Cross-Origin-Embedder-Policy require-corp;
}
```

### Apache (.htaccess)

```apache
Header set Cross-Origin-Opener-Policy "same-origin"
Header set Cross-Origin-Embedder-Policy "require-corp"
```

### Node.js / Express

```javascript
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});
```

## Build Configuration

The build system (`build.py`) is configured with:

- **MEMORY64=2**: 64-bit pointers (required by KOKKOS) while keeping wasm32 binary
- **pthread**: Enable multithreading via Web Workers
- **PTHREAD_POOL_SIZE=4**: Pre-create 4 worker threads
- **INITIAL_MEMORY=256MB**: Starting memory allocation
- **MAXIMUM_MEMORY=4GB**: Maximum memory limit

## Performance Expectations

With KOKKOS enabled, you should see:

| Threads | Expected Speedup |
|---------|------------------|
| 1       | Baseline (1.0x)  |
| 2       | ~1.7x            |
| 4       | ~3.0x            |

Performance scales with system size and available threads.

## Files Generated

After building with `build.py`, you should see:

- `lammps.wasm` - Main WebAssembly binary (~17-20MB)
- `lammps.mjs` - JavaScript wrapper module
- `lammps.worker.js` - Pthread worker script (required for multithreading)

All three files must be served from the same directory.

## Troubleshooting

### Issue: "SharedArrayBuffer is not defined"

**Solution**: Ensure HTTP headers are configured correctly on your server.

### Issue: Performance not improving with multiple threads

**Possible causes**:
1. SharedArrayBuffer not enabled (check headers)
2. Input problem is too small to benefit from parallelization
3. Browser limiting worker threads (check browser console)

### Issue: Build fails with "KOKKOS_IMPL_ENABLE_STACKTRACE"

**Solution**: This should be handled automatically by `patch_cmake_for_kokkos()`. If you see this error:
1. Check that the CMakeLists.txt patch was applied
2. Run `build.py` with `--recompile` flag to force clean rebuild

## Verifying KOKKOS is Active

Check browser console for messages like:

```
KOKKOS mode is enabled
pair lj/cut/kk, perpetual
  attributes: half, newton on, kokkos_device
  pair build: half/bin/kk/device
  bin: kk/device
0.0% CPU use with 1 MPI tasks x 4 OpenMP threads
```

The presence of `/kk` suffix and "kokkos_device" confirms KOKKOS is active.

## Technical Details

### Critical Fixes Applied

1. **neigh_list_kokkos.h**: Modified to bypass Kokkos View runtime check that fails with MEMORY64+pthreads
2. **CMakeLists.txt**: Patched to disable KOKKOS stacktrace (requires execinfo.h not available in WASM)
3. **FindTPLPthread.cmake**: Copied for KOKKOS pthread detection during CMake configuration

### KOKKOS Configuration

- **Backend**: Threads (C++17 std::thread → pthreads in Emscripten)
- **libdl**: Disabled (not available in WASM)
- **Debug checks**: Disabled for performance
- **Bounds checking**: Disabled for performance

## References

For complete technical details, see:
- `lammps.kokkos.works/FIXES_SUMMARY.md` - All fixes explained
- `lammps.kokkos.works/WASM_BUILD_NOTES.md` - Build notes
- `lammps.kokkos.works/KOKKOS_BUG_ANALYSIS.md` - Analysis of View bug

## Support

If you encounter issues:
1. Verify HTTP headers are set correctly
2. Check browser console for errors
3. Ensure all three generated files (.wasm, .mjs, .worker.js) are accessible
4. Try rebuilding with `python build.py --recompile`




