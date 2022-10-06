# Run lammps using the following 3 commands:
# (assuming "lmp_mpi" is the name of your LAMMPS binary)

mpirun -n 4 lmp_mpi -i run.in.min
mpirun -n 4 lmp_mpi -i run.in.stage1
mpirun -n 4 lmp_mpi -i run.in.stage2

