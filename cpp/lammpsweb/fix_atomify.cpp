/* ----------------------------------------------------------------------
   LAMMPS - Large-scale Atomic/Molecular Massively Parallel Simulator
   http://lammps.sandia.gov, Sandia National Laboratories
   Steve Plimpton, sjplimp@sandia.gov
   
   Copyright (2003) Sandia Corporation.  Under the terms of Contract
   DE-AC04-94AL85000 with Sandia Corporation, the U.S. Government retains
   certain rights in this software.  This software is distributed under
   the GNU General Public License.
   
   See the README file in the top-level LAMMPS directory.
------------------------------------------------------------------------- */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "fix_atomify.h"
#include "atom.h"
#include "comm.h"
#include "neighbor.h"
#include "neigh_request.h"
#include "neigh_list.h"
#include "memory.h"
#include "compute.h"
#include "modify.h"
#include "error.h"
#include "update.h"
#include "compute_pe_atom.h"
#include "compute_stress_atom.h"
#include "exceptions.h"

using namespace LAMMPS_NS;
using namespace FixConst;

/* ---------------------------------------------------------------------- */

FixAtomify::FixAtomify(LAMMPS *lmp, int narg, char **arg)
    : Fix(lmp, narg, arg)
    , list(NULL)
    , step_count(0)
    , callback(NULL)
    , ptr_caller(NULL)
    , build_neighborlist(false)
    , sync_frequency(1)
    , m_cancel(false)
    , neighborlist_built_at_timestep(-1)
{
}

/* ---------------------------------------------------------------------- */

FixAtomify::~FixAtomify() { }

/* ---------------------------------------------------------------------- */

int FixAtomify::setmask()
{
    int mask = 0;
    mask |= END_OF_STEP;
    mask |= MIN_POST_FORCE;
    return mask;
}

/* ---------------------------------------------------------------------- */

void FixAtomify::init()
{
    if (callback == NULL)
        error->all(FLERR,"Fix atomify callback function not set");
    int irequest = neighbor->request(this,instance_me);
    neighbor->requests[irequest]->pair = 0;
    neighbor->requests[irequest]->fix = 1;
    neighbor->requests[irequest]->occasional = 1;
    neighbor->requests[irequest]->half = 1;
    neighbor->requests[irequest]->full = 0;
}

void FixAtomify::init_list(int id, NeighList *ptr)
{
  list = ptr;
}

void FixAtomify::lost_atoms()
{
    bigint natoms;
    bigint nblocal = atom->nlocal;
    MPI_Allreduce(&nblocal,&natoms,1,MPI_LMP_BIGINT,MPI_SUM,world);
    if (natoms != atom->natoms && comm->me == 0) {
        char str[128];
        sprintf(str,
                "Lost atoms: original " BIGINT_FORMAT " current " BIGINT_FORMAT,
                atom->natoms,natoms);
        error->all(FLERR,str);
    }
}

/* ---------------------------------------------------------------------- */

void FixAtomify::update_compute(const char computeId[])
{
    int icompute = modify->find_compute(computeId);
    if (icompute < 0) return;
    
    Compute *compute = modify->compute[icompute];
    compute->addstep(update->ntimestep+1);
}

void FixAtomify::update_computes()
{
    // Prepare computes to be computed next time step
    for(int i=0; i<modify->ncompute; i++) {
        Compute *compute = modify->compute[i];
        if(compute->peatomflag || compute->peflag || compute->pressatomflag || compute->pressflag) {
            compute->addstep(update->ntimestep+1);
        }
    }
}

void FixAtomify::end_of_step()
{
    if (m_cancel) {
        error->all(FLERR, "Atomify::canceled");
    }
    step_count++;
    if(build_neighborlist) {
        neighbor->build_one(list);
        neighborlist_built_at_timestep = update->ntimestep;
    }
    lost_atoms();
    bool will_sync_next = (step_count+1) % sync_frequency == 0;
    if (will_sync_next) {
        update_computes();
    }

    bool will_sync_now = step_count % sync_frequency == 0;
    if (will_sync_now) {
        (this->callback)(ptr_caller,END_OF_STEP);
    } else if (sync_frequency > 10 && step_count % 10 == 0) {
        // We won't sync anything, but will do a small sleep to not freeze UI
        (this->callback)(ptr_caller, 1000);
    }
}

void FixAtomify::cancel()
{
    m_cancel = true;
}

/* ---------------------------------------------------------------------- */

void FixAtomify::min_post_force(int vflag)
{
    if (m_cancel) {
        error->all(FLERR, "Atomify::canceled");
    }
    step_count++;

    if(build_neighborlist) {
        neighbor->build_one(list);
        neighborlist_built_at_timestep = update->ntimestep;
    }
    lost_atoms();
    bool should_sync = step_count % sync_frequency == 0;
    if (should_sync) {
        (this->callback)(ptr_caller,MIN_POST_FORCE);
    } else if (sync_frequency > 10 && step_count % 10 == 0) {
        // We won't sync anything, but will do a small sleep to not freeze UI
        (this->callback)(ptr_caller, 1000);
    }
}

/* ---------------------------------------------------------------------- */

void FixAtomify::set_callback(FnPtr caller_callback, void *caller_ptr)
{
    callback = caller_callback;
    ptr_caller = caller_ptr;
}