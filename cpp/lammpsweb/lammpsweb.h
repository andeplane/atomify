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
private:
  LAMMPS_NS::LAMMPS *m_lmp;
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

public:
  LAMMPSWeb();
  ~LAMMPSWeb();
  long getCellMatrixPointer();
  long getOrigoPointer();
  int getNumAtoms();
  bool getIsRunning();
  void setSyncFrequency(int frequency);
  void setBuildNeighborlist(bool buildNeighborlist);
  std::string getErrorMessage();
  std::string getLastCommand();
  int getTimesteps();
  int getRunTotalTimesteps();
  int getRunTimesteps();

  // Pointer getters
  long getBondsDistanceMapPointer();
  long getPositionsPointer();
  long getIdPointer();
  long getTypePointer();
  long getBondsPosition1Pointer();
  long getBondsPosition2Pointer();

  // Computes for particles and bonds
  void reallocateBondsData(int newCapacity);
  int computeBonds();
  int computeParticles();
  void computeBondsFromBondList();
  void computeBondsFromNeighborlist();

  // Actions to control LAMMPS
  void cancel();
  void step();
  void start();
  void stop();
  void runFile(std::string path);
  void runCommand(std::string command);
  
  void synchronizeLAMMPS(int mode);

  LAMMPS_NS::Fix* findFixByIdentifier(std::string identifier);
  int findFixIndex(std::string identifier);
  bool fixExists(std::string identifier);
};

#ifdef __EMSCRIPTEN__
// Binding code
EMSCRIPTEN_BINDINGS(LAMMPSWeb)
{
  class_<LAMMPSWeb>("LAMMPSWeb")
      .constructor<>()
      .function("setBuildNeighborlist", &LAMMPSWeb::setBuildNeighborlist)
      .function("setSyncFrequency", &LAMMPSWeb::setSyncFrequency)
      .function("getIsRunning", &LAMMPSWeb::getIsRunning)
      .function("getErrorMessage", &LAMMPSWeb::getErrorMessage)
      .function("getLastCommand", &LAMMPSWeb::getLastCommand)
      .function("getTimesteps", &LAMMPSWeb::getTimesteps)
      .function("getRunTimesteps", &LAMMPSWeb::getRunTimesteps)
      .function("getRunTotalTimesteps", &LAMMPSWeb::getRunTotalTimesteps)
      
      .function("getPositionsPointer", &LAMMPSWeb::getPositionsPointer)
      .function("getBondsDistanceMapPointer", &LAMMPSWeb::getBondsDistanceMapPointer)
      .function("getIdPointer", &LAMMPSWeb::getIdPointer)
      .function("getTypePointer", &LAMMPSWeb::getTypePointer)
      .function("getCellMatrixPointer", &LAMMPSWeb::getCellMatrixPointer)
      .function("getOrigoPointer", &LAMMPSWeb::getOrigoPointer)
      .function("getBondsPosition1Pointer", &LAMMPSWeb::getBondsPosition1Pointer)
      .function("getBondsPosition2Pointer", &LAMMPSWeb::getBondsPosition2Pointer)
      
      .function("step", &LAMMPSWeb::step)
      .function("start", &LAMMPSWeb::start)
      .function("cancel", &LAMMPSWeb::cancel)
      .function("stop", &LAMMPSWeb::stop)
      .function("getNumAtoms", &LAMMPSWeb::getNumAtoms)
      .function("runFile", &LAMMPSWeb::runFile)
      .function("runCommand", &LAMMPSWeb::runCommand)
      
      .function("computeBonds", &LAMMPSWeb::computeBonds)
      .function("computeParticles", &LAMMPSWeb::computeParticles);

}
#endif
#endif