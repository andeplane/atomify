import os
import subprocess
import shutil
import hashlib
import sys

# Emscripten SDK path - adjust if needed
EMSDK_PATH = "/Users/anderhaf/repos/emsdk"
BUILD_DIR = "build_emscripten"

# ============================================================================
# Custom file copying functions
# ============================================================================
# These functions copy custom modifications that aren't part of standard LAMMPS.
# CMake handles standard dependencies (Voro++, COLVARS) automatically.
# ============================================================================

def copy_moltemplate_files():
  """Copy custom pair styles for moltemplate."""
  files = [
    ("moltemplate_additional_lammps_code/pair_lj_charmm_coul_charmm_inter.cpp", "lammps/src/pair_lj_charmm_coul_charmm_inter.cpp"),
    ("moltemplate_additional_lammps_code/pair_lj_charmm_coul_charmm_inter.h", "lammps/src/pair_lj_charmm_coul_charmm_inter.h"),
    ("moltemplate_additional_lammps_code/pair_lj_remix.cpp", "lammps/src/pair_lj_remix.cpp"),
    ("moltemplate_additional_lammps_code/pair_lj_remix.h", "lammps/src/pair_lj_remix.h"),
    ("moltemplate_additional_lammps_code/pair_lj_softcore2.cpp", "lammps/src/pair_lj_softcore2.cpp"),
    ("moltemplate_additional_lammps_code/pair_lj_softcore2.h", "lammps/src/pair_lj_softcore2.h"),
  ]
  for src, dst in files:
    if file_content(src) != file_content(dst):
      print(f"Copying {src} to {dst}...")
      shutil.copyfile(src, dst)

def copy_mpi_files_and_patch():
  """Copy custom MPI stubs for Emscripten (no real MPI support) and patch file."""
  files = [
    ("mpi.cpp", "lammps/src/mpi.cpp"),
    ("lammps/src/STUBS/mpi.h", "lammps/src/mpi.h"),
    ("lammps.patch", "lammps/src/lammps.patch"),
    ("lammpsweb/fix_atomify.cpp", "lammps/src/fix_atomify.cpp"),
    ("lammpsweb/fix_atomify.h", "lammps/src/fix_atomify.h"),
  ]
  for src, dst in files:
    if file_content(src) != file_content(dst):
      print(f"Copying {src} to {dst}...")
      shutil.copyfile(src, dst)

def file_content(path):
  if not os.path.exists(path):
    return ""
  return open(path, 'r').read()

def copy_atomify_files():
  """Copy custom Atomify/lammpsweb files with Emscripten bindings."""
  files = ["atomify_compute", "atomify_modify", "atomify_fix", "atomify_variable", "fix_atomify", "lammpsweb", "data1d"]
  for file in files:
    cpp_new_path = os.path.join('lammpsweb', file+".cpp")
    cpp_lmp_path = os.path.join('lammps/src', file+".cpp")
    h_new_path = os.path.join('lammpsweb', file+".h")
    h_lmp_path = os.path.join('lammps/src', file+".h")
    
    if file_content(cpp_new_path) != file_content(cpp_lmp_path) or file_content(h_new_path) != file_content(h_lmp_path):
      print(f"{file} is updated. Copying new version...")
      shutil.copyfile(cpp_new_path, cpp_lmp_path)
      shutil.copyfile(h_new_path, h_lmp_path)

def setup_emscripten():
  """Set up Emscripten environment."""
  emsdk_env = os.path.join(EMSDK_PATH, "emsdk_env.sh")
  if not os.path.exists(emsdk_env):
    print(f"ERROR: Emscripten SDK not found at {EMSDK_PATH}")
    print("Please ensure Emscripten SDK is installed at the specified path.")
    sys.exit(1)
  return emsdk_env

