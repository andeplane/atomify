#include <lammps.h>
#include <iostream>
#include <library.h>
#include <modify.h>
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
  long getPositionsPointer();
  long getIdPointer();
  long getTypePointer();
  int numAtoms();
  void loadLJ();
  void step();
  void start();
  void stop();
  double getX(int n);
  double getY(int n);
  double getZ(int n);
  void synchronizeLAMMPS(int mode);
  void runCommand(std::string command);
  int findFixIndex(std::string identifier);
  bool fixExists(std::string identifier);
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

void LAMMPSWeb::synchronizeLAMMPS(int mode)
{
    if(mode != LAMMPS_NS::FixConst::END_OF_STEP && mode != LAMMPS_NS::FixConst::MIN_POST_FORCE) return;
    std::cout << "Did synchronize yay" << std::endl;
    postStepCallback();
    // if(!system) {
    //     qDebug() << "Error, we dont have system object. Anders or Svenn-Arne did a horrible job here...";
    //     exit(1);
    // }

    // system->synchronize(this);
    // m_synchronizationCount++;

    // if(m_lammps->update->ntimestep - m_lastSynchronizationTimestep < simulationSpeed) return;
    // m_lastSynchronizationTimestep = m_lammps->update->ntimestep;

    // system->atoms()->processModifiers(system);
    // system->atoms()->createRenderererData(this);
    // worker->m_reprocessRenderingData = false;

    // system->updateThreadOnDataObjects(qmlThread);

    // worker->setNeedsSynchronization(true);
    // while(worker->needsSynchronization()) {
    //     if(QThread::currentThread()->isInterruptionRequested()) {
    //         // Happens if main thread wants to exit application
    //         throw Cancelled();
    //     }

    //     if(worker->m_reprocessRenderingData) {
    //         system->atoms()->processModifiers(system);
    //         if(worker->m_workerRenderingMutex.tryLock()) {
    //             system->atoms()->createRenderererData(this);
    //             worker->m_reprocessRenderingData = false;
    //             worker->m_workerRenderingMutex.unlock();
    //         }
    //     }

    //     if(m_paused) {
    //         QThread::currentThread()->msleep(100); // Check fairly slow
    //     } else {
    //         QThread::currentThread()->msleep(1); // As fast as possible
    //     }
    // }

    // if(worker->m_cancelPending) {
    //     throw Cancelled();
    // }
}

LAMMPSWeb::LAMMPSWeb() : lmp(nullptr)
{
  
}

LAMMPSWeb::~LAMMPSWeb()
{
  stop();
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
  // changeWorkingDirectoryToScriptLocation();
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
      .function("start", &LAMMPSWeb::start)
      .function("stop", &LAMMPSWeb::stop)
      .function("numAtoms", &LAMMPSWeb::numAtoms);
}