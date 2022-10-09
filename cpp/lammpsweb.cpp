#include "lammps.h"
#include <iostream>
#include "library.h"
#include "domain.h"
#include "atom.h"
#include "force.h"
#include "modify.h"
#include "fix_atomify.h"

using namespace std;

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
using namespace emscripten;
#endif

class LAMMPSWeb
{
public:
  LAMMPSWeb();
  ~LAMMPSWeb();
  LAMMPS_NS::LAMMPS *lmp;
  bool m_isRunning;
  double *m_cellMatrix;
  double *m_origo;
  float *m_bondData;
  int m_bondDataCapacity;
  int m_numBonds;
  long getPositionsPointer();
  long getIdPointer();
  long getTypePointer();
  long getBondListData();
  int numAtoms();
  int numBonds();
  bool isRunning();
  void loadLJ();
  void step();
  void start();
  void stop();
  void runFile(std::string path);
  double getX(int n);
  double getY(int n);
  double getZ(int n);
  void synchronizeLAMMPS(int mode);
  void runCommand(std::string command);
  int findFixIndex(std::string identifier);
  bool fixExists(std::string identifier);
  void setSyncFrequency(int frequency);
  long getCellMatrixPointer();
  long getOrigoPointer();
  LAMMPS_NS::Fix* findFixByIdentifier(std::string identifier);
};

EM_JS(void, call_js_agrs, (), {
    postStepCallback();
});

bool postStepCallback()
{
    call_js_agrs();
    return true;
}

EMSCRIPTEN_BINDINGS(module)
{
    emscripten::function("postStepCallback", &postStepCallback);
}

void synchronizeLAMMPS_callback(void *caller, int mode)
{
    LAMMPSWeb *controller = static_cast<LAMMPSWeb*>(caller);
    controller->synchronizeLAMMPS(mode);
}

LAMMPSWeb::LAMMPSWeb() : 
  lmp(nullptr),
  m_isRunning(false),
  m_cellMatrix(new double[9]),
  m_origo(new double[3]),
  m_numBonds(0),
  m_bondDataCapacity(0),
  m_bondData(nullptr)
{
  
}

LAMMPSWeb::~LAMMPSWeb()
{
  stop();
}

long LAMMPSWeb::getBondListData() {
  LAMMPS_NS::Atom *atom = lmp->atom;
  LAMMPS_NS::Domain *domain = lmp->domain;
  m_numBonds = 0;
  if(atom->nbonds==0) return 0;
  
  double xSize = lmp->domain->prd[0];
  double ySize = lmp->domain->prd[1];
  double zSize = lmp->domain->prd[2];  
  int numAtoms = int(atom->natoms);
  std::cout << "I have num atoms " << atom->natoms << std::endl;
  std::cout << "Num atoms from this thing is " << numAtoms << std::endl;
  std::cout << "But local is " << atom->nlocal << std::endl;
  
  for(int idx=0; idx<numAtoms; idx++) {
    // std::cout << "This is atom " << i << " of " << numAtoms << " and condition " << (i<numAtoms) << std::endl;
    std::cout << "Condition " << idx << " < " << numAtoms << ": " << (idx<numAtoms) << std::endl;
    if (idx >= numAtoms) {
      std::cout << "WTF this is weird" << std::endl;
    }

    double x = atom->x[idx][0];
    double y = atom->x[idx][1];
    double z = atom->x[idx][2];
    
    for(int jj=0; jj<atom->num_bond[idx]; jj++) {
      std::cout << "  This is bond count " << jj << std::endl;
      int j = atom->map(atom->bond_atom[idx][jj]);
      std::cout << "  Found bond between " << idx << " and " << j << std::endl;
      if(j < 0 || j>=numAtoms) {
        continue;
      }
      if (!lmp->force->newton_bond && idx<j) {
        continue;
      }
    }

    //   double xx = atom->x[j][0];
    //   double yy = atom->x[j][1];
    //   double zz = atom->x[j][2];

    //   float dx = x-xx;
    //   float dy = y-yy;
    //   float dz = z-zz;
    //   double dr2 = dx*dx + dy*dy + dz*dz;
    //   double dr2max = 40; // arbitrary units. TODO!

    //   if(dr2 > dr2max || dx > 0.5*xSize || dy > 0.5*ySize || dz > 0.5*zSize ) {
    //       // Periodic image
    //       continue;
    //   }
    //   std::cout << "Found bond between " << i << j << std::endl;

    //   // BondVBOData bond;
    //   // bond.vertex1[0] = position_i[0];
    //   // bond.vertex1[1] = position_i[1];
    //   // bond.vertex1[2] = position_i[2];
    //   // bond.vertex2[0] = position_j[0];
    //   // bond.vertex2[1] = position_j[1];
    //   // bond.vertex2[2] = position_j[2];
    //   // float bondRadius = 0.1*m_bondScale;
    //   // bond.radius1 = bondRadius;
    //   // bond.radius2 = bondRadius;
    //   // bond.sphereRadius1 = atomData.radii[i]*m_sphereScale;
    //   // bond.sphereRadius2 = atomData.radii[j]*m_sphereScale;
    //   // bondsDataRaw.push_back(bond);
    // }
  }
}

