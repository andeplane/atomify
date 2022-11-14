#include "atomify_fix.h"
#include "update.h"
#include "compute.h"
#include "compute_rdf.h"
#include "modify.h"

Fix::Fix(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::Fix *fix, std::string fixId, ModifierType type, std::string xLabel, std::string yLabel)
  : Modifier(lmp, fixId, type, xLabel, yLabel),
   m_fix(fix)
{

}

bool Fix::trySync(LAMMPS_NS::FixAveChunk *fix) {
    return false;
}

bool Fix::trySync(LAMMPS_NS::FixAveHisto *fix) {
    return false;
}

ModifierType Fix::getType(int which, std::string identifier) {
  enum{COMPUTE,FIX,VARIABLE};

  if(which == COMPUTE) {
    LAMMPS_NS::Compute *compute = m_lmp->modify->get_compute_by_id(identifier);

    if(compute) {
      LAMMPS_NS::ComputeRDF *compute_rdf = dynamic_cast<LAMMPS_NS::ComputeRDF *>(compute);
      if(compute_rdf) {
          return ComputeRDF;
      }
    }
  }
  return FixOther;
}

bool Fix::trySync(LAMMPS_NS::FixAveTime *fix) {
  if(!fix) return false;
  if(m_nextValidTimestep > m_lmp->update->ntimestep) {
      // Not ready to measure yet
      return true;
  }
  enum{SCALAR,VECTOR};
  int nrows, nvalues, dim, mode;
  nrows = fix->getnrows();
  nvalues = fix->getnvalues();
  mode = fix->getmode();
  
  auto nextValidTimestep = fix->nextvalid();
  float simulationTime = m_lmp->update->atime + m_lmp->update->dt*(m_lmp->update->ntimestep - m_lmp->update->atimestep);
  if(m_nextValidTimestep+1 == m_lmp->update->ntimestep) { // m_nextValidTimestep+1 because fix_atomify is invoked before all other fixes, so we need the next timestep
    if(mode == SCALAR) {
      // Time dependent solution with 1 or more values
      if(nvalues == 1) {
        // A single value
        m_hasScalarData = true;
        m_scalarValue = fix->compute_scalar();

        Data1D &data = ensureExists("scalar");
        data.label = m_name;
        data.add(simulationTime, m_scalarValue);
      } else {
        // Multiple values
        for(int i=0; i<nvalues; i++) {
          double value = fix->compute_vector(i);
          std::string key = std::string("Pair_")+std::to_string(i+1);
          Data1D &data = ensureExists(key);
          data.label = key;
          data.add(simulationTime, value);
        }
      }
      m_xLabel = "Time";
      m_yLabel = "Value";
      return true;
    } else {
      char **ids = fix->getids();
      int *which = fix->getwhich();

      for(int i=0; i<nvalues; i++) {
        auto type = getType(which[i], ids[i]);
        std::string key = std::string("Value ")+std::to_string(i+1);
        Data1D &data = ensureExists(key);
        data.label = key;
        data.clear();
        
        for(int j=0; j<nrows; j++) {
          double value = fix->compute_array(j, i);
          if(type==ComputeRDF) {
            LAMMPS_NS::ComputeRDF *compute_rdf = dynamic_cast<LAMMPS_NS::ComputeRDF *>(m_lmp->modify->get_compute_by_id(ids[i]));
            double binCenter = compute_rdf->array[j][0];
            data.add(binCenter, value);
          } else {
            data.add(j, value);
          }
        }
      }
    }
  }

  m_nextValidTimestep = nextValidTimestep;
  return true;
}

void Fix::sync() {
  if(trySync(dynamic_cast<LAMMPS_NS::FixAveTime*>(m_fix))) return;
  if(trySync(dynamic_cast<LAMMPS_NS::FixAveHisto*>(m_fix))) return;
  if(trySync(dynamic_cast<LAMMPS_NS::FixAveChunk*>(m_fix))) return;
}
