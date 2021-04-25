#!/bin/bash
cp mpi.cpp lammps/src/mpi.cpp
cp atomify.cpp lammps/src/atomify.cpp
cp lammps/src/STUBS/mpi.h lammps/src/mpi.h
make -j8
cp lammps.wasm ../src/wasm/
cp lammps.js ../src/wasm/