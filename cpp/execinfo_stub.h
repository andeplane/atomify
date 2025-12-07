// Stub execinfo.h for Emscripten (execinfo.h is not available)
// This provides minimal declarations needed by KOKKOS stacktrace code

#ifndef EXECINFO_STUB_H
#define EXECINFO_STUB_H

#ifdef __cplusplus
extern "C" {
#endif

// Minimal stub implementations
int backtrace(void **array, int size);
char **backtrace_symbols(void *const *array, int size);
void backtrace_symbols_fd(void *const *array, int size, int fd);

#ifdef __cplusplus
}
#endif

#endif // EXECINFO_STUB_H


