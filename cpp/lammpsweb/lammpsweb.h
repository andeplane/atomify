#ifndef LAMMPSWEB_H
#define LAMMPSWEB_H
#include "lammps.h"
#include "fix.h"
#include "compute.h"
#include "fix.h"
#include "atomify_compute.h"
#include "atomify_fix.h"
#include <iostream>
#include <string>
#include <map>

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
  std::map<std::string,Compute> m_computes;
  std::map<std::string,Fix> m_fixes;
  double *m_cellMatrix;
  double *m_origo;
  float *m_bondsPosition1; // TODO: use std::vector
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
  double getTimestepsPerSecond();
  double getCPURemain();
  int getWhichFlag();
  bool getIsRunning();
  void setSyncFrequency(int frequency);
  void setBuildNeighborlist(bool buildNeighborlist);
  std::string getErrorMessage();
  std::string getLastCommand();
  int getTimesteps();
  int getRunTotalTimesteps();
  int getRunTimesteps();
  std::vector<std::string> getComputeNames();
  Compute getCompute(std::string name);
  std::vector<std::string> getFixNames();
  Fix getFix(std::string name);
  
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
  bool executeCompute(LAMMPS_NS::Compute *compute);
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
  void syncComputes();
  void syncFixes();

  LAMMPS_NS::Fix* findFixByIdentifier(std::string identifier);
  LAMMPS_NS::Compute* findComputeByIdentifier(std::string identifier);
  int findFixIndex(std::string identifier);
  int findComputeIndex(std::string identifier);
  bool fixExists(std::string identifier);
  std::string getExceptionMessage(intptr_t exceptionPtr) { return std::string(reinterpret_cast<std::exception *>(exceptionPtr)->what()); }
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
    .function("getTimestepsPerSecond", &LAMMPSWeb::getTimestepsPerSecond)
    .function("getCPURemain", &LAMMPSWeb::getCPURemain)
    .function("getWhichFlag", &LAMMPSWeb::getWhichFlag)
    .function("getCompute", &LAMMPSWeb::getCompute)
    .function("getComputeNames", &LAMMPSWeb::getComputeNames)
    .function("getFix", &LAMMPSWeb::getFix)
    .function("getFixNames", &LAMMPSWeb::getFixNames)
    .function("syncComputes", &LAMMPSWeb::syncComputes)
    .function("syncFixes", &LAMMPSWeb::syncFixes)
    
    .function("getPositionsPointer", &LAMMPSWeb::getPositionsPointer)
    .function("getBondsDistanceMapPointer", &LAMMPSWeb::getBondsDistanceMapPointer)
    .function("getIdPointer", &LAMMPSWeb::getIdPointer)
    .function("getTypePointer", &LAMMPSWeb::getTypePointer)
    .function("getCellMatrixPointer", &LAMMPSWeb::getCellMatrixPointer)
    .function("getOrigoPointer", &LAMMPSWeb::getOrigoPointer)
    .function("getBondsPosition1Pointer", &LAMMPSWeb::getBondsPosition1Pointer)
    .function("getBondsPosition2Pointer", &LAMMPSWeb::getBondsPosition2Pointer)
    .function("getExceptionMessage", &LAMMPSWeb::getExceptionMessage)
    
    .function("step", &LAMMPSWeb::step)
    .function("start", &LAMMPSWeb::start)
    .function("cancel", &LAMMPSWeb::cancel)
    .function("stop", &LAMMPSWeb::stop)
    .function("getNumAtoms", &LAMMPSWeb::getNumAtoms)
    .function("runFile", &LAMMPSWeb::runFile)
    .function("runCommand", &LAMMPSWeb::runCommand)
    
    .function("computeBonds", &LAMMPSWeb::computeBonds)
    .function("computeParticles", &LAMMPSWeb::computeParticles);
  class_<Modifier>("Modifier")
    .function("getName", &Modifier::getName)
    .function("getClearPerSync", &Modifier::getClearPerSync)
    .function("getType", &Modifier::getType)
    .function("getIsPerAtom", &Modifier::getIsPerAtom)
    .function("getPerAtomData", &Modifier::getPerAtomData)
    .function("hasScalarData", &Modifier::hasScalarData)
    .function("getScalarValue", &Modifier::getScalarValue)
    .function("getData1DNames", &Modifier::getData1DNames)
    .function("getData1D", &Modifier::getData1D)
    .function("getXLabel", &Modifier::getXLabel)
    .function("getYLabel", &Modifier::getYLabel)
    .function("sync", &Modifier::sync);

  class_<Compute, base<Modifier>>("Compute")
    .function("execute", &Compute::execute);

  class_<Data1D>("Data1D")
    .constructor<>()
    .function("getXValuesPointer", &Data1D::getXValuesPointer)
    .function("getYValuesPointer", &Data1D::getYValuesPointer)
    .function("getLabel", &Data1D::getLabel)
    .function("getNumPoints", &Data1D::getNumPoints);
  
  class_<Fix, base<Modifier>>("Fix");
  
  register_vector<Data1D>("vector<Data1D>");
  register_vector<std::string>("vector<std::string>");
  register_vector<Fix>("vector<Fix>");
  register_vector<Compute>("vector<Compute>");
  register_vector<float>("vector<float>");
}
#endif
#endif