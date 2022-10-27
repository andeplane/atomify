#include "atomify_compute.h"
#include "lammps.h"
#include "atom.h"
#include <stdio.h>

void Compute::sync() {
  if(syncPerAtom()) return;
  // if(sync(dynamic_cast<ComputeTemp*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeKE*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputePE*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeRDF*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeMSD*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeVACF*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeCOM*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeGyration*>(lmp_compute), lammpsController)) return;
}

bool Compute::trySync(LAMMPS_NS::ComputeKEAtom *compute) {
  return false; 
}

bool Compute::syncPerAtom() {
  if(!m_compute || !m_compute->peratom_flag) return false;
  
  int numCols = m_compute->size_peratom_cols;
  int numAtoms = m_lmp->atom->natoms;
  if(numCols == 0) {
    double *values = m_compute->vector_atom;
    m_perAtomData.resize(numAtoms);
    for (int i = 0; i < numAtoms; i++) {
      m_perAtomData[i] = values[i];
    }
  } else {
    m_perAtomData.resize(numAtoms);
    for(int atomIndex=0; atomIndex<numAtoms; atomIndex++) {
      m_perAtomData[atomIndex] = m_compute->array_atom[atomIndex][0];
    }
  }
  return true;
}

bool Compute::execute() {
  bool didCompute = false;
  if (m_compute->scalar_flag == 1) {
    m_compute->compute_scalar();
    didCompute = true;
  }

  if (m_compute->vector_flag == 1) {
    m_compute->compute_vector();
    didCompute = true;
  }

  if (m_compute->array_flag == 1) {
    m_compute->compute_array();
    didCompute = true;
  }

  if (m_compute->peratom_flag == 1) {
    m_compute->compute_peratom();
    didCompute = true;
  }
  return didCompute;
}