import os
import subprocess
import shutil
import hashlib

def copy_moltemplate_files():
  shutil.copyfile("moltemplate_additional_lammps_code/pair_lj_charmm_coul_charmm_inter.cpp", "lammps/src/pair_lj_charmm_coul_charmm_inter.cpp")
  shutil.copyfile("moltemplate_additional_lammps_code/pair_lj_charmm_coul_charmm_inter.h", "lammps/src/pair_lj_charmm_coul_charmm_inter.h")
  shutil.copyfile("moltemplate_additional_lammps_code/pair_lj_remix.cpp", "lammps/src/pair_lj_remix.cpp")
  shutil.copyfile("moltemplate_additional_lammps_code/pair_lj_remix.h", "lammps/src/pair_lj_remix.h")
  shutil.copyfile("moltemplate_additional_lammps_code/pair_lj_softcore2.cpp", "lammps/src/pair_lj_softcore2.cpp")
  shutil.copyfile("moltemplate_additional_lammps_code/pair_lj_softcore2.h", "lammps/src/pair_lj_softcore2.h")

def copy_mpi_files_and_patch():
  shutil.copyfile("mpi.cpp", "lammps/src/mpi.cpp")
  shutil.copyfile("lammps/src/STUBS/mpi.h", "lammps/src/mpi.h")
  shutil.copyfile("lammps.patch", "lammps/src/lammps.patch")
  shutil.copyfile("lammpsweb/fix_atomify.cpp", "lammps/src/fix_atomify.cpp")
  shutil.copyfile("lammpsweb/fix_atomify.h", "lammps/src/fix_atomify.h")

def copy_colvars_files():
  colvars_lib_dir = 'lammps/lib/colvars'
  for file in os.listdir(colvars_lib_dir):
    if file.endswith('.h') or file.endswith('.cpp'):
      shutil.copyfile(f"{colvars_lib_dir}/{file}", f"lammps/src/{file}")
  
def file_content(path):
  if not os.path.exists(path):
    return ""
  return open(path, 'r').read()

def copy_atomify_files():
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

def copy_voronoi_files():
  for file in os.listdir('voro++-0.4.6/src'):
    if file.endswith('.hh') or file.endswith('.cc'):
      shutil.copyfile(f"voro++-0.4.6/src/{file}", f"lammps/src/{file}")
  shutil.move('lammps/src/voro++.cc', 'lammps/src/voro++.cpp')

if not os.path.exists('lammps'):
  # First clone lammps
  print("Could not find local clone of LAMMPS, cloning ...")
  subprocess.call("git clone --depth 1 --branch stable_23Jun2022_update1  https://github.com/lammps/lammps.git", shell=True)
  print("Copying modified files ...")
  copy_mpi_files_and_patch() # First compile, it is not with emscripten, so we should not include lammpsweb
  copy_moltemplate_files()
  copy_voronoi_files()
  copy_colvars_files()

  cwd = os.getcwd()
  print("Changing directory ...")
  os.chdir('lammps/src')
  print("Applying patch ...")
  subprocess.call("git apply lammps.patch", shell=True)
  print("Installing LAMMPS packages ...")
  subprocess.call("make yes-rigid yes-class2 yes-manybody yes-mc yes-molecule yes-granular yes-kspace yes-shock yes-misc yes-qeq yes-reaxff yes-extra-molecule yes-voronoi yes-colvars", shell=True)

  if os.path.isfile('fix_imd.cpp'):
    print("Deleting non-functioning files fix_imd ...")
    os.remove('fix_imd.cpp')
    os.remove('fix_imd.h')
  print("Compiling serial once to generate all files required for compilation ...")
  subprocess.call("make -j8 serial", shell=True)
  os.chdir(cwd)

print("Copying modified files ...")
copy_atomify_files()
subprocess.call("make -j8", shell=True)
print("Copying compiled files into src directory ...")
shutil.copyfile("lammps.wasm", "../public/lammps.wasm")
# shutil.copyfile("lammps.mjs", "../src/wasm/lammps.mjs")
with open('lammps.mjs') as f:
  content = f.read()
  with open("../src/wasm/lammps.mjs", "w") as g:
    g.write("/* eslint-disable */\n")
    g.write(content)
  