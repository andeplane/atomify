#!/bin/bash
cp mpi.cpp lammps/src/mpi.cpp
cp atomify.cpp lammps/src/atomify.cpp
cp fix_atomify.cpp lammps/src/fix_atomify.cpp
cp fix_atomify.h lammps/src/fix_atomify.h
cp lammps/src/STUBS/mpi.h lammps/src/mpi.h
make -j8
cp lammps.wasm ../src/wasm/
cp lammps.js ../src/wasm/