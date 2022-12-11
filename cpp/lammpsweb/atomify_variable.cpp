#include "atomify_variable.h"
#include "variable.h"
#include "input.h"
#include "atom.h"

Variable::Variable(LAMMPS_NS::LAMMPS *lmp, std::string variableId, ModifyType type, std::string xLabel, std::string yLabel)
  : Modify(lmp, variableId, type, xLabel, yLabel)
{

}

void Variable::sync() {
    LAMMPS_NS::Variable *variable = m_lmp->input->variable;
    int ivar = variable->find(m_name.c_str());
    if (ivar < 0) return;

    if (variable->equalstyle(ivar)) {
        Data1D &data = ensureExists("scalar");
        double value = variable->compute_equal(ivar);
        data.add(simulationTime(), value);
        m_hasScalarData = true;
        m_scalarValue = value;
    }

    if (variable->atomstyle(ivar)) {
        m_hasPerAtomData = true;
        int numAtoms = m_lmp->atom->natoms;
        m_perAtomData.resize(numAtoms);
        double *vector = &m_perAtomData.front();
        variable->compute_atom(ivar,0 /* group index for all */,vector,1,0);
    }
}
