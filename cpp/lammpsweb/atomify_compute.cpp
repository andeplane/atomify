#include "atomify_compute.h"
#include "lammps.h"
#include "atom.h"
#include <stdio.h>

void Compute::sync(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::Compute *compute) {
  if(syncPerAtom(lmp, compute)) return;
  // if(sync(dynamic_cast<ComputeTemp*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeKE*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputePE*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeRDF*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeMSD*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeVACF*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeCOM*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeGyration*>(lmp_compute), lammpsController)) return;
}

bool Compute::sync(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::ComputeKEAtom *compute) {
  return false; 
}

bool Compute::syncPerAtom(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::Compute *compute) {
  if(!compute || !compute->peratom_flag) return false;
  m_isPerAtom = true;
  
  int numCols = compute->size_peratom_cols;
  int numAtoms = lmp->atom->natoms;
  if(numCols == 0) {
    double *values = compute->vector_atom;
    m_perAtomData.resize(numAtoms);
    for (int i = 0; i < numAtoms; i++) {
      m_perAtomData[i] = values[i];
    }
  } else {
    m_perAtomData.resize(numAtoms);
    for(int atomIndex=0; atomIndex<numAtoms; atomIndex++) {
      m_perAtomData[atomIndex] = compute->array_atom[atomIndex][0];
    }
  }
  return true;
}