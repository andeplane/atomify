import os
import subprocess
import shutil

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
  shutil.copyfile("fix_atomify.cpp", "lammps/src/fix_atomify.cpp")
  shutil.copyfile("fix_atomify.h", "lammps/src/fix_atomify.h")

def copy_atomify_files():
  shutil.copyfile("lammpsweb/lammpsweb.cpp", "lammps/src/lammpsweb.cpp")
  shutil.copyfile("lammpsweb/lammpsweb.h", "lammps/src/lammpsweb.h")
  shutil.copyfile("fix_atomify.cpp", "lammps/src/fix_atomify.cpp")
  shutil.copyfile("fix_atomify.h", "lammps/src/fix_atomify.h")

def copy_voronoi_files():
  for file in os.listdir('voro++-0.4.6/src'):
    if file.endswith('.hh') or file.endswith('.cc'):
      shutil.copyfile(f"voro++-0.4.6/src/{file}", f"lammps/src/{file}")
  shutil.move('lammps/src/voro++.cc', 'lammps/src/voro++.cpp')

if True or not os.path.exists('lammps'):
  # First clone lammps
  print("Could not find local clone of LAMMPS, cloning ...")
  # subprocess.call("git clone --depth 1 --branch stable_23Jun2022_update1  https://github.com/lammps/lammps.git", shell=True)
  print("Copying modified files ...")
  copy_mpi_files_and_patch() # First compile, it is not with emscripten, so we should not include lammpsweb
  copy_moltemplate_files()
  copy_voronoi_files()

  cwd = os.getcwd()
  print("Changing directory ...")
  os.chdir('lammps/src')
  print("Applying patch ...")
  subprocess.call("git apply lammps.patch", shell=True)
  print("Installing LAMMPS packages ...")
  subprocess.call("make yes-rigid yes-class2 yes-manybody yes-mc yes-molecule yes-granular yes-kspace yes-shock yes-misc yes-qeq yes-reaxff yes-extra-molecule yes-voronoi", shell=True)

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
  