def configure_cmake(debug_mode=False):
  """Configure CMake with Emscripten and required packages."""
  print("Configuring CMake with Emscripten...")
  
  # CMake source path relative to build directory
  cmake_source = "../lammps/cmake"
  # Verify it exists (check from current directory, not build directory)
  cmake_source_abs = os.path.join("lammps", "cmake")
  if not os.path.exists(cmake_source_abs):
    print(f"ERROR: CMake source directory not found: {cmake_source_abs}")
    sys.exit(1)
  
  # Packages to enable (matching the old make yes-* commands)
  packages = [
    "RIGID", "CLASS2", "MANYBODY", "MC", "MOLECULE", "GRANULAR",
    "KSPACE", "SHOCK", "MISC", "QEQ", "REAXFF", "EXTRA-MOLECULE",
    "VORONOI", "COLVARS"
  ]
  
  # Build CMake package flags
  package_flags = [f"-DPKG_{pkg}=ON" for pkg in packages]
  
  # Common compiler flags
  cc_flags_common = "-DLAMMPS_EXCEPTIONS -DLAMMPS_SMALLSMALL -s NO_DISABLE_EXCEPTION_CATCHING=1 -DCOLVARS_LAMMPS"
  
  if debug_mode:
    # Debug flags
    cc_flags = f"-O0 -gsource-map {cc_flags_common}"
    build_type = "Debug"
  else:
    # Release flags
    cc_flags = f"-Oz -DNDEBUG -flto {cc_flags_common}"
    build_type = "Release"
  
  cmake_args = [
    "emcmake", "cmake",
    cmake_source,
    f"-DCMAKE_BUILD_TYPE={build_type}",
    "-DCMAKE_CXX_STANDARD=17",
    "-DCMAKE_CXX_STANDARD_REQUIRED=ON",
    "-DLAMMPS_SIZES=smallsmall",  # Use 32-bit integers (matches Makefile)
    "-DDOWNLOAD_VORO=ON",  # Let CMake download and build Voro++ automatically
    f'-DCMAKE_CXX_FLAGS="{cc_flags}"',
    f'-DCMAKE_C_FLAGS="{cc_flags}"',
  ] + package_flags
  
  # Source emsdk_env.sh and run cmake
  emsdk_env = setup_emscripten()
  cmake_cmd = f'source {emsdk_env} && cd {BUILD_DIR} && {" ".join(cmake_args)}'
  
  result = subprocess.call(cmake_cmd, shell=True, executable="/bin/bash")
  if result != 0:
    print(f"CMake configuration failed with exit code {result}")
    sys.exit(result)
  
  print("CMake configuration complete!")

def build_lammps_library():
  """Build the LAMMPS library using CMake."""
  print("Building LAMMPS library...")
  
  emsdk_env = setup_emscripten()
  build_cmd = f'source {emsdk_env} && cd {BUILD_DIR} && cmake --build . --target lammps -j8'
  
  result = subprocess.call(build_cmd, shell=True, executable="/bin/bash")
  if result != 0:
    print(f"Build failed with exit code {result}")
    sys.exit(result)
  
  print("LAMMPS library build complete!")

def link_wasm_module(debug_mode=False):
  """Link the LAMMPS library and lammpsweb files into a WASM module."""
  print("Linking WASM module...")
  
  # Find the library file (relative to current directory)
  lib_path = os.path.join(BUILD_DIR, "liblammps.a")
  if not os.path.exists(lib_path):
    # Try alternative location
    lib_path = os.path.join(BUILD_DIR, "lib", "liblammps.a")
    if not os.path.exists(lib_path):
      print(f"ERROR: LAMMPS library not found at {lib_path}")
      sys.exit(1)
  
  # Build emcc command - use absolute path for library
  lib_abs_path = os.path.abspath(lib_path)
  locate_file_abs = os.path.abspath("locateFile.js")
  
  emcc_args = []
  
  if debug_mode:
    emcc_args.extend(["-O1", "-gsource-map", "--source-map-base=http://localhost:3000/atomify/"])
  else:
    emcc_args.extend(["-Oz", "-flto"])
  
  # Common linker flags
  emcc_args.extend([
    "--pre-js", locate_file_abs,
    "--no-entry",
    "-lembind",
    "-s", "ENVIRONMENT='web'",
    "-s", "NO_DISABLE_EXCEPTION_CATCHING=1",
    "-s", "ALLOW_MEMORY_GROWTH=1",
    "-s", "ASYNCIFY",
    "-s", "MODULARIZE=1",
    "-s", "EXPORTED_RUNTIME_METHODS=['getValue','FS','HEAP32','HEAPF32','HEAPF64']",
    "-s", "EXPORT_NAME='createModule'",
    "-s", "FORCE_FILESYSTEM=1",
    "-o", "lammps.mjs",
    lib_abs_path
  ])
  
  emsdk_env = setup_emscripten()
  # Build command with proper quoting
  emcc_cmd = "emcc " + " ".join(f'"{arg}"' if any(c in arg for c in [" ", "=", "'", "["]) else arg for arg in emcc_args)
  full_cmd = f'source {emsdk_env} && {emcc_cmd}'
  
  result = subprocess.call(full_cmd, shell=True, executable="/bin/bash")
  if result != 0:
    print(f"WASM linking failed with exit code {result}")
    sys.exit(result)
  
  print("WASM module linking complete!")

