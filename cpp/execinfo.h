// Stub execinfo.h for Emscripten (execinfo.h is not available)
// This provides minimal declarations needed by KOKKOS stacktrace code

#ifndef EXECINFO_STUB_H
#define EXECINFO_STUB_H

#ifdef __cplusplus
extern "C" {
#endif

// Minimal stub implementations - return empty/zero values
// These are called by KOKKOS but we don't need actual stacktraces in WASM
static inline int backtrace(void **array, int size) {
    (void)array;
    (void)size;
    return 0;
}

static inline char **backtrace_symbols(void *const *array, int size) {
    (void)array;
    (void)size;
    return NULL;
}

static inline void backtrace_symbols_fd(void *const *array, int size, int fd) {
    (void)array;
    (void)size;
    (void)fd;
}

#ifdef __cplusplus
}
#endif

#endif // EXECINFO_STUB_H

