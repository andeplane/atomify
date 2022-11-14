#include "atomify_modify.h"

Modify::Modify(LAMMPS_NS::LAMMPS *lmp, std::string modifyId, ModifyType type, std::string xLabel, std::string yLabel) :
  m_lmp(lmp),
  m_name(modifyId),
  m_type(type),
  m_xLabel(xLabel),
  m_yLabel(yLabel)
{}

Data1D &Modify::ensureExists(std::string name) {
  for (int i = 0; i < m_data1DNames.size(); i++) {
    if (m_data1DNames[i] == name) {
      return m_data1D[i];
    }
  }

  m_data1DNames.push_back(name);
  m_data1D.push_back(Data1D());
  return m_data1D.back();
}
