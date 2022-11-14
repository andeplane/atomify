#ifndef ATOMIFY_COMPUTE_H
#define ATOMIFY_COMPUTE_H
#include <string>
#include "compute.h"
#include "compute_ke_atom.h"
#include "compute_pressure.h"
#include "compute_vacf.h"
#include "compute_rdf.h"
#include "compute_msd.h"

#include "atomify_modify.h"

#include "lammps.h"
#include "data1d.h"

struct Compute : public Modify {
  Compute(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::Compute *compute, std::string computeId, ModifyType type, std::string xLabel, std::string yLabel);
  Compute() {};
  ~Compute() {};
  LAMMPS_NS::Compute *m_compute = nullptr;
  
  bool trySync(LAMMPS_NS::ComputeRDF *compute);
  bool trySync(LAMMPS_NS::ComputeMSD *compute);
  bool trySync(LAMMPS_NS::ComputeVACF *compute);
  bool trySync(LAMMPS_NS::ComputePressure *compute);
  bool getIsPerAtom() { return m_compute->peratom_flag; }
  bool hasScalarData() { return m_compute->scalar_flag; }
  void sync();
  bool syncPerAtom();
  bool execute();
};

#endif