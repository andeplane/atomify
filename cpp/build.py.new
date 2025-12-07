import os
import subprocess
import shutil
import hashlib
import sys

LAMMPS_BRANCH = "stable_22Jul2025_update1"

# Ensure we're running from the cpp/ directory
# This allows the script to be called from the root or from cpp/
script_dir = os.path.dirname(os.path.abspath(__file__))
if os.getcwd() != script_dir:
  print(f"Changing directory to: {script_dir}")
  os.chdir(script_dir)

# Emscripten SDK path - adjust if needed
EMSDK_PATH = os.environ.get("EMSDK_PATH")
if not EMSDK_PATH:
  print("ERROR: EMSDK_PATH is not set")
  sys.exit(1)
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

def copy_patch_and_atomify_fix():
  """Copy custom patch file and fix_atomify (not part of standard LAMMPS)."""
  files = [
    # ("lammps.patch", "lammps/src/lammps.patch"),
    # ("lammpsweb/fix_atomify.cpp", "lammps/src/fix_atomify.cpp"),
    # ("lammpsweb/fix_atomify.h", "lammps/src/fix_atomify.h"),
  ]
  for src, dst in files:
    if file_content(src) != file_content(dst):
      print(f"Copying {src} to {dst}...")
      shutil.copyfile(src, dst)

def file_content(path):
  if not os.path.exists(path):
    return ""
  with open(path, 'r') as f:
    return f.read()

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

def configure_cmake(emsdk_env, debug_mode=False):
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
  cc_flags_common = "-DLAMMPS_EXCEPTIONS -s NO_DISABLE_EXCEPTION_CATCHING=1 -DCOLVARS_LAMMPS"
  
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
    "-DLAMMPS_SIZES=smallbig",
    "-DBUILD_MPI=OFF",  # Use LAMMPS built-in MPI STUBS for serial build
    "-DDOWNLOAD_VORO=ON",  # Let CMake download and build Voro++ automatically
    f'-DCMAKE_CXX_FLAGS="{cc_flags}"',
    f'-DCMAKE_C_FLAGS="{cc_flags}"',
  ] + package_flags
  
  # Source emsdk_env.sh and run cmake
  cmake_cmd = f'source {emsdk_env} && cd {BUILD_DIR} && {" ".join(cmake_args)}'
  
  subprocess.run(cmake_cmd, shell=True, executable="/bin/bash", check=True)
  print("CMake configuration complete!")

def build_lammps_library(emsdk_env):
  """Build the LAMMPS library using CMake."""
  print("Building LAMMPS library...")
  
  build_cmd = f'source {emsdk_env} && cd {BUILD_DIR} && cmake --build . --target lammps -j{os.cpu_count() or 1}'
  
  subprocess.run(build_cmd, shell=True, executable="/bin/bash", check=True)
  print("LAMMPS library build complete!")