if not os.path.exists('lammps'):
  # First clone lammps
  print("Could not find local clone of LAMMPS, cloning ...")
  clone_result = subprocess.call("git clone --depth 1 --branch stable_23Jun2022_update1  https://github.com/lammps/lammps.git", shell=True)
  if clone_result != 0:
    print(f"ERROR: Git clone failed with exit code {clone_result}")
    sys.exit(clone_result)
  
  # Verify lammps directory was created
  if not os.path.exists('lammps'):
    print("ERROR: LAMMPS directory was not created after clone")
    sys.exit(1)
  
  # Verify lammps/src directory exists
  if not os.path.exists('lammps/src'):
    print("ERROR: LAMMPS src directory does not exist")
    sys.exit(1)
  
  print("Copying modified files ...")
  copy_mpi_files_and_patch() # Custom MPI stubs for Emscripten
  copy_moltemplate_files()  # Custom pair styles

  cwd = os.getcwd()
  print("Changing directory ...")
  os.chdir('lammps/src')
  print("Applying patch ...")
  patch_result = subprocess.call("git apply lammps.patch", shell=True)
  if patch_result != 0:
    print(f"WARNING: Patch application failed with exit code {patch_result}")
    # Don't exit, as patch might already be applied
  
  if os.path.isfile('fix_imd.cpp'):
    print("Deleting non-functioning files fix_imd ...")
    os.remove('fix_imd.cpp')
    os.remove('fix_imd.h')
  
  # Also delete fix_imd from MISC directory (it's part of MISC package)
  misc_fix_imd_cpp = os.path.join('MISC', 'fix_imd.cpp')
  misc_fix_imd_h = os.path.join('MISC', 'fix_imd.h')
  if os.path.isfile(misc_fix_imd_cpp):
    print("Deleting non-functioning files MISC/fix_imd ...")
    os.remove(misc_fix_imd_cpp)
    os.remove(misc_fix_imd_h)
  
  os.chdir(cwd)

print("Copying modified files ...")
copy_atomify_files()

# Delete fix_imd files before CMake configuration (in case they exist)
# This needs to happen after copying files but before CMake config
misc_fix_imd_cpp = os.path.join('lammps', 'src', 'MISC', 'fix_imd.cpp')
misc_fix_imd_h = os.path.join('lammps', 'src', 'MISC', 'fix_imd.h')
if os.path.isfile(misc_fix_imd_cpp):
  print("Deleting non-functioning files MISC/fix_imd before CMake configuration...")
  os.remove(misc_fix_imd_cpp)
  os.remove(misc_fix_imd_h)

# Check if recompile flag is passed
if "--recompile" in sys.argv or "-r" in sys.argv:
  print("Cleaning build directory to force full recompilation...")
  if os.path.exists(BUILD_DIR):
    shutil.rmtree(BUILD_DIR)
  print("Clean complete, proceeding with build...")

# Create build directory if it doesn't exist
if not os.path.exists(BUILD_DIR):
  os.makedirs(BUILD_DIR)

# Check if DEBUG flag is passed
debug_mode = "--debug" in sys.argv or "-d" in sys.argv
if debug_mode:
  print("Building in DEBUG mode with source maps and symbols...")
else:
  print("Building in RELEASE mode (optimized)...")

# Configure CMake
configure_cmake(debug_mode=debug_mode)

# Build the library
build_lammps_library()

# Link WASM module (lammpsweb files are already in the library)
link_wasm_module(debug_mode=debug_mode)

print("Copying compiled files into src directory ...")
if not os.path.exists("lammps.wasm"):
  print("ERROR: lammps.wasm was not generated!")
  sys.exit(1)

shutil.copyfile("lammps.wasm", "../public/lammps.wasm")
with open('lammps.mjs') as f:
  content = f.read()
  with open("../src/wasm/lammps.mjs", "w") as g:
    g.write("/* eslint-disable */\n")
    g.write(content)

print("Build complete!")
