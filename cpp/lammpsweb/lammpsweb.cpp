#include "lammpsweb.h"
#include "library.h"
#include "domain.h"
#include "atom.h"
#include "input.h"
#include "force.h"
#include "update.h"
#include "modify.h"
#include "info.h"
#include "fix_ave_chunk.h"
#include "fix_ave_histo.h"
#include "fix_ave_time.h"
#include "compute_pe.h"
#include "compute_temp.h"
#include "compute_ke.h"
#include "compute_pressure.h"
#include "compute_rdf.h"
#include "compute_msd.h"
#include "compute_vacf.h"
#include "compute_com.h"
#include "compute_gyration.h"
#include "compute.h"
#include "variable.h"
#include "error.h"
#include "neigh_list.h"
#include "fix_atomify.h"

using namespace std;

#ifdef __EMSCRIPTEN__
EM_JS(bool, call_js_agrs, (), {
    return postStepCallback();
});

bool postStepCallback() {
    return call_js_agrs();
}

EMSCRIPTEN_BINDINGS(module) {
    emscripten::function("postStepCallback", &postStepCallback);
}
#endif

void synchronizeLAMMPS_callback(void *caller, int mode) {
    LAMMPSWeb *controller = static_cast<LAMMPSWeb*>(caller);
    controller->synchronizeLAMMPS(mode);
}

LAMMPSWeb::LAMMPSWeb() : 
  m_lmp(nullptr),
  m_cellMatrix(new double[9]),
  m_origo(new double[3]),
  m_numBonds(0),
  m_bondsCapacity(0),
  m_particlesCapacity(0),
  m_bondsPosition1(nullptr),
  m_bondsPosition2(nullptr),
  m_particlesPosition(nullptr),
  m_bondsDistanceMap(new float[100 * 100]) {

}

LAMMPSWeb::~LAMMPSWeb() {
  delete[] m_cellMatrix;
  delete[] m_origo;
  delete[] m_bondsPosition1;
  delete[] m_bondsPosition2;
  delete[] m_particlesPosition;
  delete[] m_bondsDistanceMap;
  stop();
}

void LAMMPSWeb::cancel() {
  LAMMPS_NS::FixAtomify *fixAtomify = dynamic_cast<LAMMPS_NS::FixAtomify*>(findFixByIdentifier("atomify"));
  if(!fixAtomify) {
      return;
  }
  fixAtomify->cancel();
}

long LAMMPSWeb::getMemoryUsage() {
  long memoryUsage = 0;
  if (m_lmp) {
    double meminfo[3];
    LAMMPS_NS::Info info(m_lmp);
    info.get_memory_info(meminfo);
    double mbytes = meminfo[0];
    memoryUsage += mbytes * 1024 * 1024;
  }
  
  // Computes
  for (const auto& [key, value] : m_computes) {
    memoryUsage += value.m_perAtomData.size() * sizeof(double);
    for (int i = 0; i < value.m_data1D.size(); i++) {
      const Data1D &data1D = value.m_data1D[i];
      memoryUsage += data1D.xValues.size() * sizeof(float);
      memoryUsage += data1D.yValues.size() * sizeof(float);
    }
  }

  // Variables
  for (const auto& [key, value] : m_variables) {
    memoryUsage += value.m_perAtomData.size() * sizeof(double);
    for (int i = 0; i < value.m_data1D.size(); i++) {
      const Data1D &data1D = value.m_data1D[i];
      memoryUsage += data1D.xValues.size() * sizeof(float);
      memoryUsage += data1D.yValues.size() * sizeof(float);
    }
  }

  // Fixes
  for (const auto& [key, value] : m_fixes) {
    memoryUsage += value.m_perAtomData.size() * sizeof(double);
    for (int i = 0; i < value.m_data1D.size(); i++) {
      const Data1D &data1D = value.m_data1D[i];
      memoryUsage += data1D.xValues.size() * sizeof(float);
      memoryUsage += data1D.yValues.size() * sizeof(float);
    }
  }

  memoryUsage += 3 * m_particlesCapacity * sizeof(float); // 3 positions per particle
  memoryUsage += 2 * 3 * m_bondsCapacity * sizeof(float); // 2 x 3 positions per bond
  return memoryUsage;
}

