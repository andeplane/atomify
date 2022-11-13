#include "atomify_fix.h"

Fix::Fix(LAMMPS_NS::LAMMPS *lmp, LAMMPS_NS::Fix *fix, std::string fixId, ModifierType type, std::string xLabel, std::string yLabel)
  : Modifier(lmp, fixId, type, xLabel, yLabel),
   m_fix(fix)
{

}

bool Fix::trySync(LAMMPS_NS::FixAveChunk *fix) {
    return true;
}

bool Fix::trySync(LAMMPS_NS::FixAveHisto *fix) {
    return true;
}

bool Fix::trySync(LAMMPS_NS::FixAveTime *fix) {
    return true;
}

void Fix::sync() {
  
}

bool Fix::syncPerAtom() {
  return true;
}

bool Fix::execute() {
  return true;
}
