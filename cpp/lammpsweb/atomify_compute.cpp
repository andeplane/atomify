#include "atomify_compute.h"
#include "lammps.h"
#include "atom.h"
#include "update.h"
#include <stdio.h>

void Compute::sync() {
  if(syncPerAtom()) return;
  if(trySync(dynamic_cast<LAMMPS_NS::ComputeTemp*>(m_compute))) return;
  // if(sync(dynamic_cast<ComputeKE*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputePE*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeRDF*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeMSD*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeVACF*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeCOM*>(lmp_compute), lammpsController)) return;
  // if(sync(dynamic_cast<ComputeGyration*>(lmp_compute), lammpsController)) return;

  if(m_compute->scalar_flag == 1) {
    double value = m_compute->scalar;
    m_hasScalarData = true;
    m_scalarValue = value;
    Data1D &data = ensureExists(std::string("scalar"));
    m_xLabel = "Time";
    m_yLabel = "Value";
    data.label = m_name;
    float simulationTime = m_lmp->update->atime + m_lmp->update->dt*(m_lmp->update->ntimestep - m_lmp->update->atimestep);
    data.add(simulationTime, value);
  }
}

Data1D &Compute::ensureExists(std::string name) {
  for (int i = 0; i < m_data1DNames.size(); i++) {
    if (m_data1DNames[i] == name) {
      return m_data1D[i];
    }
  }

  m_data1DNames.push_back(name);
  m_data1D.push_back(Data1D());
  return m_data1D.back();
}

bool Compute::trySync(LAMMPS_NS::ComputeTemp *compute) {
    if(!compute) return false;

    double value = compute->scalar;
    m_hasScalarData = true;
    m_scalarValue = value;
    
    Data1D &data = ensureExists(std::string("Temperature"));
    m_xLabel = "Time";
    m_yLabel = "Temperature"; 
    data.label = m_name;
    float simulationTime = m_lmp->update->atime + m_lmp->update->dt*(m_lmp->update->ntimestep - m_lmp->update->atimestep);
    data.add(simulationTime, value);
    return true;
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
  if( (m_compute->peflag||m_compute->peatomflag) && m_lmp->update->ntimestep != m_lmp->update->eflag_global) return false;
  if( (m_compute->pressflag||m_compute->pressatomflag) && m_lmp->update->ntimestep != m_lmp->update->vflag_global) return false;
  
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

float Compute::getScalarValue() {
  return m_scalarValue;
}