void LAMMPSWeb::reallocateBondsData(int newCapacity) {
  bool copyData = m_bondsCapacity > 0;
  int oldCapacity = m_bondsCapacity;
  m_bondsCapacity = newCapacity;
  
  float *newBondsDataPosition1 = new float[3 * m_bondsCapacity];
  float *newBondsDataPosition2 = new float[3 * m_bondsCapacity];
  if (copyData) {
    std::memcpy(m_bondsPosition1, newBondsDataPosition1, oldCapacity*3 * sizeof(float));
    std::memcpy(m_bondsPosition2, newBondsDataPosition2, oldCapacity*3 * sizeof(float));
    delete m_bondsPosition1;
    delete m_bondsPosition2;
  }
  m_bondsPosition1 = newBondsDataPosition1;
  m_bondsPosition2 = newBondsDataPosition2;
}

int LAMMPSWeb::computeParticles() {
  LAMMPS_NS::Atom *atom = m_lmp->atom;
  LAMMPS_NS::Domain *domain = m_lmp->domain;

  int m_numParticles = atom->natoms;
  
  if (m_numParticles > m_particlesCapacity) {
    m_particlesCapacity = 2 * m_numParticles;
    if (m_particlesCapacity == 0) {
      m_particlesCapacity = m_numParticles;
    }
    
    delete m_particlesPosition;
    m_particlesPosition = new float[3 * m_particlesCapacity];
  }
  
  for(int i=0; i<m_numParticles; i++) {
    double position[3];
    position[0] = atom->x[i][0];
    position[1] = atom->x[i][1];
    position[2] = atom->x[i][2];
    
    domain->remap(position); // remap into system boundaries with PBC
    m_particlesPosition[3 * i + 0] = position[0];
    m_particlesPosition[3 * i + 1] = position[1];
    m_particlesPosition[3 * i + 2] = position[2];
  }
  
  return m_numParticles;
}

int LAMMPSWeb::computeBonds() {
  m_numBonds = 0;
  computeBondsFromBondList();
  computeBondsFromNeighborlist();
  return m_numBonds;
}

