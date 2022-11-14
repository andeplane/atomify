#ifndef ATOMIFY_MODIFIER_H
#define ATOMIFY_MODIFIER_H
#include <string>

#include "lammps.h"
#include "data1d.h"

enum ModifierType {
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
  FixOther
};

struct Modifier {
  Modifier() {};
  Modifier(LAMMPS_NS::LAMMPS *lmp, std::string modifierId, ModifierType type, std::string xLabel, std::string yLabel);

  ~Modifier() {
    m_data1D.clear();
    m_perAtomData.clear();
  };
  LAMMPS_NS::LAMMPS *m_lmp = nullptr;
  std::string m_name;
  ModifierType m_type;
  std::string m_xLabel = "Time";
  std::string m_yLabel = "Value";
  float m_scalarValue = 0;
  bool m_clearPerSync = false;
  std::vector<float> m_perAtomData;
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
  
  virtual bool getIsPerAtom() = 0;
  virtual bool hasScalarData() = 0;
  virtual void sync() = 0;
};

#endif