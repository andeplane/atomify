#undef PACKAGE
#define PACKAGE "DPD-REACT"
#include "DPD-REACT/npair_half_bin_newton_ssa.h"
#undef PACKAGE
#define PACKAGE "KOKKOS"
#include "KOKKOS/npair_copy_kokkos.h"
#undef PACKAGE
#define PACKAGE "KOKKOS"
#include "KOKKOS/npair_halffull_kokkos.h"
#undef PACKAGE
#define PACKAGE "KOKKOS"
#include "KOKKOS/npair_kokkos.h"
#undef PACKAGE
#define PACKAGE "KOKKOS"
#include "KOKKOS/npair_skip_kokkos.h"
#undef PACKAGE
#define PACKAGE "KOKKOS"
#include "KOKKOS/npair_ssa_kokkos.h"
#undef PACKAGE
#define PACKAGE "KOKKOS"
#include "KOKKOS/npair_trim_kokkos.h"
#undef PACKAGE
#define PACKAGE "INTEL"
#include "INTEL/npair_bin_ghost_intel.h"
#undef PACKAGE
#define PACKAGE "INTEL"
#include "INTEL/npair_bin_intel.h"
#undef PACKAGE
#define PACKAGE "INTEL"
#include "INTEL/npair_halffull_intel.h"
#undef PACKAGE
#define PACKAGE "INTEL"
#include "INTEL/npair_skip_intel.h"
#undef PACKAGE
#define PACKAGE "INTEL"
#include "INTEL/npair_trim_intel.h"
#undef PACKAGE
#define PACKAGE "OPENMP"
#include "OPENMP/npair_bin_ghost_omp.h"
#undef PACKAGE
#define PACKAGE "OPENMP"
#include "OPENMP/npair_bin_omp.h"
#undef PACKAGE
#define PACKAGE "OPENMP"
#include "OPENMP/npair_halffull_omp.h"
#undef PACKAGE
#define PACKAGE "OPENMP"
#include "OPENMP/npair_multi_old_omp.h"
#undef PACKAGE
#define PACKAGE "OPENMP"
#include "OPENMP/npair_multi_omp.h"
#undef PACKAGE
#define PACKAGE "OPENMP"
#include "OPENMP/npair_nsq_ghost_omp.h"
#undef PACKAGE
#define PACKAGE "OPENMP"
#include "OPENMP/npair_nsq_omp.h"
#undef PACKAGE
#define PACKAGE "OPENMP"
#include "OPENMP/npair_respa_bin_omp.h"
#undef PACKAGE
#define PACKAGE "OPENMP"
#include "OPENMP/npair_respa_nsq_omp.h"
#undef PACKAGE
#define PACKAGE "OPENMP"
#include "OPENMP/npair_skip_omp.h"
#undef PACKAGE
#define PACKAGE "OPENMP"
#include "OPENMP/npair_trim_omp.h"
