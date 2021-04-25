#include <lammps.h>
#include <library.h>

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
  void loadLJ();
  void step();
};

Atomify::Atomify()
{
  lmp = (LAMMPS_NS::LAMMPS *)lammps_open_no_mpi(0, 0, nullptr);
}

long Atomify::getPositionsPointer()
{
  auto ptr = lammps_extract_atom((void *)lmp, "x");

  return reinterpret_cast<long>(ptr);
}

void Atomify::loadLJ()
{
  const char *script =
      "# 3d Lennard-Jones melt\n"
      "variable    x index 1\n"
      "variable    y index 1\n"
      "variable    z index 1\n"
      "variable    xx equal 20*$x\n"
      "variable    yy equal 20*$y\n"
      "variable    zz equal 20*$z\n"
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
  const char *script = "run 1\n";
  lammps_commands_string((void *)lmp, script);
}

#ifdef __EMSCRIPTEN__
// Binding code
EMSCRIPTEN_BINDINGS(Atomify)
{
  class_<Atomify>("Atomify")
      .constructor<>()
      .function("getPositionsPointer", &Atomify::getPositionsPointer)
      .function("loadLJ", &Atomify::loadLJ)
      .function("step", &Atomify::step);
}
#endif