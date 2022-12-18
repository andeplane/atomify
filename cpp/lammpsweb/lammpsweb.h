#ifndef LAMMPSWEB_H
#define LAMMPSWEB_H
#include "lammps.h"
#include "fix.h"
#include "compute.h"
#include "fix.h"
#include "atomify_compute.h"
#include "atomify_fix.h"
#include "atomify_variable.h"
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
  std::map<std::string,Variable> m_variables;
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
  std::vector<std::string> getVariableNames();
  Variable getVariable(std::string name);
  long getMemoryUsage();
  
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
  void syncVariables();

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
    .function("getVariable", &LAMMPSWeb::getVariable)
    .function("getVariableNames", &LAMMPSWeb::getVariableNames)
    .function("syncComputes", &LAMMPSWeb::syncComputes)
    .function("syncFixes", &LAMMPSWeb::syncFixes)
    .function("syncVariables", &LAMMPSWeb::syncVariables)
    .function("getMemoryUsage", &LAMMPSWeb::getMemoryUsage)
    
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
  class_<Modify>("Modify")
    .function("getName", &Modify::getName)
    .function("getClearPerSync", &Modify::getClearPerSync)
    .function("getType", &Modify::getType)
    .function("getIsPerAtom", &Modify::getIsPerAtom)
    .function("getPerAtomData", &Modify::getPerAtomData)
    .function("hasScalarData", &Modify::hasScalarData)
    .function("getScalarValue", &Modify::getScalarValue)
    .function("getData1DNames", &Modify::getData1DNames)
    .function("getData1D", &Modify::getData1D)
    .function("getXLabel", &Modify::getXLabel)
    .function("getYLabel", &Modify::getYLabel)
    .function("sync", &Modify::sync);

  class_<Compute, base<Modify>>("Compute")
    .function("execute", &Compute::execute);

  class_<Variable, base<Modify>>("Variable");

  class_<Data1D>("Data1D")
    .constructor<>()
    .function("getXValuesPointer", &Data1D::getXValuesPointer)
    .function("getYValuesPointer", &Data1D::getYValuesPointer)
    .function("getLabel", &Data1D::getLabel)
    .function("getNumPoints", &Data1D::getNumPoints);
  
  class_<Fix, base<Modify>>("Fix");
  
  register_vector<Data1D>("vector<Data1D>");
  register_vector<std::string>("vector<std::string>");
  register_vector<Fix>("vector<Fix>");
  register_vector<Compute>("vector<Compute>");
  register_vector<float>("vector<float>");
}
#endif
#endif