void LAMMPSWeb::computeBondsFromBondList() {
  LAMMPS_NS::Atom *atom = m_lmp->atom;
  LAMMPS_NS::Domain *domain = m_lmp->domain;
  if(atom->nbonds==0) return;
  
  double xSize = m_lmp->domain->prd[0];
  double ySize = m_lmp->domain->prd[1];
  double zSize = m_lmp->domain->prd[2];  
  
  for (int i = 0; i < atom->natoms; i++) {
    double x = atom->x[i][0];
    double y = atom->x[i][1];
    double z = atom->x[i][2];
    
    for(int jj=0; jj<atom->num_bond[i]; jj++) {
      int j = atom->map(atom->bond_atom[i][jj]);
      if(j < 0 || j>=atom->natoms) {
        continue;
      }
      if (!m_lmp->force->newton_bond && i<j) {
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
      
      if (m_numBonds+1 > m_bondsCapacity ) {
        int newCapacity = 2 * m_bondsCapacity;
        if (newCapacity == 0) {
          newCapacity = 1000;
        }
        reallocateBondsData(newCapacity);
      }

      m_bondsPosition1[m_numBonds * 3 + 0] = x;
      m_bondsPosition1[m_numBonds * 3 + 1] = y;
      m_bondsPosition1[m_numBonds * 3 + 2] = z;
      m_bondsPosition2[m_numBonds * 3 + 0] = xx;
      m_bondsPosition2[m_numBonds * 3 + 1] = yy;
      m_bondsPosition2[m_numBonds * 3 + 2] = zz;
      m_numBonds++;
    }
  }
}

void LAMMPSWeb::computeBondsFromNeighborlist() {
  LAMMPS_NS::FixAtomify *fixAtomify = dynamic_cast<LAMMPS_NS::FixAtomify*>(findFixByIdentifier("atomify"));
  if(!fixAtomify) {
      return;
  }
  bool fixWillBuildNeighborlist = fixAtomify->build_neighborlist;
  fixAtomify->build_neighborlist = m_buildNeighborlist;
  if(!m_buildNeighborlist || !fixWillBuildNeighborlist || fixAtomify->neighborlist_built_at_timestep != m_lmp->update->ntimestep) {
      return;
  }


  LAMMPS_NS::Domain *domain = m_lmp->domain;
  domain->box_corners();
  LAMMPS_NS::Atom *atom = m_lmp->atom;
  LAMMPS_NS::NeighList *list = fixAtomify->list;
  const int inum = list->inum;
  int *numneigh = list->numneigh;
  int **firstneigh = list->firstneigh;
  for(int i=0; i<atom->natoms; i++) {
    double position1[3];
    position1[0] = atom->x[i][0];
    position1[1] = atom->x[i][1];
    position1[2] = atom->x[i][2];
    domain->remap(position1); // remap into system boundaries with PBC

    int type_i = atom->type[i];
    
    int *jlist = firstneigh[i];
    int jnum = numneigh[i];
    for (int jj = 0; jj < jnum; jj++) {
      int j = jlist[jj];
      j &= NEIGHMASK;
      if(j >= atom->natoms) continue; // Probably a ghost atom from LAMMPS
      
      int type_j = atom->type[j];
      double position2[3];
      position2[0] = atom->x[j][0];
      position2[1] = atom->x[j][1];
      position2[2] = atom->x[j][2];
      domain->remap(position2); // remap into system boundaries with PBC
      float dx = position2[0]-position1[0];
      float dy = position2[1]-position1[1];
      float dz = position2[2]-position1[2];
      
      float rsq = dx*dx + dy*dy + dz*dz;
      float bondLength = m_bondsDistanceMap[100 * type_i + type_j];

      if(rsq < bondLength*bondLength) {
        if (m_numBonds+1 > m_bondsCapacity ) {
          int newCapacity = 2 * m_bondsCapacity;
          if (newCapacity == 0) {
            newCapacity = 1000;
          }
          reallocateBondsData(newCapacity);
        }

        m_bondsPosition1[m_numBonds * 3 + 0] = position1[0];
        m_bondsPosition1[m_numBonds * 3 + 1] = position1[1];
        m_bondsPosition1[m_numBonds * 3 + 2] = position1[2];
        m_bondsPosition2[m_numBonds * 3 + 0] = position2[0];
        m_bondsPosition2[m_numBonds * 3 + 1] = position2[1];
        m_bondsPosition2[m_numBonds * 3 + 2] = position2[2];
        m_numBonds++;
      }
    }
  }
}

long LAMMPSWeb::getBondsPosition1Pointer() {
  return reinterpret_cast<long>(m_bondsPosition1);
}

long LAMMPSWeb::getBondsPosition2Pointer() {
  return reinterpret_cast<long>(m_bondsPosition2);
}

long LAMMPSWeb::getCellMatrixPointer() {
  LAMMPS_NS::Domain *domain = m_lmp->domain;
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
  LAMMPS_NS::Domain *domain = m_lmp->domain;
  domain->box_corners();
  m_origo[0] = domain->corners[0][0];
  m_origo[1] = domain->corners[0][1];
  m_origo[2] = domain->corners[0][2];

  return reinterpret_cast<long>(m_origo);
}

bool LAMMPSWeb::getIsRunning() {
  return m_lmp->update->whichflag!=0;
}

int LAMMPSWeb::getNumAtoms() {
  return lammps_get_natoms((void *)m_lmp);
}

std::string LAMMPSWeb::getErrorMessage() {
  if (!m_lmp) {
    return "";
  }
  return m_lmp->error->get_last_error();
}

std::string LAMMPSWeb::getLastCommand() {
  if (!m_lmp) {
    return "";
  }
  std::string lastCommand = "(unknown)";
  if (m_lmp->input && m_lmp->input->line) lastCommand = m_lmp->input->line;
  return lastCommand;
}


int LAMMPSWeb::getTimesteps() {
  if (!m_lmp) {
    return 0;
  }
  return m_lmp->update->ntimestep;
}

double LAMMPSWeb::getTimestepsPerSecond() {
  if (!m_lmp) {
    return 0;
  }
  return lammps_get_thermo(m_lmp, "spcpu");
}

int LAMMPSWeb::getWhichFlag() {
  if (!m_lmp) {
    return 0;
  }
  return m_lmp->update->whichflag;
}

double LAMMPSWeb::getCPURemain() {
  if (!m_lmp) {
    return 0;
  }
  return lammps_get_thermo(m_lmp, "cpuremain");
}

int LAMMPSWeb::getRunTotalTimesteps() {
  if (!m_lmp) {
    return 0;
  }
  return m_lmp->update->laststep - m_lmp->update->firststep;
}

int LAMMPSWeb::getRunTimesteps() {
  if (!m_lmp) {
    return 0;
  }
  return m_lmp->update->ntimestep - m_lmp->update->firststep;
}

void LAMMPSWeb::syncComputes() {
  // First add all existing computes
  for(int i=0; i < m_lmp->modify->ncompute; i++) {
    LAMMPS_NS::Compute *lmpCompute = m_lmp->modify->compute[i];
    auto computeId = std::string(lmpCompute->id);
    if (m_computes.find(computeId) == m_computes.end()) {
      // Create new compute
      Compute *compute = nullptr;
      if (dynamic_cast<LAMMPS_NS::ComputePE*>(lmpCompute) != nullptr) compute = new Compute(m_lmp, lmpCompute, computeId, ComputePE, "Time", "Potential energy");
      else if (dynamic_cast<LAMMPS_NS::ComputeTemp*>(lmpCompute) != nullptr) compute = new Compute(m_lmp, lmpCompute, computeId, ComputeTemp, std::string("Time"), std::string("Temperature"));
      else if (dynamic_cast<LAMMPS_NS::ComputeKE*>(lmpCompute) != nullptr) compute = new Compute(m_lmp, lmpCompute, computeId, ComputeKE, std::string("Time"), std::string("Kinetic energy"));
      else if (dynamic_cast<LAMMPS_NS::ComputePressure*>(lmpCompute) != nullptr) compute = new Compute(m_lmp, lmpCompute, computeId, ComputePressure, std::string("Time"), std::string("Pressure"));
      else if (dynamic_cast<LAMMPS_NS::ComputeRDF*>(lmpCompute) != nullptr) compute = new Compute(m_lmp, lmpCompute, computeId, ComputeRDF, std::string("Distance"), std::string("g(r)"));
      else if (dynamic_cast<LAMMPS_NS::ComputeMSD*>(lmpCompute) != nullptr) compute = new Compute(m_lmp, lmpCompute, computeId, ComputeMSD, std::string("Time"), std::string("Mean square displacement"));
      else if (dynamic_cast<LAMMPS_NS::ComputeVACF*>(lmpCompute) != nullptr) compute = new Compute(m_lmp, lmpCompute, computeId, ComputeVACF, std::string("Time"), std::string("<v(t)*v(0)>"));
      else compute = new Compute(m_lmp, lmpCompute, computeId, ComputeOther, std::string("Time"), std::string("Value"));
      m_computes[computeId] = *compute;
    }
  }

  // See if we have any compute that no longer is in LAMMPS
  for (auto it = m_computes.cbegin(); it != m_computes.cend();) {
    if (!findComputeByIdentifier(it->first)) {
      m_computes.erase(it++);
    } else {
      ++it;
    }
  }
}

void LAMMPSWeb::syncFixes() {
  // First add all existing fixes
  for(int i=0; i < m_lmp->modify->nfix; i++) {
    LAMMPS_NS::Fix *lmpFix = m_lmp->modify->fix[i];
    auto fixId = std::string(lmpFix->id);
    if (m_fixes.find(fixId) == m_fixes.end()) {
      // Create new fix
      Fix *fix = nullptr;
      if (dynamic_cast<LAMMPS_NS::FixAveChunk*>(lmpFix) != nullptr) fix = new Fix(m_lmp, lmpFix, fixId,FixAveChunk, "", "");
      else if (dynamic_cast<LAMMPS_NS::FixAveHisto*>(lmpFix) != nullptr) fix = new Fix(m_lmp, lmpFix, fixId, FixAveHisto, "", "");
      else if (dynamic_cast<LAMMPS_NS::FixAveTime*>(lmpFix) != nullptr) fix = new Fix(m_lmp, lmpFix, fixId, FixAveTime, std::string("Time"), std::string("Value"));
      else fix = new Fix(m_lmp, lmpFix, fixId, FixOther, "", "");
      m_fixes[fixId] = *fix;
    }
  }

  // See if we have any fix that no longer is in LAMMPS
  for (auto it = m_fixes.cbegin(); it != m_fixes.cend();) {
    if (!findFixByIdentifier(it->first)) {
      m_fixes.erase(it++);
    } else {
      ++it;
    }
  }
}

void LAMMPSWeb::syncVariables() {
  LAMMPS_NS::Variable *variable = reinterpret_cast<LAMMPS_NS::Variable*>(m_lmp->input->variable);
  
  int nvar;
  LAMMPS_NS::Info info(m_lmp);
  char **names = info.get_variable_names(nvar);
  bool anyChanges = false;
  
  // First loop through all variables in LAMMPS to find new variables
  for(int i=0; i<nvar; i++) {
    char *name = names[i];
    int ivar = variable->find(name);
    bool equalStyle = variable->equalstyle(ivar);
    bool atomStyle = variable->atomstyle(ivar);
    if (!equalStyle && !atomStyle) {
      // We only support equal style and atom style variables
      continue;
    }
    auto identifier = std::string(name);
    if (m_variables.find(identifier) == m_variables.end()) {
      Variable *variable = new Variable(m_lmp, identifier, VariableOther, "Time", "Value");
      m_variables[identifier] = *variable;
    }
  }
  
  // See if we have any variables that no longer is in LAMMPS
  for (auto it = m_variables.cbegin(); it != m_variables.cend();) {
    if (variable->find(it->first.c_str()) == -1) {
      m_variables.erase(it++);
    } else {
      ++it;
    }
  }
}

std::vector<std::string> LAMMPSWeb::getComputeNames() {
  auto v = std::vector<std::string>();
  for (const auto& [key, value] : m_computes) {
    v.push_back(key);
  }
  return v;
}

std::vector<std::string> LAMMPSWeb::getVariableNames() {
  auto v = std::vector<std::string>();
  for (const auto& [key, value] : m_variables) {
    v.push_back(key);
  }
  return v;
}

Compute LAMMPSWeb::getCompute(std::string name) {
  return m_computes[name];
}

Variable LAMMPSWeb::getVariable(std::string name) {
  return m_variables[name];
}

Fix LAMMPSWeb::getFix(std::string name) {
  return m_fixes[name];
}

std::vector<std::string> LAMMPSWeb::getFixNames() {
  auto v = std::vector<std::string>();
  for (const auto& [key, value] : m_fixes) {
    v.push_back(key);
  }
  return v;
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

void LAMMPSWeb::synchronizeLAMMPS(int mode) {
#ifdef __EMSCRIPTEN__
  if(mode == 1000) {
    // Just a small sleep to not block UI
    emscripten_sleep(1);
    return;
  }

  if(mode != LAMMPS_NS::FixConst::END_OF_STEP && mode != LAMMPS_NS::FixConst::MIN_POST_FORCE) return;

  while (postStepCallback()) { // Returns true if paused
    emscripten_sleep(100);
  }
  emscripten_sleep(1);
#endif
}

long LAMMPSWeb::getBondsDistanceMapPointer() {
  return reinterpret_cast<long>(m_bondsDistanceMap);
}

long LAMMPSWeb::getPositionsPointer() {
  return reinterpret_cast<long>(m_particlesPosition);
}

long LAMMPSWeb::getIdPointer() {
  auto ptr = lammps_extract_atom((void *)m_lmp, "id");

  return reinterpret_cast<long>(ptr);
}

long LAMMPSWeb::getTypePointer() {
  auto ptr = lammps_extract_atom((void *)m_lmp, "type");

  return reinterpret_cast<long>(ptr);
}

int LAMMPSWeb::findFixIndex(std::string identifier) {
    if(!m_lmp) {
        return -1;
    }
    return m_lmp->modify->find_fix(identifier);
}

int LAMMPSWeb::findComputeIndex(std::string identifier) {
    if(!m_lmp) {
        return -1;
    }
    return m_lmp->modify->find_compute(identifier);
}

bool LAMMPSWeb::fixExists(std::string identifier) {
    return findFixIndex(identifier) >= 0;
}

LAMMPS_NS::Fix* LAMMPSWeb::findFixByIdentifier(std::string identifier) {
    int fixId = findFixIndex(identifier);
    if(fixId < 0) {
        return nullptr;
    } else {
        return m_lmp->modify->fix[fixId];
    }
}

LAMMPS_NS::Compute* LAMMPSWeb::findComputeByIdentifier(std::string identifier) {
  if (!m_lmp) {
    return nullptr;
  }

  int computeId = findComputeIndex(identifier);
  if(computeId < 0) {
      return nullptr;
  } else {
      return m_lmp->modify->compute[computeId];
  }
}

void LAMMPSWeb::start() {
  if(m_lmp) {
      stop();
  }

  int nargs = 1;
  char **argv = new char*[nargs];
  for(int i=0; i<nargs; i++) {
      argv[i] = new char[100];
  }

  m_lmp = (LAMMPS_NS::LAMMPS *)lammps_open_no_mpi(0, 0, nullptr);
  lammps_command(m_lmp, "fix atomify all atomify");
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

void LAMMPSWeb::stop() {
  if(m_lmp) {
    lammps_close((void*)m_lmp);
    m_lmp = nullptr;
    m_computes.clear();
    m_fixes.clear();
    m_variables.clear();
  }
}

void LAMMPSWeb::runFile(std::string path) {
  lammps_file((void*)m_lmp, path.c_str());
}


void LAMMPSWeb::step() {
  const char *script = "run 1 pre no post no\n";
  lammps_commands_string((void *)m_lmp, script);
}

void LAMMPSWeb::runCommand(std::string command) {
  lammps_commands_string((void *)m_lmp, command.c_str());
}
