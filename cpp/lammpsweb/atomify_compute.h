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
  std::string m_name;
  ComputeType m_type;
  bool m_syncData;
  bool m_isPerAtom;
  std::vector<float> m_perAtomData;
  std::string getName() { return m_name; }
  int getType() { return m_type; }
  bool getSyncData() { return m_syncData; }
  bool getIsPerAtom() { return m_isPerAtom; }
  long getPerAtomData() { return reinterpret_cast<long>(m_perAtomData.data()); }
  void setSyncData(bool syncData) { m_syncData = syncData; }
  void sync(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::Compute *compute);
  bool sync(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::ComputeKEAtom *compute);
  bool syncPerAtom(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::Compute *compute);
};

#endif