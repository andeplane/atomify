# You would probably run lammps this way:
#
# lmp_ubuntu -i run.in.nvt

# The files "run.in.min", and "run.in.nvt" are LAMMPS input scripts which refer
# to the input scripts & data files you created earlier when you ran moltemplate
# system.in.init, system.in.settings, system.data


# -----------------------------------

LAMMPS_COMMAND="lmp_mpi"

# Here "$LAMMPS_BINARY" is the name of the command you use to invoke lammps
# (such as lmp_ubuntu, lmp_mac_mpi, lmp_cygwin etc...).  Change if necessary.

# Run lammps using the following 3 commands:

"$LAMMPS_COMMAND" -i run.in.min              # minimize         (OPTIONAL)
"$LAMMPS_COMMAND" -i run_short_sim.in.nvt    # production run

