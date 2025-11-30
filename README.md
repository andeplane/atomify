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

## Atomify Commands

Atomify supports special commands that can be added as comments in your LAMMPS input scripts to control visualization and rendering. These commands start with `#/` and are processed by Atomify to enhance the visual representation of your simulation.

### Atom Styling

**Set atom type with element name (automatic coloring):**
```
#/atom <type> <element_name>
```
Assigns an element name to an atom type. Atomify will automatically use the standard color and radius for that element.

Example:
```
#/atom 1 oxygen
#/atom 2 hydrogen
```

**Set atom type with custom radius and color:**
```
#/atom <type> <radius> #RRGGBB
```
Sets a custom radius and color (in hexadecimal format) for an atom type.

Example:
```
#/atom 1 2.0 #ff0000
#/atom 2 1.5 #0000ff
```

### Dynamic Bonds

**Create bonds between atom types:**
```
#/bond <type1> <type2> <distance>
```
Creates dynamic bonds between atoms of `type1` and `type2` if they are within the specified `distance`.

Example:
```
#/bond 1 2 2.0
#/bond 1 1 1.7
```

### Camera Control

**Set initial camera position:**
```
#/camera position <x> <y> <z>
```
Sets the initial position of the camera in 3D space.

Example:
```
#/camera position 50 40 100
```

**Set camera target:**
```
#/camera target <x> <y> <z>
```
Sets the point in 3D space that the camera looks at.

Example:
```
#/camera target 25 25 25
```

### Usage Example

Here's a complete example showing how to use Atomify commands in a LAMMPS input script:

```
# Atomify commands
#/camera position 60 50 80
#/camera target 20 20 20
#/atom 1 oxygen
#/atom 2 hydrogen
#/bond 1 2 2.0

# Regular LAMMPS commands
units metal
dimension 3
boundary p p p
# ... rest of your LAMMPS script
```

These commands are ignored by LAMMPS itself (since they're comments) but are processed by Atomify to improve visualization.

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
