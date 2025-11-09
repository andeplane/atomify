#include "atomify_fix.h"
#include "update.h"
#include "compute.h"
#include "compute_rdf.h"
#include "modify.h"
#include "arg_info.h"

Fix::Fix(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::Fix *fix, std::string fixId, ModifyType type, std::string xLabel, std::string yLabel)
  : Modify(lmp, fixId, type, xLabel, yLabel),
   m_fix(fix)
{

}

bool Fix::trySync(LAMMPS_NS::FixAveChunk *fix) {
    return false;
}

bool Fix::trySync(LAMMPS_NS::FixAveHisto *fix) {
    return false;
}

ModifyType Fix::getType(int which, std::string identifier) {
  if(which == LAMMPS_NS::ArgInfo::COMPUTE) {
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
  if(m_nextValidTimestep+1 == m_lmp->update->ntimestep) { // m_nextValidTimestep+1 because fix_atomify is invoked before all other fixes, so we need the next timestep
    if(mode == SCALAR) {
      // Time dependent solution with 1 or more values
      if(nvalues == 1) {
        // A single value
        m_hasScalarData = true;
        m_scalarValue = fix->compute_scalar();

        Data1D &data = ensureExists("scalar");
        data.label = m_name;
        data.add(simulationTime(), m_scalarValue);
      } else {
        // Multiple values
        for(int i=0; i<nvalues; i++) {
          double value = fix->compute_vector(i);
          std::string key = std::string("Value ")+std::to_string(i+1);
          Data1D &data = ensureExists(key);
          data.label = key;
          data.add(simulationTime(), value);
        }
      }
      m_xLabel = "Time";
      m_yLabel = "Value";
      return true;
    } else {
      const auto &values = fix->getValues();
      for(int i=0; i<nvalues; i++) {
        const auto &val = values[i];
        auto type = getType(val.which, val.id);


        std::string key = std::string("Value ")+std::to_string(i+1);
        if(type==ComputeRDF) {
          if (i == 0) {
            // The first is the bin centers. We don't want to plot those
            continue;
          }
          if (i % 2 == 0) {
            // Every even i is g(r)
            int pairNumber = i/2;
            key = std::string("g(r) pair ")+std::to_string(pairNumber);
          } else {
            // Every odd i is coord(r)
            int pairNumber = (i-1)/2;
            key = std::string("coord(r) pair ")+std::to_string(pairNumber);
          }
        }
        Data1D &data = ensureExists(key);
        data.label = key;
        data.clear();
        m_clearPerSync = true;

        if(type==ComputeRDF) {
          LAMMPS_NS::ComputeRDF *compute_rdf = dynamic_cast<LAMMPS_NS::ComputeRDF *>(m_lmp->modify->get_compute_by_id(val.id));
          for(int j=0; j<nrows; j++) {
            double binCenter = compute_rdf->array[j][0];
            double value = fix->compute_array(j, i);
            data.add(binCenter, value);
          }
        } else {
          for(int j=0; j<nrows; j++) {
            double value = fix->compute_array(j, i);
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
