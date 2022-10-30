#ifndef ATOMIFY_COMPUTE_H
#define ATOMIFY_COMPUTE_H
#include <string>
#include "compute.h"
#include "compute_ke_atom.h"
#include "compute_pressure.h"
#include "compute_vacf.h"
#include "compute_rdf.h"
#include "compute_msd.h"

#include "lammps.h"
#include "data1d.h"

enum ComputeType {
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
};

struct Compute {
  LAMMPS_NS::LAMMPS *m_lmp = nullptr;
  LAMMPS_NS::Compute *m_compute = nullptr;
  std::string m_name;
  ComputeType m_type;
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
  bool getIsPerAtom() { return m_compute->peratom_flag; }
  bool hasScalarData() { return m_compute->scalar_flag; }
  float getScalarValue();
  long getPerAtomData() { return reinterpret_cast<long>(m_perAtomData.data()); }
  void sync();
  bool trySync(LAMMPS_NS::ComputeRDF *compute);
  bool trySync(LAMMPS_NS::ComputeMSD *compute);
  bool trySync(LAMMPS_NS::ComputeVACF *compute);
  bool trySync(LAMMPS_NS::ComputePressure *compute);
  bool execute();
  bool syncPerAtom();
};

#endif