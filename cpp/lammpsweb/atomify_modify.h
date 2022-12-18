#ifndef ATOMIFY_MODIFY_H
#define ATOMIFY_MODIFY_H
#include <string>

#include "lammps.h"
#include "update.h"
#include "data1d.h"

enum ModifyType {
  ComputePressure,
  ComputeTemp,
  ComputePE,
  ComputeKE,
  ComputeRDF,
  ComputeMSD,
  ComputeVACF,
  ComputeCOM,
  ComputeGyration,
  ComputeKEAtom,
  ComputePropertyAtom,
  ComputeClusterAtom,
  ComputeCNAAtom,
  ComputeOther,
  FixAveChunk,
  FixAveHisto,
  FixAveTime,
  FixOther,
  VariableOther
};

struct Modify {
  Modify() {};
  Modify(LAMMPS_NS::LAMMPS *lmp, std::string modifyId, ModifyType type, std::string xLabel, std::string yLabel);

  ~Modify() {
    m_data1D.clear();
    m_perAtomData.clear();
  };
  LAMMPS_NS::LAMMPS *m_lmp = nullptr;
  std::string m_name;
  ModifyType m_type;
  std::string m_xLabel = "Time";
  std::string m_yLabel = "Value";
  float m_scalarValue = 0;
  bool m_clearPerSync = false;
  std::vector<double> m_perAtomData;
  std::vector<Data1D> m_data1D;
  std::vector<std::string> m_data1DNames;
  
  std::vector<std::string> getData1DNames() { return m_data1DNames; }
  std::vector<Data1D> getData1D() { return m_data1D; }
  std::string getXLabel() { return m_xLabel; }
  std::string getYLabel() { return m_yLabel; }
  std::string getName() { return m_name; }
  Data1D &ensureExists(std::string name);
  bool getClearPerSync() { return m_clearPerSync; }
  int getType() { return m_type; }
  float getScalarValue() { return m_scalarValue; }
  long getPerAtomData() { return reinterpret_cast<long>(m_perAtomData.data()); }
  float simulationTime() { return m_lmp->update->atime + m_lmp->update->dt*(m_lmp->update->ntimestep - m_lmp->update->atimestep); }
  virtual bool getIsPerAtom() = 0;
  virtual bool hasScalarData() = 0;
  virtual void sync() = 0;
};

#endif