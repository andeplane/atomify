import {useCallback} from 'react'
import {useStoreActions, useStoreState} from '../hooks'
import MonacoEditor, {monaco} from 'react-monaco-editor'


monaco.languages.register({'id': 'lammps'});
monaco.languages.setMonarchTokensProvider('lammps', {
  keywords: ['ave/correlate', 'lj/spica/coul/msm/omp', 'return', 'heat/gran', 'pair_write', 'fene/intel', 'temper', 'lj/charmm/coul/charmm/omp', 'cna/atom', 'nbond/atom', 'boundary_integral', 'airebo/intel', 'rdf', 'nodeset_to_elementset', 'movie', 'lb/momentum', 'local/gran/vtk', 'tersoff/mod/gpu', 'colloid/omp', 'atom/molecule', 'threebody/table', 'mesh/surface', 'kspace_style', 'plugin', 'write_dump', 'rebo/omp', 'thermo', 'qeq/point', 'mvv/edpd', 'colloid/gpu', 'neigh_settings', 'coul/shield', 'compute', 'scafacos', 'check/timestep/gran', 'lj/cut/thole/long', 'dpd/tstat', 'store/state', 'temp/deform/kk', 'group/group', 'dpd/fdt', 'edip/multi', 'setforce/kk', 'lj/charmm/coul/charmm', 'run_style', 'sph/taitwater/morris', 'born/coul/wolf/cs', 'yukawa/colloid', 'nvt/sllod/kk', 'sw/mod', 'lj/class2/coul/cut/soft', 'cross', 'damping/cundall', 'hbond/dreiding/lj/omp', 'aveforce', 'smd/damage', 'nve/asphere/noforce', 'rigid/npt/omp', 'smd/triangle/vertices', 'harmonic/shift/cut/omp', 'srp', 'lj/cut/coul/dsf/omp', 'read_dump', 'airebo/omp', 'minimize', 'voronoi/atom', 'rigid/nph', 'rigid/local', 'pair/local', 'nve/asphere/gpu', 'lj/cut/dipole/cut/gpu', 'coul/msm', 'kernel_bandwidth', 'tdpd/cc/atom', 'zbl/kk', 'lumped_lambda_solve', 'suffix', 'peri/lps/omp', 'coul/wolf', 'fene/expand', 'pafi', 'nm/cut/split', 'stress/mop', 'coul/wolf/omp', 'nve/kk', 'table/omp', 'lj/cut/coul/debye/dielectric/omp', 'group2ndx', 'brownian', 'neigh_modify', 'lj/cut/coul/cut/soft', 'hbond/dreiding/lj', 'tersoff/zbl', 'hybrid/overlay', 'dump_modify', 'bond/react', 'nve/bpm/sphere', 'lj/charmm/coul/charmm/kk', 'lj/cut/coul/long/dielectric/omp', 'pair', 'colvars', 'e3b', 'custom/vtk', 'equal', 'coul/diel', 'ke/multisphere', 'temp/deform', 'on_the_fly', 'hybrid', 'eim/omp', 'lj/charmm/coul/long/omp', 'vtk', 'heat', 'temp/chunk', 'smd/tlsph/num/neighs', 'multi/harmonic', 'bubble', 'neb/spin', 'wall/body/polyhedron', 'atom/adios', 'reaxff/omp', 'nvt/sllod/intel', 'precession/spin', 'pressure', 'partition', 'ave/sphere/atom/kk', 'buck/long/coul/long', 'bond', 'buck', 'third_order/kk', 'cfg/uef', 'rigid/nve/small', 'buck/coul/long/cs', 'damage/atom', 'coul/cut/global', 'reaxff/kk', 'multisphere', 'track_displacement', 'temp/rotate', 'sqdistharm', 'smd/ulsph', 'smd/ulsph/num/neighs', 'smd/tri_surface', 'off', 'pressure/uef', 'vcm/chunk', 'lj/cut/coul/debye', 'gravity', 'sna/grid', 'lj/charmm/coul/long/opt', 'lj/cut/coul/long/omp', 'dpd/kk', 'harmonic/shift', 'lj/cut/soft', 'sph/density/corr', 'lj/charmm/coul/long/soft/omp', 'lj/cut/coul/long/cs', 'smd/tlsph/stress', 'qeq/reaxff/omp', 'nve/line', 'thermal', 'gld', 'halt', 'reset_timestep', 'gran', 'msst', 'smtbq', 'force/tally', 'body/rounded/polygon', 'adp/kk', 'morse/smooth/linear/omp', 'bocs', 'yes', 'coul/long/soft/omp', 'born/coul/dsf', 'cosine/buck6d', 'sph/artVisc/tensCorr', 'lj/spica/coul/long/omp', 'source_integration', 'sph/rho/atom', 'born/coul/long/cs/gpu', 'setforce/spin', 'min_style fire', 'gran/hooke', 'computes', 'gauss/cut/omp', 'tersoff/mod/c', 'plumed', 'smd/move_tri_surf', 'amoeba/bitorsion', 'awpmd/cut', 'filter', 'lj/cut/coul/msm', 'localized_lambda', 'coul/cut/omp', 'wall/lj93', 'hybrid/kk', 'com', 'coul/long/soft', 'temp/deform/eff', 'lj/gromacs/omp', 'peri/pmb', 'lj/cut/coul/long/soft/omp', 'gauss', 'wall/gran/region', 'lj/charmm/coul/msm', 'unfix', 'pppm/disp', 'multi/lucy/rx/kk', 'morse/kk', 'internal_element_set', 'nve/omp', 'qeq/comb/omp', 'coul/cut/soft', 'coul/streitz', 'buck/gpu', 'angle/local', 'nph', 'gayberne', 'lj/gromacs/coul/gromacs', 'rebo', 'manifoldforce', 'lj/spica/omp', 'coul/long/dielectric', 'adf', 'smd/tlsph/strain', 'gaussian', 'compute_modify', 'shake/kk', 'lj/class2/gpu', 'msd', 'meam/spline/omp', 'while', 'reaxff/bonds', 'yukawa/gpu', 'tersoff/zbl/gpu', 'multisphere/break', 'lj/cut/opt', 'ttm', 'born/coul/long/cs', 'if', 'min_style sd', 'rebo/intel', 'dihedral/local', 'special', 'helix', 'tersoff/zbl/omp', 'body/local', 'smd/rho', 'bond_coeff', 'sw/mod/omp', 'dimension', 'smd/ulsph/strain/rate', 'smd/tlsph/defgrad', 'npt/eff', 'lj/spica/kk', 'fep/ta', 'nvt/sphere', 'propel/self', 'granular', 'vashishta/table/omp', 'special_bonds', 'meam', 'lj/cut/dipole/cut', 'erotate/asphere', 'lj/cut/coul/long/dielectric', 'lj/cut/kk', 'lcbop', 'adapt/fep', 'fabric', 'coul/long/cs', 'lubricateU', 'com/chunk', 'lj/charmm/coul/long/kk', 'lj/cut/coul/debye/gpu', 'temp/drude', 'lj/cut/coul/cut/dielectric', 'ke/atom/eff', 'buoyancy', 'lj/charmm/coul/charmm/implicit', 'oxrna2/excv', 'gayberne/omp', 'rigid/npt/small', 'lj/long/coul/long', 'gravity/kk', 'massflow/mesh/sieve', 'lj96/cut/gpu', 'snap', 'NULL', 'resquared', 'freeze/kk', 'temp/ramp', 'charge/regulation', 'pair_modify', 'spica', 'external', 'property/atom/tracer/stream', 'tersoff/mod/kk', 'lebedeva/z', 'gle', 'lj/cut/coul/debye/omp', 'ring', 'smd/internal/energy', 'stress/cartesian', 'eam/cd', 'oxdna/hbond', 'lj/cut/coul/msm/gpu', 'buck/coul/msm', 'lj/relres', 'continuum/weighted', 'ke/eff', 'oxdna/xstk', 'wall/region', 'orientorder/atom', 'boundary_faceset', 'heat/flux/virial/tally', 'temp/eff', 'pe/tally', 'angmom/chunk', 'coul/cut/kk', 'pppm/stagger', 'vashishta/gpu', 'qeq/reaxff/kk', 'nph/omp', 'gradients', 'thole', 'setforce', 'reset_atom_ids', 'momentum/chunk', 'deposit', 'dihedral_coeff', 'inversion/harmonic', 'table/rx', 'inertia/molecule', 'lj/cut/coul/long/kk', 'property/atom/kk', 'pppm', 'kolmogorov/crespi/z', 'spring/rg', 'particletemplate/sphere', 'nvt/sphere/omp', 'eam/alloy/gpu', 'lj/cut/thole/long/omp', 'smd/ulsph/strain', 'oxdna2/hbond', 'lj/class2/coul/long/kk', 'harmonic/omp', 'nve/gpu', 'coul/slater/cut', 'contour_integral', 'morse/omp', 'min_style spin', 'agni/omp', 'insert/rate/region', 'ipi', 'airebo/morse/intel', 'buck/coul/cut/omp', 'ke/atom', 'peri/lps', 'pair/gran/local', 'wall/ees', 'umbrella', 'gran/hooke/history', 'morse/smooth/linear', 'lj/smooth/linear', 'meso/move', 'rann', 'atc', 'nve/intel', 'cosine/kk', 'kolmogorov/crespi/full', 'temp/region/eff', 'rhok', 'nph/asphere', 'wall/lj93/kk', 'msd/chunk', 'opls/intel', 'then', 'ave/euler', 'run', 'smd/plastic/strain', 'yukawa', 'wall/body/polygon', 'lj/cut/tip4p/long/soft', 'cossq', 'lineforce', 'sph/idealgas', 'tgnvt/drude', 'imd', 'lj/charmm/coul/long', 'rx/kk', 'nharmonic', 'cosine/shift', 'orient/fcc', 'pppm/tip4p', 'wf/cut', 'cmap', 'nm/cut/coul/cut', 'improper_coeff', 'eam/omp', 'nm/cut/coul/long/omp', 'amoeba', 'tip4p/long/soft', 'morse', 'controller', 'spin/exchange', 'dipole', 'contact/atom', 'edip', 'mdpd/rhosum', 'wall/lj1043', 'spica/omp', 'lj/cut/coul/cut/dielectric/omp', 'nvt/manifold/rattle', 'kim', 'edip/omp', 'vacf', 'soft/omp', 'contact/atom/gran', 'units', 'qmmm', 'lj/cut/coul/wolf', 'lubricate/omp', 'exp6/rx', 'buck/coul/cut', 'coul/cut', 'move/mesh', 'comm_modify', 'lj/long/coul/long/omp', 'neb', 'erotate/sphere', 'lj/class2/omp', 'omega/chunk', 'lj/cut/coul/msm/omp', 'lj/gromacs/coul/gromacs/kk', 'sph/e/atom', 'coul/wolf/kk', 'molfile', 'born/coul/wolf/gpu', 'born/coul/wolf/cs/gpu', 'nve/body', 'amoeba/pitorsion', 'npt', 'lj/expand/omp', 'electron_integration', 'atom/swap', 'create', 'eff/cut', 'lj96/cut', 'saed/vtk', 'pace/kk', 'dsmc', 'rigid/meso', 'beck/gpu', 'coul/dsf/omp', 'rigid', 'npt/asphere', 'smd/adjust_dt', 'born/matrix', 'lj/charmmfsw/coul/charmmfsh', 'table', 'cosine/shift/exp/omp', 'langevin/kk', 'lj/expand', 'yukawa/colloid/gpu', 'insert/pack', 'rigid/small', 'newton', 'atomic_charge', 'dynamical_matrix', 'dpd/fdt/energy/kk', 'angle_style', 'eim', 'meam/sw/spline', 'cosine/shift/omp', 'variable', 'read_restart', 'mgpt', 'viscosity/cos', 'lj/gromacs', 'dpd/gpu', 'polymorphic', 'phonon', 'lj/gromacs/coul/gromacs/omp', 'cosine/periodic', 'coul/debye/omp', 'smd/tlsph/shape', 'lj/cut/coul/dsf', 'label', 'qbmsst', 'morse/opt', 'rigid/nve/omp', 'indent', 'eam', 'eos/cv', 'nb3b/harmonic', 'dpd/tstat/kk', 'gauss/gpu', 'mliap', 'polarize/bem/icc', 'oxrna2/hbond', 'property/atom', 'sw/intel', 'multisphere/single', 'bond/swap', 'nvt/asphere', 'efield', 'nm/cut', 'lj/spica/coul/long/gpu', 'mie/cut/gpu', 'adapt', 'lj/class2/coul/long/gpu', 'fe_md_boundary', 'grem', 'buck/omp', 'smd/hourglass/error', 'peri/pmb/omp', 'tersoff/mod/c/omp', 'bond/break', 'beck/omp', 'smd/plastic/strain/rate', 'append/atoms', 'lj/cubic', 'gromos/omp', 'nvt/gpu', 'nph/sphere/omp', 'ffl', 'for', 'uncompute', 'ti/spring', 'class2/p6', 'dynamical_matrix/kk', 'lj/class2/soft', 'oneway', 'nvt/uef', 'deform/kk', 'property/chunk', 'eam/fs', 'eam/gpu', 'harmonic/cut/omp', 'particledistribution/discrete/massbased', 'min_style fire/old', 'local/density', 'orient', 'msm', 'airebo/morse/omp', 'coul/cut/soft/omp', 'temp/partial', 'wall/gran/local', 'tip4p/long/soft/omp', 'lj/cut/coul/long/intel', 'wall/harmonic', 'tracker', 'coul/long', 'enforce2d/kk', 'cosine', 'harmonic/cut', 'quip', 'smd/ulsph/effm', 'morse/soft', 'vashishta', 'gravity/omp', 'delete_elements', 'lj/long/tip4p/long/omp', 'harmonic/kk', 'mesont/tpm', 'consistent_fe_initialization', 'gauss/cut', 'body/rounded/polyhedron', 'wall/reflect', 'zbl/gpu', 'yukawa/colloid/omp', 'table/gpu', 'edpd/temp/atom', 'saip/metal', 'flow/gauss', 'lj/cut/coul/long/soft', 'resquared/omp', 'heat/gran/conduction', 'lj/cut/dipole/long', 'temp', 'rates', 'temp/sphere', 'tip4p/long/omp', 'lj/cubic/gpu', 'nvt/kk', 'spin/dipole/cut', 'reaxff/species/kk', 'dipole/omp', 'drude', 'nphug', 'accelerate/cos', 'eam/opt', 'tad', 'temper/npt', 'tersoff/table', 'coul/dsf/gpu', 'gran/hooke/omp', 'smd/vol', 'buck/long/coul/long/omp', 'lj/sf/dipole/sf/omp', 'replicate', 'npt/body', 'mol/swap', 'gyration/shape/chunk', 'ilp/graphene/hbn', 'colloid', 'mass', 'nm/cut/coul/long', 'lj/cut/coul/cut/gpu', 'cluster/atom', 'property/global', 'numdiff/virial', 'insert/stream', 'nvt', 'lj/charmm/coul/long/soft', 'ring/omp', 'lj/cut/dipole/cut/omp', 'airebo/morse', 'initial', 'min_style quickmin', 'viscous/sphere', 'nve/dotc/langevin', 'zero', 'viscosity', 'gcmc', 'momb', 'buck/coul/long/intel', 'mvv/dpd', 'read', 'msd/molecule', 'tersoff/intel', 'coul/tt', 'molecule', 'momentum', 'hexorder/atom', 'lj/cut/coul/dsf/gpu', 'lj/charmm/coul/charmm/implicit/omp', 'tersoff/table/omp', 'reaxff', 'widom', 'mdi/qm', 'nve/sphere/kk', 'hbond/dreiding/morse/omp', 'ttm/grid', 'delete_bonds', 'drag', 'PI', 'tip4p/cut', 'sph/rhosum', 'nonlinear/omp', 'tune/kspace', 'write_coeff', 'lj/cut/coul/cut/omp', 'reset_time', 'reaxff/bonds/kk', 'poisson_solver', 'coul/long/cs/gpu', 'spring', 'opls/omp', 'print', 'lj/expand/gpu', 'morse/gpu', 'srd', 'cosine/delta', 'nve/awpmd', 'nph/asphere/omp', 'mdi', 'add_to_nodeset', 'lj/cut/tip4p/long/gpu', 'distance', 'mdpd', 'cnp/atom', 'smd', 'ehex', 'lj/class2/coul/long/omp', 'lj/cut/coul/cut/soft/omp', 'brownian/omp', 'buck/coul/cut/intel', 'drip', 'ave/atom', 'smd/hertz', 'quadrature', 'fene/nm', 'reference_potential_energy', 'nvt/omp', 'soft/gpu', 'sw/omp', 'quartic', 'oxdna2/fene', 'min_modify', 'material', 'sw/angle/table', 'sph/density/summation', 'plasticity/atom', 'cosine/omp', 'coul/cut/dielectric', 'coul/msm/omp', 'enforce2d', 'quadratic', 'kspace_modify', 'smd/contact/radius', 'class2/kk', 'lj/smooth/gpu', 'coul/long/omp', 'temp/body', 'shardlow/kk', 'fields', 'global/atom', 'oxdna2/excv', 'class2/omp', 'wall/reflect/kk', 'temp/uef', 'temp/com', 'create_box', 'lj/relres/omp', 'origin', 'nvt/body', 'python/move', 'lj/class2/coul/cut/kk', 'cvff', 'temp/rescale', 'EDGE', 'rigid/npt', 'fene', 'multi/lucy', 'fep', 'mass_matrix', 'qeq/comb', 'oxdna2/stk', 'bpm/spring', 'add_species', 'atom_modify', 'tersoff/mod/omp', 'stress/cylinder', 'angle', 'nvt/intel', 'source', 'lj/long/tip4p/long', 'sph/density/continuity', 'nve/manifold/rattle', 'smd/setvel', 'create_bonds', 'cosine/squared/omp', 'meam/spline', 'coul/cut/omp/global', 'list', 'group', 'spring/self', 'dpd', 'pour', 'peri/ves', 'qeq/dynamic', 'harmonic/intel', 'erotate/superquadric', 'particledistribution/discrete', 'displace_atoms', 'pppm/cg', 'volume_integral', 'cossq/omp', 'move', 'bond_style', 'nve/sphere', 'python/invoke', 'output', 'opls/kk', 'region', 'eam/alloy/omp', 'temp/csvr', 'ewald', 'efield/atom', 'press/berendsen', 'pimd', 'nph/body', 'torque/chunk', 'addtorque', 'lj/charmm/coul/charmm/intel', 'pace', 'rx', 'langevin/eff', 'sample_frequency', 'meam/kk', 'sw', 'charmmfsw', 'polarize/bem/gmres', 'write_data', 'smd/integrate_tlsph', 'ave/chunk', 'vector', 'lj/smooth', 'born/coul/dsf/cs', 'dpd/ext/tstat/kk', 'include', 'saed', 'lubricate/poly/omp', 'dpd/ext/tstat', 'lj/cut/coul/debye/kk', 'buck/intel', 'gauss/omp', 'hybrid/overlay/kk', 'erotate/sphere/atom', 'langevin', 'lj/cut/coul/cut/kk', 'snap/kk', 'poems', 'line/lj', 'yukawa/kk', 'sdpd/taitwater/isothermal', 'freeze', 'smd/ulsph/stress', 'sph/lj', 'table/cut', 'nve/dot', 'temperature_definition', 'python', 'pppm/disp/tip4p', 'lj/class2/coul/long', 'body/nparticle', 'nvt/sllod/omp', 'particletemplate/superquadric', 'tip4p/long', 'nve/noforce', 'beck', 'planeforce', 'change_box', 'born/coul/long/gpu', 'lj/cut/tip4p/cut/omp', 'h5md', 'lj/charmm/coul/charmm/gpu', 'kernel', 'nve/spin', 'eam/cd/old', 'born/coul/msm', 'lj/mdf', 'lj/long/coul/long/intel', 'eam/alloy', 'lj/switch3/coulgauss/long', 'sph', 'particledistribution/discrete/numberbased', 'rigid/nve', 'displace/atom', 'basal/atom', 'nve/sphere/omp', 'charmm/kk', 'improper', 'hdnnp', 'ave/spatial', 'lubricate', 'coul/long/gpu', 'buck/coul/msm/omp', 'lj/spica', 'eam/he', 'fix_modify', 'oxdna2/xstk', 'erotate', 'balance', 'lj/cut/gpu', 'mm3', 'dump', 'mie/cut', 'nph/kk', 'reaxff/species', 'ewald/disp', 'cosine/periodic/omp', 'nve/tri', 'event/displace', 'umbrella/omp', 'airebo', 'lb/viscous', 'npt/omp', 'dpd/ext', 'rigid/nvt/omp', 'image', 'sph/taitwater', 'snav/atom', 'fourier/intel', 'lj/long/coul/long/opt', 'hyper/local', 'lj/expand/coul/long', 'harmonic/shift/omp', 'store/force', 'npt/intel', 'tersoff/gpu', 'lj/gromacs/gpu', 'pe', 'true', 'erotate/multisphere', 'helix/omp', 'buck/coul/long/kk', 'nphug/omp', 'mesocnt', 'prd', 'read_data', 'oxdna/fene', 'pair_coeff', 'tersoff/mod', 'lj/class2', 'buck/coul/cut/gpu', 'lj/cut/intel', 'born/coul/wolf', 'lj/long/dipole/long', 'nvt/sllod', 'lj/cut', 'jump', 'eam/alloy/opt', 'bond_write', 'entropy/atom', 'brownian/poly', 'hybrid/scaled', 'msm/cg', 'tersoff', 'momentum/kk', 'wall/srd', 'neighbor', 'write_restart', 'lj/class2/kk', 'nve/asphere', 'dpd/intel', 'opls', 'eam/kk', 'eam/intel', 'spherical', 'comb/omp', 'min_style spin/cg', 'velocity', 'restrain', 'deform', 'fene/kk', 'coul/slater', 'echo', 'clear', 'eam/alloy/kk', 'write_atom_weights', 'multi/lucy/rx', 'chunk/spread/atom', 'lj/cut/coul/wolf/omp', 'dpd/energy', 'nve/asphere/intel', 'multi/harmonic/omp', 'evaporate', 'lj/class2/coul/long/soft', 'ave/histo', 'dielectric', 'boundary', 'sph/heatconduction', 'pair_style', 'lj/charmm/coul/long/gpu', 'restart', 'vashishta/kk', 'lj/cut/coul/long/opt', 'qeq/slater', 'remove_molecule', 'nve/superquadric', 'lj/spica/coul/msm', 'sph/stationary', 'pe/atom', 'lj/cut/tip4p/long/omp', 'fragment/atom', 'shake', 'exp6/rx/kk', 'brownian/poly/omp', 'dpd/ext/kk', 'temp/cs', 'coul/diel/omp', 'npt/sphere/omp', 'edpd', 'bond/local', 'smd/integrate_ulsph', 'heat/flux', 'shardlow', 'zbl', 'hbond/dreiding/morse', 'on', 'atom_style', 'harmonic', 'fene/expand/omp', 'equilibrium_start', 'born/omp', 'addforce', 'ti', 'temp/rescale/eff', 'snad/atom', 'lj/cut/coul/cut', 'latte', 'type', 'delete_atoms', 'timestep', 'smd/tlsph/strain/rate', 'wall/piston', 'spin', 'gayberne/gpu', 'smd/tlsph', 'slice', 'born/coul/wolf/omp', 'cosine/squared', 'lj/cut/coul/msm/dielectric', 'create_elementset', 'agni', 'dpd/fdt/energy', 'property/molecule', 'dihedral', 'ke', 'nm/cut/coul/cut/omp', 'lj/sf/dipole/sf/gpu', 'lj/cut/coul/dsf/kk', 'coul/debye/gpu', 'min_style cg', 'gyration/shape', 'time_integration', 'dpd/atom', 'tersoff/omp', 'gw', 'improper_style', 'plane', 'lj/cut/soft/omp', 'set', 'lj/cut/tip4p/long/soft/omp', 'mask_direction', 'coul/dsf/kk', 'exchange', 'temp/asphere', 'lj/cut/coul/long/gpu', 'born', 'fix_flux', 'lj/charmm/coul/long/intel', 'spin/dmi', 'box/relax', 'elif', 'charmm', 'ufm', 'class2', 'quartic/omp', 'box', 'info', 'gyration', 'couple/cfd', 'spring/chunk', 'tip4p/cut/omp', 'sna/atom', 'undump', 'nve', 'lattice', 'qeq/reaxff', 'qtb', 'wall/reflect/stochastic', 'gyration/molecule', 'buck/coul/long', 'nparticles/tracer/region', 'fourier', 'timer', 'gran/hertz/history', 'smd/wall_surface', 'soft', 'lj/spica/coul/long', 'cvff/omp', 'com/molecule', 'angle_coeff', 'lubricate/poly', 'lj/cut/tip4p/long', 'lj/charmm/coul/charmm/implicit/kk', 'lj/cut/coul/long', 'spin/neel', 'msd/nongauss', 'charmm/omp', 'INF', 'oxrna2/stk', 'massflow/mesh', 'reduce/region', 'lj/cut/coul/debye/dielectric', 'lj/class2/coul/cut', 'npt/asphere/omp', 'create_atoms', 'comb', 'bond/create', 'langevin/spin', 'hyper/global', 'lj/expand/kk', 'boundary_dynamics', 'lj/cut/tip4p/cut', 'package', 'bpm/rotational', 'third_order', 'lj/expand/coul/long/gpu', 'coul/long/kk', 'lj/smooth/omp', 'write', 'buck/mdf', 'coul/dsf', 'coord/atom/kk', 'property/atom/tracer', 'eos/table/rx', 'ave/sphere/atom', 'communicate', 'nodeset', 'comb3', 'dihedral_style', 'buck/coul/long/omp', 'coord/gran', 'sph/pressure', 'acks2/reaxff/kk', 'tfmc', 'electron/stopping', 'extep', 'rigid/small/omp', 'xrd', 'orientorder/atom/kk', 'dpd/energy/kk', 'add_molecule', 'spin/magelec', 'distharm', 'stress/atom', 'rigid/nph/omp', 'cosine/shift/exp', 'qeq/shielded', 'rigid/omp', 'dpd/omp', 'log', 'cosine/delta/omp', 'property/local', 'ke/rigid', 'acks2/reaxff', 'shell', 'hyper', 'reduce', 'coul/exclude', 'centro/atom', 'eam/alloy/intel', 'yukawa/omp', 'no', 'dipole/chunk', 'next', 'fene/omp', 'coul/cut/gpu', 'temp/profile', 'zbl/omp', 'remove_source', 'reset_mol_ids', 'adp/omp', 'ptm/atom', 'rattle', 'fourier/simple', 'cvff/intel', 'coul/debye/kk', 'sw/gpu', 'none', 'ave/correlate/long', 'inertia/chunk', 'born/gpu', 'lj/sf/dipole/sf', 'npt/cauchy', 'tmd', 'lj/cut/dipole/long/gpu', 'drude/transform/direct', 'oxrna2/coaxstk', 'nvt/asphere/omp', 'ufm/omp', 'heat/flux/tally', 'oxdna/excv', 'ufm/opt', 'gran/hooke/history/omp', 'nonlinear', 'lj/spica/gpu', 'vashishta/omp', 'npt/gpu', 'atm', 'smd/tlsph/dt', 'edpd/source', 'numdiff', 'thermo_style', 'lj/cubic/omp', 'recenter', 'table/kk', 'brownian/sphere', 'multicontact/halfspace', 'lj/charmm/coul/msm/omp', 'lb/fluid', 'thermal/conductivity', 'coord/atom', 'tri/lj', 'eos/table', 'processors', 'scale', 'lj/cut/omp', 'adp', 'nharmonic/omp', 'nvt/sllod/eff', 'oxdna2/coaxstk', 'ackland/atom', 'lj/gromacs/kk', 'nvt/eff', 'erotate/rigid', 'mesont', 'born/coul/msm/omp', 'labelmap', 'born/coul/long/omp', 'gran/hertz/history/omp', 'tersoff/kk', 'create_nodeset', 'decomposition', 'bop', 'reduce/chunk', 'sw/kk', 'property/atom/regiontracer/time', 'temp/region', 'reset_atomic_reference_positions', 'lj96/cut/omp', 'buck/coul/long/gpu', 'quadratic/omp', 'resquared/gpu', 'dt/reset', 'atom_weight', 'nvk', 'nve/limit', 'unfix_flux', 'ufm/gpu', 'fourier/omp', 'comm_style', 'rigid/nvt', 'chunk/atom', 'vashishta/table', 'nph/sphere', 'sph/t/atom', 'mscg', 'filter/corotate', 'temper/grem', 'min_style hftn', 'npt/kk', 'dpd/tstat/omp', 'dilatation/atom', 'buck6d/coul/gauss/dsf', 'mesh/surface/planar', 'langevin/drude', 'fourier/simple/omp', 'lj/smooth/linear/omp', 'dpd/tstat/gpu', 'nm/cut/omp', 'pair_interactions', 'lj/cut/tip4p/long/opt', 'netcdf', 'remove_species', 'eos/table/rx/kk', 'smatb', 'table/rx/kk', 'neighbor_skin', 'ilp/tmd', 'hma', 'buck/coul/cut/kk', 'buck/kk', 'ave/time', 'quit', 'gran/hooke/history/kk', 'harmonic/shift/cut', 'coul/wolf/cs', 'thermo_modify', 'coul/debye', 'tersoff/zbl/kk', 'gyration/chunk', 'lj/class2/coul/cut/omp', 'particletemplate/multisphere', 'oxdna/stk', 'rerun', 'fix', 'rigid/nvt/small', 'viscous', 'atom_element_map', 'temp/kk', 'born/coul/long', 'wall/gran', 'wall/region/sph', 'pe/mol/tally', 'wall/lj126', 'charmm/intel', 'temp/berendsen', 'else', 'gayberne/intel', 'false', 'oxrna2/xstk', 'wall/colloid', 'improper/local', 'npt/sphere', 'internal_quadrature', 'nve/eff', 'gromos'],

  typeKeywords: [],

  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
    '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
    '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
    '%=', '<<=', '>>=', '>>>='
  ],

  // we include these common regular expressions
  symbols:  /[=><!~?:&|+\-*/^%]+/,

  // C# style strings
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  // The main tokenizer for our languages
  tokenizer: {
    root: [
      // identifiers and keywords
      [/[a-z_$][\w$]*/, { cases: { '@typeKeywords': 'keyword',
                                   '@keywords': 'keyword',
                                   '@default': 'identifier' } }],
      // [/[A-Z][\w\$]*/, 'type.identifier' ],  // to show class names nicely

      // whitespace
      { include: '@whitespace' },

      // delimiters and operators
      [/[{}()[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, { cases: { '@operators': 'operator',
                              '@default'  : '' } } ],

      // @ annotations.
      // As an example, we emit a debugging log message on these tokens.
      // Note: message are supressed during the first load -- change some lines to see them.
      
      // numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],

      // strings
      [/"([^"\\]|\\.)*$/, 'string.invalid' ],  // non-teminated string
      [/"/,  { token: 'string.quote', bracket: '@open', next: '@string' } ],

      // characters
      [/'[^\\']'/, 'string'],
      [/(')(@escapes)(')/, ['string','string.escape','string']],
      [/'/, 'string.invalid']
    ],

    comment: [
      [/[^/*]+/, 'comment' ],
      [/\/\*/,    'comment', '@push' ],    // nested comment
      ["\\*/",    'comment', '@pop'  ],
      [/[/*]/,   'comment' ],
      [/^#/,   'comment' ]
    ],

    string: [
      [/[^\\"]+/,  'string'],
      [/@escapes/, 'string.escape'],
      [/\\./,      'string.escape.invalid'],
      [/"/,        { token: 'string.quote', bracket: '@close', next: '@pop' } ]
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\*/,       'comment', '@comment' ],
      [/\/\/.*$/,    'comment'],
    ],
  },
})

const Edit = () => {
  const selectedFile = useStoreState(state => state.simulation.selectedFile)
  const simulation =  useStoreState(state => state.simulation.simulation)
  const options = {
    selectOnLineNumbers: true
  };

  const editorDidMount = useCallback( (editor: any, monaco: any) => {
    editor.focus();
  }, [])

  const onEditorChange = useCallback( (newValue: string, e: any) => {
    // console.log('onChange', newValue, e);
    const file = simulation?.files.filter(file => file.fileName === selectedFile?.fileName)[0]
    if (file) {
      file.content=newValue
    }
  }, [selectedFile?.fileName, simulation?.files])

  if (!selectedFile) {
    return (<>No file selected</>)
  } 

  return (
    <MonacoEditor
      height="100vh"
      language="lammps"
      theme="vs-dark"
      value={selectedFile.content}
      options={options}
      onChange={onEditorChange}
      editorDidMount={editorDidMount}
    />
  )
}
export default Edit