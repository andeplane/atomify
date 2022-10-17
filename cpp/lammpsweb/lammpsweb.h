#ifndef LAMMPSWEB_H
#define LAMMPSWEB_H
#include "lammps.h"
#include "fix.h"
#include <iostream>
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
  double *m_cellMatrix;
  double *m_origo;
  float *m_bondsPosition1;
  float *m_bondsPosition2;
  float *m_bondsDistanceMap;
  float *m_particlesPosition;
  int m_bondsCapacity;
  int m_particlesCapacity;
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
  int computeParticles();
  void computeBondsFromBondList();
  void computeBondsFromNeighborlist();
  int numAtoms();
  bool isRunning();
  void loadLJ();
  void cancel();
  void step();
  void start();
  void stop();
  std::string getErrorMessage();
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

#ifdef __EMSCRIPTEN__
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
      .function("computeParticles", &LAMMPSWeb::computeParticles)
      .function("setBuildNeighborlist", &LAMMPSWeb::setBuildNeighborlist)
      .function("getBondsPosition1", &LAMMPSWeb::getBondsPosition1)
      .function("getBondsPosition2", &LAMMPSWeb::getBondsPosition2)
      .function("getErrorMessage", &LAMMPSWeb::getErrorMessage)
      .function("cancel", &LAMMPSWeb::cancel)
      .function("setSyncFrequency", &LAMMPSWeb::setSyncFrequency);

}
#endif
#endif