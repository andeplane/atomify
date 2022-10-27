#ifndef ATOMIFY_COMPUTE_H
#define ATOMIFY_COMPUTE_H
#include <string>
#include "compute.h"
#include "compute_ke_atom.h"
#include "lammps.h"

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
  LAMMPS_NS::LAMMPS *m_lmp;
  LAMMPS_NS::Compute *m_compute;
  std::string m_name;
  ComputeType m_type;
  bool m_syncData;
  std::vector<float> m_perAtomData;
  std::string getName() { return m_name; }
  int getType() { return m_type; }
  bool getSyncData() { return m_syncData; }
  bool getIsPerAtom() { return m_compute->peratom_flag; }
  long getPerAtomData() { return reinterpret_cast<long>(m_perAtomData.data()); }
  void setSyncData(bool syncData) { m_syncData = syncData; }
  void sync();
  bool execute();
  bool trySync(LAMMPS_NS::ComputeKEAtom *compute);
  bool syncPerAtom();
};

#endif