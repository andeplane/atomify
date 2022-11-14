#ifndef ATOMIFY_FIX_H
#define ATOMIFY_FIX_H
#include <string>
#include "atomify_modifier.h"
#include "fix.h"
#include "fix_ave_chunk.h"
#include "fix_ave_histo.h"
#include "fix_ave_time.h"

struct Fix : public Modifier {
  Fix(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::Fix *fix, std::string fixId, ModifierType type, std::string xLabel, std::string yLabel);
  Fix() {};
  ~Fix() {};

  LAMMPS_NS::Fix *m_fix = nullptr;
  long m_nextValidTimestep = -1;
  bool m_hasScalarData = false;
  
  ModifierType getType(int which, std::string identifier);
  bool trySync(LAMMPS_NS::FixAveChunk *fix);
  bool trySync(LAMMPS_NS::FixAveHisto *fix);
  bool trySync(LAMMPS_NS::FixAveTime *fix);
  bool getIsPerAtom() { return false; }
  bool hasScalarData() { return m_hasScalarData; }
  void sync();
};

#endif