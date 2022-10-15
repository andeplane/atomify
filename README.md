# Atomify - a real time LAMMPS visualizer on the web
[![Build](https://github.com/andeplane/atomify/actions/workflows/build.yaml/badge.svg?branch=main)](https://github.com/andeplane/atomify/actions/workflows/build.yaml)
[![Deploy](https://github.com/andeplane/atomify/actions/workflows/deploy.yaml/badge.svg?branch=main)](https://github.com/andeplane/atomify/actions/workflows/deploy.yaml)

[Try it out now.](https://andeplane.github.io/atomify/)

The typical workflow when developing scripts for LAMMPS includes working with several programs. A text editor is needed to modify the scripts, the terminal to run LAMMPS, and programs like VMD or Ovito reading trajectories from a file dumped to the disk to visualize the system over time. If physical quantities are computed with LAMMPS, the data is often plotted with MATLAB or Python. This is a tedious process, especially for teaching purposes and for people who are new to LAMMPS. 

We here introduce Atomify, a web version running LAMMPS with real time visualization with stunning graphics. Atomify will soon support live plotting of LAMMPS variables and computes and an easy to use code editor in one single web app. The latter utilizes the powerful machinery already built into LAMMPS to allow easy access to advanced physical quantities. 

## How does it work?
LAMMPS is compiled to [Webassembly](https://webassembly.org/) using [Emscripten](https://emscripten.org/) so it can run in the browser. It runs with about 50% of the speed of natively compiled LAMMPS (single threaded). The visualization is built on top of [three.js](https://threejs.org/).

## How to build and run locally
### Prerequisites
 - [Emscripten](https://emscripten.org/) to compile LAMMPS to webassembly.
 - [NodeJS](https://nodejs.org/en/) to install packages and run locally.
 - [Python](https://www.python.org/) to run build script.
### Run locally
Ensure that `em++` is in your path.

Clone the repository

`git clone https://github.com/andeplane/atomify`

Install packages with NPM

`npm install`

Compile LAMMPS (Optional if you don't need to modify LAMMPS installation)
```
cd cpp
python build.py
cd ..
```
Run locally

`npm run start`
and open http://localhost:3000/atomify/ (remember the slash at the end)