long LAMMPSWeb::getCellMatrixPointer() {
  LAMMPS_NS::Domain *domain = lmp->domain;
  domain->box_corners();
  double a[] = {domain->corners[1][0], domain->corners[1][1], domain->corners[1][2]};
  double b[] = {domain->corners[2][0], domain->corners[2][1], domain->corners[2][2]};
  double c[] = {domain->corners[4][0], domain->corners[4][1], domain->corners[4][2]};
  double origo[] = {domain->corners[0][0], domain->corners[0][1], domain->corners[0][2]};

  for (int i = 0; i < 3; i++) {
    a[i] -= origo[i];
    b[i] -= origo[i];
    c[i] -= origo[i];
    m_cellMatrix[i] = a[i];
    m_cellMatrix[3+i] = b[i];
    m_cellMatrix[6+i] = c[i];
  }

  return reinterpret_cast<long>(m_cellMatrix);
}

long LAMMPSWeb::getOrigoPointer() {
  LAMMPS_NS::Domain *domain = lmp->domain;
  domain->box_corners();
  m_origo[0] = domain->corners[0][0];
  m_origo[1] = domain->corners[0][1];
  m_origo[2] = domain->corners[0][2];

  return reinterpret_cast<long>(m_origo);
}

bool LAMMPSWeb::isRunning() {
  return m_isRunning;
}

void LAMMPSWeb::setSyncFrequency(int every) {
  LAMMPS_NS::Fix *originalFix = findFixByIdentifier(std::string("atomify"));
  if (!originalFix) {
    return;
  }
  LAMMPS_NS::FixAtomify *fix = dynamic_cast<LAMMPS_NS::FixAtomify*>(originalFix);
  fix->sync_frequency = every;
}

void LAMMPSWeb::synchronizeLAMMPS(int mode)
{
    if(mode == 1000) {
      // Just a small sleep to not block UI
      emscripten_sleep(1);
      return;
    }

    if(mode != LAMMPS_NS::FixConst::END_OF_STEP && mode != LAMMPS_NS::FixConst::MIN_POST_FORCE) return;
    postStepCallback();
    emscripten_sleep(1);
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

int LAMMPSWeb::findFixIndex(std::string identifier) {
    if(!lmp) {
        return -1;
    }
    return lmp->modify->find_fix(identifier);
}

bool LAMMPSWeb::fixExists(std::string identifier) {
    return findFixIndex(identifier) >= 0;
}

LAMMPS_NS::Fix* LAMMPSWeb::findFixByIdentifier(std::string identifier) {
    int fixId = findFixIndex(identifier);
    if(fixId < 0) {
        return nullptr;
    } else {
        return lmp->modify->fix[fixId];
    }
}

long LAMMPSWeb::getTypePointer()
{
  auto ptr = lammps_extract_atom((void *)lmp, "type");

  return reinterpret_cast<long>(ptr);
}

void LAMMPSWeb::start()
{
  std::cout << "Will start LAMMPS session" << std::endl;
  if(lmp) {
      stop();
  }

  int nargs = 1;
  char **argv = new char*[nargs];
  for(int i=0; i<nargs; i++) {
      argv[i] = new char[100];
  }

  lmp = (LAMMPS_NS::LAMMPS *)lammps_open_no_mpi(0, 0, nullptr);
  lammps_command(lmp, "fix atomify all atomify");
  if(!fixExists("atomify")) {
      std::cerr << "Damn, could not create the fix... :/" << std::endl;
  }
  
  LAMMPS_NS::Fix *originalFix = findFixByIdentifier(std::string("atomify"));
  if(!originalFix) {
      throw std::runtime_error("Could not find fix with name atomify.");
  }
  LAMMPS_NS::FixAtomify *fix = dynamic_cast<LAMMPS_NS::FixAtomify*>(originalFix);
  fix->set_callback(&synchronizeLAMMPS_callback, this);
}

void LAMMPSWeb::stop()
{
  if(lmp) {
    lammps_close((void*)lmp);
    lmp = nullptr;
  }
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
  start();
  lammps_commands_string((void *)lmp, script);
}

void LAMMPSWeb::runFile(std::string path)
{
  m_isRunning = true;
  lammps_file((void*)lmp, path.c_str());
  m_isRunning = false;
}

void LAMMPSWeb::step()
{
  m_isRunning = true;
  const char *script = "run 1 pre no post no\n";
  lammps_commands_string((void *)lmp, script);
  m_isRunning = false;
}

void LAMMPSWeb::runCommand(std::string command)
{
  m_isRunning = true;
  lammps_commands_string((void *)lmp, command.c_str());
  m_isRunning = false;
}

int LAMMPSWeb::numAtoms()
{
  return lammps_get_natoms((void *)lmp);
}

int LAMMPSWeb::numBonds()
{
  return m_numBonds;
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
      .function("isRunning", &LAMMPSWeb::isRunning)
      .function("start", &LAMMPSWeb::start)
      .function("stop", &LAMMPSWeb::stop)
      .function("numAtoms", &LAMMPSWeb::numAtoms)
      .function("numBonds", &LAMMPSWeb::numBonds)
      .function("runFile", &LAMMPSWeb::runFile)
      .function("getCellMatrixPointer", &LAMMPSWeb::getCellMatrixPointer)
      .function("getOrigoPointer", &LAMMPSWeb::getOrigoPointer)
      .function("getBondListData", &LAMMPSWeb::getBondListData)
      .function("setSyncFrequency", &LAMMPSWeb::setSyncFrequency);
}