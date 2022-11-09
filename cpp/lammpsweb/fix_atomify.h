/* -*- c++ -*- ----------------------------------------------------------
   LAMMPS - Large-scale Atomic/Molecular Massively Parallel Simulator
   http://lammps.sandia.gov, Sandia National Laboratories
   Steve Plimpton, sjplimp@sandia.gov
   Copyright (2003) Sandia Corporation.  Under the terms of Contract
   DE-AC04-94AL85000 with Sandia Corporation, the U.S. Government retains
   certain rights in this software.  This software is distributed under
   the GNU General Public License.
   See the README file in the top-level LAMMPS directory.
------------------------------------------------------------------------- */

#ifdef FIX_CLASS

FixStyle(atomify,FixAtomify)

#else

#ifndef LMP_FIX_ATOMIFY_H
#define LMP_FIX_ATOMIFY_H

#include "fix.h"

namespace LAMMPS_NS {


class FixAtomify : public Fix {
 public:
  FixAtomify(class LAMMPS *, int, char **);
  ~FixAtomify();
  void lost_atoms();
  int setmask();
  void init();
  void cancel();
  void end_of_step();
  void min_post_force(int);
  void update_compute(const char computeId[]);
  void update_computes();
  void init_list(int, class NeighList *);
  typedef void (*FnPtr)(void *, int);
  void set_callback(FnPtr, void *);
  
  class NeighList *list; // half neighbor list
  FnPtr callback;
  int step_count;
  void *ptr_caller;
  bool build_neighborlist;
  int neighborlist_built_at_timestep;
  bool m_cancel;
  int sync_frequency; // how often to perform expensive sync of positions and computes
};

}

#endif
#endif

/* ERROR/WARNING messages:
E: Illegal ... command
Self-explanatory.  Check the input script syntax and compare to the
documentation for the command.  You can use -echo screen as a
command-line option when running LAMMPS to see the offending line.
E: Fix external callback function not set
This must be done by an external program in order to use this fix.
*/