def link_wasm_module(emsdk_env, debug_mode=False, use_asyncify=False):
  """Link the LAMMPS library into a WASM module."""
  print(f"Linking WASM module (asyncify={'enabled' if use_asyncify else 'disabled'})...")
  
  # Find the library files
  lib_path = os.path.join(BUILD_DIR, "liblammps.a")
  if not os.path.exists(lib_path):
    lib_path = os.path.join(BUILD_DIR, "lib", "liblammps.a")
    if not os.path.exists(lib_path):
      print(f"ERROR: LAMMPS library not found at {lib_path}")
      sys.exit(1)
  
  # Also need colvars, lepton, and voro++ libraries (built by CMake)
  colvars_lib = os.path.join(BUILD_DIR, "liblammps_colvars.a")
  lepton_lib = os.path.join(BUILD_DIR, "liblammps_lepton.a")
  voro_lib = os.path.join(BUILD_DIR, "voro_build-prefix/src/voro_build/src/libvoro++.a")
  
  # Build emcc command - use absolute paths
  lib_abs_path = os.path.abspath(lib_path)
  colvars_abs_path = os.path.abspath(colvars_lib) if os.path.exists(colvars_lib) else None
  lepton_abs_path = os.path.abspath(lepton_lib) if os.path.exists(lepton_lib) else None
  voro_abs_path = os.path.abspath(voro_lib) if os.path.exists(voro_lib) else None
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
    "-s", "ENVIRONMENT=web,node,worker",
    "-s", "NO_DISABLE_EXCEPTION_CATCHING=1",
    "-s", "ALLOW_MEMORY_GROWTH=1",
    "-s", "ALLOW_TABLE_GROWTH=1",
    "-s", "INITIAL_TABLE=1024",
  ])
  
  # Add ASYNCIFY only if requested
  if use_asyncify:
    emcc_args.extend(["-s", "ASYNCIFY"])
  
  emcc_args.extend([
    "-s", "MODULARIZE=1",
    "-s", "EXPORTED_RUNTIME_METHODS=['getValue','FS','HEAP32','HEAPF32','HEAPF64']",
    "-s", "EXPORT_NAME='createModule'",
    "-s", "FORCE_FILESYSTEM=1",
    "-Wl,--whole-archive",  # Force inclusion of all symbols, including Emscripten bindings
    lib_abs_path,
  ])
  
  # Add colvars, lepton, and voro++ libraries if they exist
  if colvars_abs_path:
    emcc_args.append(colvars_abs_path)
  if lepton_abs_path:
    emcc_args.append(lepton_abs_path)
  if voro_abs_path:
    emcc_args.append(voro_abs_path)
  
  emcc_args.extend([
    "-Wl,--no-whole-archive",
    "-o", "lammps.mjs",
  ])
  
  # Build command with proper quoting
  # Quote arguments that contain shell metacharacters (spaces, quotes, brackets, etc.)
  emcc_cmd = "emcc " + " ".join(f'"{arg}"' if any(c in arg for c in [" ", "'", "[", "]"]) else arg for arg in emcc_args)
  full_cmd = f'source {emsdk_env} && {emcc_cmd}'
  
  subprocess.run(full_cmd, shell=True, executable="/bin/bash", check=True)
  print("WASM module linking complete!")

if not os.path.exists('lammps'):
  # First clone lammps
  print("Could not find local clone of LAMMPS, cloning ...")
  subprocess.run(f"git clone --depth 1 --branch {LAMMPS_BRANCH}  https://github.com/lammps/lammps.git", shell=True, check=True)
  
  # Verify lammps directory was created
  if not os.path.exists('lammps'):
    print("ERROR: LAMMPS directory was not created after clone")
    sys.exit(1)
  
  # Verify lammps/src directory exists
  if not os.path.exists('lammps/src'):
    print("ERROR: LAMMPS src directory does not exist")
    sys.exit(1)
  
  print("Copying modified files ...")
  copy_patch_and_atomify_fix() # Custom patch and fix_atomify
  copy_moltemplate_files()  # Custom pair styles

  cwd = os.getcwd()
  print("Changing directory ...")
  os.chdir('lammps/src')
  print("Applying patch ...")
  try:
    subprocess.run("git apply lammps.patch", shell=True, check=True)
  except subprocess.CalledProcessError as e:
    print(f"WARNING: Patch application failed with exit code {e.returncode}")
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

# Check if asyncify flag is passed (default is sync mode)
use_asyncify = "--asyncify" in sys.argv
if use_asyncify:
  print("Building WITH Asyncify (async mode)...")
else:
  print("Building in synchronous mode (default, optimized for web workers)...")

# Set up Emscripten environment once
emsdk_env = setup_emscripten()

# Configure CMake
configure_cmake(emsdk_env, debug_mode=debug_mode)

# Build the library
build_lammps_library(emsdk_env)

# Link WASM module (lammpsweb files are already in the library)
link_wasm_module(emsdk_env, debug_mode=debug_mode, use_asyncify=use_asyncify)

print("Verifying WASM files were generated ...")
if not os.path.exists("lammps.wasm"):
  print("ERROR: lammps.wasm was not generated!")
  sys.exit(1)

if not os.path.exists("lammps.mjs"):
  print("ERROR: lammps.mjs was not generated!")
  sys.exit(1)

print("Build complete!")
print("WASM files generated in cpp/ directory:")
print(f"  - lammps.wasm")
print(f"  - lammps.mjs")
