#ifndef ATOMIFY_VARIABLE_H
#define ATOMIFY_VARIABLE_H
#include <string>
#include "atomify_modify.h"

struct Variable : public Modify {
  Variable(LAMMPS_NS::LAMMPS *lmp, std::string variableId, ModifyType type, std::string xLabel, std::string yLabel);
  Variable() {};
  ~Variable() {};

  long m_nextValidTimestep = -1;
  bool m_hasScalarData = false;
  bool m_hasPerAtomData = false;
  
  bool getIsPerAtom() { return m_hasPerAtomData; }
  bool hasScalarData() { return m_hasScalarData; }
  virtual void sync();
};

#endif