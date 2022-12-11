#include "atomify_compute.h"
#include "lammps.h"
#include "atom.h"
#include "update.h"
#include <stdio.h>

Compute::Compute(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::Compute *compute, std::string computeId, ModifyType type, std::string xLabel, std::string yLabel)
  : Modify(lmp, computeId, type, xLabel, yLabel),
   m_compute(compute)
{

}

void Compute::sync() {
  if(syncPerAtom()) return;
  if(trySync(dynamic_cast<LAMMPS_NS::ComputeRDF*>(m_compute))) return;
  if(trySync(dynamic_cast<LAMMPS_NS::ComputeMSD*>(m_compute))) return;
  if(trySync(dynamic_cast<LAMMPS_NS::ComputeVACF*>(m_compute))) return;
  if(trySync(dynamic_cast<LAMMPS_NS::ComputePressure*>(m_compute))) return;
  // if(sync(dynamic_cast<ComputeGyration*>(lmp_compute), lammpsController)) return;

  if(m_compute->scalar_flag == 1) {
    m_scalarValue = m_compute->scalar;
    Data1D &data = ensureExists(std::string("scalar"));
    data.label = m_name;
    data.add(simulationTime(), m_scalarValue);
  }
}

bool Compute::trySync(LAMMPS_NS::ComputeRDF *compute) {
  if(!compute) return false;
  m_clearPerSync = true;
  int numBins = compute->size_array_rows;         // rows in global array
  int numColumns = compute->size_array_cols;      // columns in global array
  int numPairs = (numColumns - 1)/2;

  for(int pairId=0; pairId<numPairs; pairId++) {
      std::string key = std::string("g(r) pair ")+std::to_string(pairId+1);
      Data1D &data = ensureExists(key);
      data.label = key;
      data.clear();

      for(int bin=0; bin<numBins; bin++) {
        double r = compute->array[bin][0];
        double rdf = compute->array[bin][1+2*pairId];
        data.add(r,rdf);
      }
  }

  m_xLabel = "r";
  m_yLabel = "RDF";
  return true;
}

bool Compute::trySync(LAMMPS_NS::ComputeMSD *compute) {
  if(!compute) return false;

  std::vector<std::string> components = {"dx2", "dy2", "dz2", "dr2"};
  std::vector<std::string> labels = {"∆x^2", "∆y^2", "∆z^2", "∆r^2"};

  int numVectorValues = 4;
  for(int i=0; i<numVectorValues; i++) {
    auto key = components[i];
    Data1D &data = ensureExists(key);
    data.label = labels[i];
    float value = compute->vector[i];
    data.add(simulationTime(), value);
  }
  m_xLabel = "Time";
  m_yLabel = "Mean square displacement";
  
  return true;
}

bool Compute::trySync(LAMMPS_NS::ComputeVACF *compute) {
  if(!compute) return false;
  
  std::vector<std::string> components = {"vx2", "vy2", "vz2", "vr2"};
  std::vector<std::string> labels = {"<vx, vx0>", "<vy, vy0>", "<vz, vz0>", "<v, v0>"};
  int numVectorValues = 4;
  for(int i=0; i<numVectorValues; i++) {
      auto key = components[i];
      Data1D &data = ensureExists(key);
      data.label = labels[i];
      float value = compute->vector[i];
      data.add(simulationTime(), value);
  }
  m_xLabel = "Time";
  m_yLabel = "VACF";
  return true;
}

bool Compute::trySync(LAMMPS_NS::ComputePressure *compute) {
  if(!compute) return false;
  
  // First compute scalar pressure
  m_scalarValue = compute->scalar;
  Data1D &data = ensureExists("Pressure");
  data.label = "Pressure";
  m_xLabel = "Time";
  m_yLabel = "Pressure";
  data.add(simulationTime(), m_scalarValue);

  std::vector<std::string> components = {"Pxx", "Pyy", "Pzz", "Pxy", "Pxz", "Pyz"};

  int numVectorValues = 6;
  for(int i=0; i<numVectorValues; i++) {
      auto key = components[i];
      Data1D &data = ensureExists(key);
      data.label = components[i];
      double value = compute->vector[i];
      data.add(simulationTime(), value);
  }
  return true;
}

bool Compute::syncPerAtom() {
  if(!m_compute->peratom_flag) return false;
  
  int numCols = m_compute->size_peratom_cols;
  int numAtoms = m_lmp->atom->natoms;

  if (numAtoms > m_perAtomData.size()) {
    m_perAtomData.resize(numAtoms);
  }

  if(numCols == 0) {
    for (int i = 0; i < numAtoms; i++) {
      m_perAtomData[i] = m_compute->vector_atom[i];
    }
  } else {
    for(int i=0; i<numAtoms; i++) {
      m_perAtomData[i] = m_compute->array_atom[i][0];
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
