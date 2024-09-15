# Atomify - real time molecular dynamics simulations in the browser

[![Deploy](https://github.com/andeplane/atomify/actions/workflows/deploy.yaml/badge.svg?branch=main)](https://github.com/andeplane/atomify/actions/workflows/deploy.yaml)

TL;DR:

- Run molecular dynamics (LAMMPS) in the browser
- Upload your own scripts or run one of the built-in examples
- Watch the simulation while it happens and view plots of real time physical quantities such as temperature and pressure
- Analyze the simulation in a Jupyter notebook

## ⚛️ Try it in your browser ⚛️

➡️ **https://andeplane.github.io/atomify**

➡️ **[Customize Atomify with your own simulations for e.g. teaching](https://github.com/andeplane/atomify-examples-template)** (this only takes a few minutes if you have simulations).

To see the latest changes, please check the [change log](CHANGELOG.md).

![Atomify](atomify.gif)

The typical workflow when developing scripts for LAMMPS includes working with several programs. A text editor is needed to modify the scripts, the terminal to run LAMMPS, and programs like VMD or Ovito reading trajectories from a file dumped to the disk to visualize the system over time. If physical quantities are computed with LAMMPS, the data is often plotted with MATLAB or Python. This is a tedious process, especially for teaching purposes and for people who are new to LAMMPS.

We here introduce Atomify, a web editor running LAMMPS with real time visualization with stunning graphics, access to real time plotting of physical quantities and much more. After a simulation is finished, all files are available in a jupyter notebook that also runs in the browser.

## How does it work?

LAMMPS is compiled to [Webassembly](https://webassembly.org/) using [Emscripten](https://emscripten.org/) so it can run in the browser. It runs with about 50% of the speed of natively compiled LAMMPS (single threaded). The visualization is built on top of [three.js](https://threejs.org/), with specialized high performance rendering of spheres and cylinders. The Jupyter notebook is [Jupyterlite](https://jupyterlite.readthedocs.io/), and uses [Pyodide](https://pyodide.org/en/stable/), a Python runtime running entirely in the browser.

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

### Compile LAMMPS (Optional: if you don't need to modify LAMMPS installation)

Ensure that `em++` is in your path.

```
cd cpp
python build.py
cd ..
```

### Install JupyterLite (Optional: if you need Jupyter notebooks when running locally)

Create an empty Python environment (Python 3.12 is recommended)
Install packages

```
pip install -r jupyterlite/requirements.txt
```

Build JupyterLite

```
jupyter lite build --contents jupyterlite/content --output-dir public/jupyter
```

### Run locally

`npm run start`
and open http://localhost:3000/atomify/ (remember the slash at the end)
