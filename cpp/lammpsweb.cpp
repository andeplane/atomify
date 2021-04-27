#include <lammps.h>
#include <library.h>
#include <modify.h>
#include "fix_atomify.h"

#ifdef __EMSCRIPTEN__
#include <emscripten/bind.h>
using namespace emscripten;
#endif

class LAMMPSWeb
{
public:
  LAMMPSWeb();
  ~LAMMPSWeb();
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

LAMMPSWeb::LAMMPSWeb()
{
  lmp = (LAMMPS_NS::LAMMPS *)lammps_open_no_mpi(0, 0, nullptr);
}

LAMMPSWeb::~LAMMPSWeb()
{
  lammps_close(lmp);
  lmp = nullptr;
}

long LAMMPSWeb::getPositionsPointer()
{
  double **ptr = reinterpret_cast<double **>(lammps_extract_atom((void *)lmp, "x"));

  return reinterpret_cast<long>(ptr[0]);
}

long LAMMPSWeb::getIdPointer()
{
  auto ptr = lammps_extract_atom((void *)lmp, "id");

  return reinterpret_cast<long>(ptr);
}

long LAMMPSWeb::getTypePointer()
{
  auto ptr = lammps_extract_atom((void *)lmp, "type");

  return reinterpret_cast<long>(ptr);
}

void LAMMPSWeb::loadLJ()
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

void LAMMPSWeb::step()
{
  const char *script = "run 1 pre no post no\n";
  lammps_commands_string((void *)lmp, script);
}

void LAMMPSWeb::runCommand(std::string command)
{
  lammps_commands_string((void *)lmp, command.c_str());
}

int LAMMPSWeb::numAtoms()
{
  return lammps_get_natoms((void *)lmp);
}

// Binding code
EMSCRIPTEN_BINDINGS(LAMMPSWeb)
{
  class_<LAMMPSWeb>("LAMMPSWeb")
      .constructor<>()
      .function("runCommand", &LAMMPSWeb::runCommand)
      .function("getPositionsPointer", &LAMMPSWeb::getPositionsPointer)
      .function("getIdPointer", &LAMMPSWeb::getIdPointer)
      .function("getTypePointer", &LAMMPSWeb::getTypePointer)
      .function("loadLJ", &LAMMPSWeb::loadLJ)
      .function("step", &LAMMPSWeb::step)
      .function("numAtoms", &LAMMPSWeb::numAtoms);
}