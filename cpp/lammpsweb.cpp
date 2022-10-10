#include "lammps.h"
#include <iostream>
#include "library.h"
#include "domain.h"
#include "atom.h"
#include "force.h"
#include "modify.h"
#include "neigh_list.h"
#include "fix_atomify.h"
#define __EMSCRIPTEN__

using namespace std;

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
using namespace emscripten;

class LAMMPSWeb
{
public:
  LAMMPSWeb();
  ~LAMMPSWeb();
  LAMMPS_NS::LAMMPS *lmp;
  bool m_isRunning;
  double *m_cellMatrix;
  double *m_origo;
  float *m_bondsDataPosition1;
  float *m_bondsDataPosition2;
  float *m_bondsDistanceMap;
  int m_bondDataCapacity;
  int m_numBonds;
  bool m_buildNeighborlist;
  long getBondsDistanceMapPointer();
  long getPositionsPointer();
  long getIdPointer();
  long getTypePointer();
  void reallocateBondsData(int newCapacity);
  long getBondsPosition1();
  long getBondsPosition2();
  int computeBonds();
  void computeBondsFromBondList();
  void computeBondsFromNeighborlist();
  int numAtoms();
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
  void setBuildNeighborlist(bool buildNeighborlist);
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
  m_bondsDataPosition1(nullptr),
  m_bondsDataPosition2(nullptr),
  m_bondsDistanceMap(new float[100 * 100])
{
  for (int i = 0; i < 100000; i++) {
    m_bondsDistanceMap[i] = 0;
  }
}

LAMMPSWeb::~LAMMPSWeb()
{
  stop();
}

void LAMMPSWeb::reallocateBondsData(int newCapacity) {
  bool copyData = m_bondDataCapacity > 0;
  int oldCapacity = m_bondDataCapacity;
  m_bondDataCapacity = newCapacity;
  
  float *newBondsDataPosition1 = new float[3 * m_bondDataCapacity];
  float *newBondsDataPosition2 = new float[3 * m_bondDataCapacity];
  if (copyData) {
    std::memcpy(m_bondsDataPosition1, newBondsDataPosition1, oldCapacity*3 * sizeof(float));
    std::memcpy(m_bondsDataPosition2, newBondsDataPosition2, oldCapacity*3 * sizeof(float));
    delete m_bondsDataPosition1;
    delete m_bondsDataPosition2;
  }
  m_bondsDataPosition1 = newBondsDataPosition1;
  m_bondsDataPosition2 = newBondsDataPosition2;
}

int LAMMPSWeb::computeBonds() {
  m_numBonds = 0;
  computeBondsFromBondList();
  computeBondsFromNeighborlist();
  return m_numBonds;
}

void LAMMPSWeb::computeBondsFromBondList() {
  LAMMPS_NS::Atom *atom = lmp->atom;
  LAMMPS_NS::Domain *domain = lmp->domain;
  if(atom->nbonds==0) return;
  
  double xSize = lmp->domain->prd[0];
  double ySize = lmp->domain->prd[1];
  double zSize = lmp->domain->prd[2];  
  
  for (int i = 0; i < atom->natoms; i++) {
    double x = atom->x[i][0];
    double y = atom->x[i][1];
    double z = atom->x[i][2];
    
    for(int jj=0; jj<atom->num_bond[i]; jj++) {
      int j = atom->map(atom->bond_atom[i][jj]);
      if(j < 0 || j>=atom->natoms) {
        continue;
      }
      if (!lmp->force->newton_bond && i<j) {
        continue;
      }
    
      double xx = atom->x[j][0];
      double yy = atom->x[j][1];
      double zz = atom->x[j][2];

      float dx = x-xx;
      float dy = y-yy;
      float dz = z-zz;
      double dr2 = dx*dx + dy*dy + dz*dz;
      double dr2max = 40; // arbitrary units. TODO!

      if(dr2 > dr2max || dx > 0.5*xSize || dy > 0.5*ySize || dz > 0.5*zSize ) {
          // Periodic image
          continue;
      }
      
      if (m_numBonds+1 > m_bondDataCapacity ) {
        int newCapacity = 2 * m_bondDataCapacity;
        if (newCapacity == 0) {
          newCapacity = 1000;
        }
        reallocateBondsData(newCapacity);
      }

      m_bondsDataPosition1[m_numBonds * 3 + 0] = x;
      m_bondsDataPosition1[m_numBonds * 3 + 1] = y;
      m_bondsDataPosition1[m_numBonds * 3 + 2] = z;
      m_bondsDataPosition2[m_numBonds * 3 + 0] = xx;
      m_bondsDataPosition2[m_numBonds * 3 + 1] = yy;
      m_bondsDataPosition2[m_numBonds * 3 + 2] = zz;
      m_numBonds++;
    }
  }
}

void LAMMPSWeb::computeBondsFromNeighborlist() {
  LAMMPS_NS::FixAtomify *fixAtomify = dynamic_cast<LAMMPS_NS::FixAtomify*>(findFixByIdentifier("atomify"));
  if(!fixAtomify) {
      return;
  }
  fixAtomify->build_neighborlist = m_buildNeighborlist;
  if(!m_buildNeighborlist) {
      return;
  }

  LAMMPS_NS::Atom *atom = lmp->atom;
  LAMMPS_NS::NeighList *list = fixAtomify->list;
  const int inum = list->inum;
  int *numneigh = list->numneigh;
  int **firstneigh = list->firstneigh;
  
  for(int i=0; i<atom->natoms; i++) {
    float x = atom->x[i][0];
    float y = atom->x[i][1];
    float z = atom->x[i][2];
    int type_i = atom->type[i];
    
    int *jlist = firstneigh[i];
    int jnum = numneigh[i];
    for (int jj = 0; jj < jnum; jj++) {
      int j = jlist[jj];
      j &= NEIGHMASK;
      if(j >= atom->natoms) continue; // Probably a ghost atom from LAMMPS
      
      int type_j = atom->type[j];
      float xx = atom->x[j][0];
      float yy = atom->x[j][1];
      float zz = atom->x[j][2];
      float dx = xx-x;
      float dy = yy-y;
      float dz = zz-z;
      
      float rsq = dx*dx + dy*dy + dz*dz;
      float bondLength = m_bondsDistanceMap[100 * type_i + type_j];

      if(rsq < bondLength*bondLength) {
        if (m_numBonds+1 > m_bondDataCapacity ) {
          int newCapacity = 2 * m_bondDataCapacity;
          if (newCapacity == 0) {
            newCapacity = 1000;
          }
          reallocateBondsData(newCapacity);
        }

        m_bondsDataPosition1[m_numBonds * 3 + 0] = x;
        m_bondsDataPosition1[m_numBonds * 3 + 1] = y;
        m_bondsDataPosition1[m_numBonds * 3 + 2] = z;
        m_bondsDataPosition2[m_numBonds * 3 + 0] = xx;
        m_bondsDataPosition2[m_numBonds * 3 + 1] = yy;
        m_bondsDataPosition2[m_numBonds * 3 + 2] = zz;
        m_numBonds++;
      }
    }
  }
}

long LAMMPSWeb::getBondsPosition1() {
  return reinterpret_cast<long>(m_bondsDataPosition1);
}

long LAMMPSWeb::getBondsPosition2() {
  return reinterpret_cast<long>(m_bondsDataPosition2);
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

void LAMMPSWeb::setBuildNeighborlist(bool buildNeighborlist) {
  m_buildNeighborlist = buildNeighborlist;
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

long LAMMPSWeb::getBondsDistanceMapPointer()
{
  return reinterpret_cast<long>(m_bondsDistanceMap);
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

// Binding code
EMSCRIPTEN_BINDINGS(LAMMPSWeb)
{
  class_<LAMMPSWeb>("LAMMPSWeb")
      .constructor<>()
      .function("runCommand", &LAMMPSWeb::runCommand)
      .function("getPositionsPointer", &LAMMPSWeb::getPositionsPointer)
      .function("getBondsDistanceMapPointer", &LAMMPSWeb::getBondsDistanceMapPointer)
      .function("getIdPointer", &LAMMPSWeb::getIdPointer)
      .function("getTypePointer", &LAMMPSWeb::getTypePointer)
      .function("loadLJ", &LAMMPSWeb::loadLJ)
      .function("step", &LAMMPSWeb::step)
      .function("isRunning", &LAMMPSWeb::isRunning)
      .function("start", &LAMMPSWeb::start)
      .function("stop", &LAMMPSWeb::stop)
      .function("numAtoms", &LAMMPSWeb::numAtoms)
      .function("runFile", &LAMMPSWeb::runFile)
      .function("getCellMatrixPointer", &LAMMPSWeb::getCellMatrixPointer)
      .function("getOrigoPointer", &LAMMPSWeb::getOrigoPointer)
      .function("computeBonds", &LAMMPSWeb::computeBonds)
      .function("setBuildNeighborlist", &LAMMPSWeb::setBuildNeighborlist)
      .function("getBondsPosition1", &LAMMPSWeb::getBondsPosition1)
      .function("getBondsPosition2", &LAMMPSWeb::getBondsPosition2)
      .function("setSyncFrequency", &LAMMPSWeb::setSyncFrequency);
}
#endif