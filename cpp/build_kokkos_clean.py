#!/usr/bin/env python3
"""
Build script for clean LAMMPS with KOKKOS package using Emscripten.
This builds LAMMPS without any custom atomify modifications.
"""

import os
import subprocess
import sys
import shutil

# Paths
EMSDK_PATH = "/Users/anderhaf/repos/emsdk"
LAMMPS_DIR = "lammps"
BUILD_DIR = os.path.join(LAMMPS_DIR, "build-emscripten")
CMAKE_SOURCE_DIR = os.path.join(LAMMPS_DIR, "cmake")

def setup_emscripten():
    """Set up Emscripten environment."""
    print("Setting up Emscripten environment...")
    
    emsdk_env = os.path.join(EMSDK_PATH, "emsdk_env.sh")
    if not os.path.exists(emsdk_env):
        print(f"ERROR: Emscripten SDK not found at {EMSDK_PATH}")
        print("Please ensure Emscripten SDK is installed at the specified path.")
        sys.exit(1)
    
    # Source the emsdk_env.sh script
    # We'll need to run commands through a shell that sources this
    print(f"Found Emscripten SDK at {EMSDK_PATH}")
    
    # Check for toolchain file
    toolchain_file = os.path.join(EMSDK_PATH, "upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake")
    if not os.path.exists(toolchain_file):
        # Try alternative location
        toolchain_file = os.path.join(EMSDK_PATH, "upstream/emscripten/cmake/Modules/Platform/Emscripten.cmake")
        if not os.path.exists(toolchain_file):
            print(f"WARNING: Could not find Emscripten toolchain file at expected location")
            print("Will try to use emcmake which should find it automatically")
            toolchain_file = None
    
    if toolchain_file:
        print(f"Found Emscripten toolchain file: {toolchain_file}")
    
    return toolchain_file

def verify_emscripten():
    """Verify Emscripten tools are available."""
    print("Verifying Emscripten tools...")
    
    # We'll check this by trying to run emcc --version through a shell that sources emsdk_env.sh
    emsdk_env = os.path.join(EMSDK_PATH, "emsdk_env.sh")
    check_cmd = f'source {emsdk_env} && emcc --version'
    
    result = subprocess.run(
        check_cmd,
        shell=True,
        capture_output=True,
        text=True,
        executable='/bin/bash'
    )
    
    if result.returncode != 0:
        print("ERROR: Could not verify Emscripten installation")
        print(result.stderr)
        sys.exit(1)
    
    print("Emscripten tools verified successfully")
    print(f"Version info:\n{result.stdout[:200]}")  # Print first 200 chars

def prepare_build_directory():
    """Create and prepare the build directory."""
    print(f"Preparing build directory: {BUILD_DIR}")
    
    if os.path.exists(BUILD_DIR):
        print(f"Build directory already exists. Cleaning...")
        shutil.rmtree(BUILD_DIR)
    
    os.makedirs(BUILD_DIR, exist_ok=True)
    print(f"Build directory created: {BUILD_DIR}")

def configure_cmake(toolchain_file=None):
    """Configure CMake with Emscripten and KOKKOS."""
    print("Configuring CMake with Emscripten and KOKKOS...")
    
    if not os.path.exists(CMAKE_SOURCE_DIR):
        print(f"ERROR: CMake source directory not found: {CMAKE_SOURCE_DIR}")
        sys.exit(1)
    
    # Build cmake command - source path should be relative to build directory
    cmake_source = "../cmake"  # Relative to build directory
    # Add stub execinfo.h to include path (execinfo.h not available in Emscripten)
    stub_include = os.path.abspath(".")  # Directory containing execinfo_stub.h
    
    cmake_args = [
        "emcmake", "cmake",
        cmake_source,
        "-DCMAKE_BUILD_TYPE=Release",
        "-DPKG_KOKKOS=ON",
        "-DPKG_COLVARS=OFF",  # Explicitly disable COLVARS for clean build
        "-DKokkos_ENABLE_SERIAL=ON",
        "-DKokkos_ENABLE_OPENMP=OFF",
        "-DKokkos_ENABLE_CUDA=OFF",
        "-DKokkos_ENABLE_HIP=OFF",
        "-DKokkos_ENABLE_SYCL=OFF",
        "-DKokkos_ENABLE_THREADS=OFF",
        "-DKokkos_ENABLE_LIBDL=OFF",  # Disable libdl for Emscripten
        "-DKokkos_ENABLE_DEPRECATION_WARNINGS=OFF",
        "-DCMAKE_CXX_STANDARD=17",
        # Enable 64-bit memory for KOKKOS (requires 64-bit pointers)
        # Set pointer size to 8 bytes for KOKKOS compatibility
        "-DCMAKE_SIZEOF_VOID_P=8",
        # Enable MEMORY64 in Emscripten flags and add stub include path
        # Define COLVARS_LAMMPS to use LAMMPS math implementation (even though COLVARS is disabled)
        f'-DCMAKE_CXX_FLAGS="-sMEMORY64=1 -I{stub_include} -DCOLVARS_LAMMPS"',
        f'-DCMAKE_C_FLAGS="-sMEMORY64=1 -I{stub_include} -DCOLVARS_LAMMPS"',
        "-DCMAKE_EXE_LINKER_FLAGS=-sMEMORY64=1",
    ]
    
    if toolchain_file:
        cmake_args.append(f"-DCMAKE_TOOLCHAIN_FILE={toolchain_file}")
    
    # Source emsdk_env.sh and run cmake
    emsdk_env = os.path.join(EMSDK_PATH, "emsdk_env.sh")
    cmake_cmd = f'source {emsdk_env} && cd {BUILD_DIR} && {" ".join(cmake_args)}'
    
    print(f"Running: {' '.join(cmake_args)}")
    result = subprocess.run(
        cmake_cmd,
        shell=True,
        executable='/bin/bash'
    )
    
    if result.returncode != 0:
        print("ERROR: CMake configuration failed")
        sys.exit(1)
    
    print("CMake configuration completed successfully")

