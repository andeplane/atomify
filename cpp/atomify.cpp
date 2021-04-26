#include <lammps.h>
#include <library.h>
#include <modify.h>
#include "fix_atomify.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
using namespace emscripten;
#endif

class Atomify
{
public:
  Atomify();
  LAMMPS_NS::LAMMPS *lmp;
  long getPositionsPointer();
  long getIdPointer();
  long getTypePointer();
  void loadLJ();
  void step();
  double getX(int n);
  double getY(int n);
  double getZ(int n);
  void runCommand(std::string command);
  int numAtoms();
};

Atomify::Atomify()
{
  lmp = (LAMMPS_NS::LAMMPS *)lammps_open_no_mpi(0, 0, nullptr);
  // lammps_command(lmp, "fix atomify all atomify");
  // int ifix = lmp->modify->find_fix("atomify");
  // LAMMPS_NS::FixAtomify *fix = static_cast<LAMMPS_NS::FixAtomify *>(lmp->modify->fix[ifix]);
  // fix->set_callback(callback, nullptr);
}

long Atomify::getPositionsPointer()
{
  double **ptr = reinterpret_cast<double **>(lammps_extract_atom((void *)lmp, "x"));

  return reinterpret_cast<long>(ptr[0]);
}

double Atomify::getX(int n)
{
  double **ptr = reinterpret_cast<double **>(lammps_extract_atom((void *)lmp, "x"));
  return ptr[n][0];
}

double Atomify::getY(int n)
{
  double **ptr = reinterpret_cast<double **>(lammps_extract_atom((void *)lmp, "x"));
  return ptr[n][1];
}

double Atomify::getZ(int n)
{
  double **ptr = reinterpret_cast<double **>(lammps_extract_atom((void *)lmp, "x"));
  return ptr[n][2];
}

long Atomify::getIdPointer()
{
  auto ptr = lammps_extract_atom((void *)lmp, "id");

  return reinterpret_cast<long>(ptr);
}

long Atomify::getTypePointer()
{
  auto ptr = lammps_extract_atom((void *)lmp, "type");

  return reinterpret_cast<long>(ptr);
}

void Atomify::loadLJ()
{
  const char *script =
      "# 3d Lennard-Jones melt\n"
      "variable    x index 1\n"
      "variable    y index 1\n"
      "variable    z index 1\n"
      "variable    xx equal 10*$x\n"
      "variable    yy equal 10*$y\n"
      "variable    zz equal 10*$z\n"
      "units       lj\n"
      "atom_style  atomic\n"
      "lattice     fcc 0.8442\n"
      "region      box block 0 ${xx} 0 ${yy} 0 ${zz}\n"
      "create_box  1 box\n"
      "create_atoms    1 box\n"
      "mass        1 1.0\n"
      "velocity    all create 1.44 87287 loop geom\n"
      "pair_style  lj/cut 2.5\n"
      "pair_coeff  1 1 1.0 1.0 2.5\n"
      "neighbor    0.3 bin\n"
      "neigh_modify    delay 0 every 20 check no\n"
      "fix     1 all nve\n";
  lammps_commands_string((void *)lmp, script);
}

void Atomify::step()
{
  const char *script = "run 1 pre no post no\n";
  lammps_commands_string((void *)lmp, script);
}

void Atomify::runCommand(std::string command)
{
  lammps_commands_string((void *)lmp, command.c_str());
}

int Atomify::numAtoms()
{
  return lammps_get_natoms((void *)lmp);
}

// Binding code
EMSCRIPTEN_BINDINGS(Atomify)
{
  class_<Atomify>("Atomify")
      .constructor<>()
      .function("getPositionsPointer", &Atomify::getPositionsPointer)
      .function("runCommand", &Atomify::runCommand)
      .function("getIdPointer", &Atomify::getIdPointer)
      .function("getTypePointer", &Atomify::getTypePointer)
      .function("loadLJ", &Atomify::loadLJ)
      .function("step", &Atomify::step)
      .function("getX", &Atomify::getX)
      .function("getY", &Atomify::getY)
      .function("getZ", &Atomify::getZ)
      .function("numAtoms", &Atomify::numAtoms);
}