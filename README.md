# Atomify - a real time LAMMPS visualizer on the web
[![Deploy](https://github.com/andeplane/atomify/actions/workflows/deploy.yaml/badge.svg?branch=main)](https://github.com/andeplane/atomify/actions/workflows/deploy.yaml)

## ⚛️ Try it in your browser ⚛️

➡️ **https://andeplane.github.io/atomify**

➡️ **[Customize content for e.g. teaching (takes 2 minutes)](https://github.com/andeplane/atomify-examples-template)**

![Atomify](atomify.gif)

The typical workflow when developing scripts for LAMMPS includes working with several programs. A text editor is needed to modify the scripts, the terminal to run LAMMPS, and programs like VMD or Ovito reading trajectories from a file dumped to the disk to visualize the system over time. If physical quantities are computed with LAMMPS, the data is often plotted with MATLAB or Python. This is a tedious process, especially for teaching purposes and for people who are new to LAMMPS. 

We here introduce Atomify, a web editor running LAMMPS with real time visualization with stunning graphics. After a simulation is finished, all files are available in a jupyter notebook that also runs in the browser. Atomify will soon also support real time plotting of LAMMPS variables and computes.

## How does it work?
LAMMPS is compiled to [Webassembly](https://webassembly.org/) using [Emscripten](https://emscripten.org/) so it can run in the browser. It runs with about 50% of the speed of natively compiled LAMMPS (single threaded). The visualization is built on top of [three.js](https://threejs.org/). The Jupyter notebook is called [Jupyterlite](https://jupyterlite.readthedocs.io/) and is a version of Python running entirely on the web thanks to [Pyodide](https://pyodide.org/en/stable/).

## Customize example simulations
You can use this [Github template](https://github.com/andeplane/atomify-examples-template) to create your own set of simulations and Jupyter notebook analysis using Atomify. This does not require your own build or deployment of Atomify.

## How to build and run locally
### Prerequisites
 - [NodeJS](https://nodejs.org/en/) to install packages and run locally
 - [Emscripten](https://emscripten.org/) to compile LAMMPS to webassembly (optional)
 - [Python](https://www.python.org/) to run build script (optional)

### Run locally
Clone the repository

`git clone https://github.com/andeplane/atomify`

Install packages with NPM

`npm install`

### Compile LAMMPS (Optional if you don't need to modify LAMMPS installation)
Ensure that `em++` is in your path.
```
cd cpp
python build.py
cd ..
```
### Run locally

`npm run start`
and open http://localhost:3000/atomify/ (remember the slash at the end)
