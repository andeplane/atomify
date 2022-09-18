#!/bin/bash
cp mpi.cpp lammps/src/mpi.cpp
cp lammpsweb.cpp lammps/src/lammpsweb.cpp
cp fix_atomify.cpp lammps/src/
cp fix_atomify.h lammps/src/
cp lammps/src/STUBS/mpi.h lammps/src/mpi.h
make -j8
cp lammps.wasm ../src/wasm/
cp lammps.js ../src/wasm/