def build_lammps():
    """Build LAMMPS using emmake."""
    print("Building LAMMPS with KOKKOS...")
    
    emsdk_env = os.path.join(EMSDK_PATH, "emsdk_env.sh")
    build_cmd = f'source {emsdk_env} && cd {BUILD_DIR} && emmake make -j8'
    
    print("Running build...")
    result = subprocess.run(
        build_cmd,
        shell=True,
        executable='/bin/bash'
    )
    
    if result.returncode != 0:
        print("ERROR: Build failed")
        sys.exit(1)
    
    print("Build completed successfully")

def verify_output():
    """Verify that output files were generated."""
    print("Verifying output files...")
    
    # Check for common output files
    wasm_files = []
    js_files = []
    
    if os.path.exists(BUILD_DIR):
        for root, dirs, files in os.walk(BUILD_DIR):
            for file in files:
                if file.endswith('.wasm'):
                    wasm_files.append(os.path.join(root, file))
                if file.endswith('.js') or file.endswith('.mjs'):
                    js_files.append(os.path.join(root, file))
    
    print(f"Found {len(wasm_files)} WASM file(s):")
    for f in wasm_files:
        size = os.path.getsize(f) / (1024 * 1024)  # Size in MB
        print(f"  - {f} ({size:.2f} MB)")
    
    print(f"Found {len(js_files)} JS/MJS file(s):")
    for f in js_files[:5]:  # Show first 5
        print(f"  - {f}")
    if len(js_files) > 5:
        print(f"  ... and {len(js_files) - 5} more")
    
    # Also check for library files
    lib_files = []
    if os.path.exists(BUILD_DIR):
        for root, dirs, files in os.walk(BUILD_DIR):
            for file in files:
                if file.endswith('.a') or file.endswith('.so'):
                    lib_files.append(os.path.join(root, file))
    
    if lib_files:
        print(f"Found {len(lib_files)} library file(s):")
        for f in lib_files[:5]:
            size = os.path.getsize(f) / (1024 * 1024)
            print(f"  - {f} ({size:.2f} MB)")
    
    if not wasm_files and not lib_files:
        print("WARNING: No WASM or library files found. Build may have produced different output.")
        print("This might be expected if CMake builds a library that needs to be linked separately.")
    
    return len(wasm_files) > 0 or len(lib_files) > 0

def main():
    """Main build function."""
    print("=" * 60)
    print("LAMMPS + KOKKOS Clean Build with Emscripten")
    print("=" * 60)
    
    # Check if LAMMPS directory exists
    if not os.path.exists(LAMMPS_DIR):
        print(f"ERROR: LAMMPS directory not found: {LAMMPS_DIR}")
        print("Please ensure LAMMPS is cloned in the cpp directory.")
        sys.exit(1)
    
    # Setup
    toolchain_file = setup_emscripten()
    verify_emscripten()
    prepare_build_directory()
    
    # Build
    configure_cmake(toolchain_file)
    build_lammps()
    
    # Verify
    if verify_output():
        print("\n" + "=" * 60)
        print("Build completed successfully!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("Build completed, but output verification found issues.")
        print("Check the build directory for generated files.")
        print("=" * 60)

if __name__ == "__main__":
    main()

