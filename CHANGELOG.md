# Change Log

## [0.4.5] Nov 1st 2022
- Added feature to create new simulations where you can upload your own files
- Added plotting of computes (e.g. kinetic energy vs time or compute RDF)
- Fixed so sidebar can be collapsed on mobile devices
- Fixed so modifier active state is preserved when simulation summary is reopened

## [0.4.3] Oct 29th 2022
- Showing modifiers (syncing of particles and bonds etc) in simulation summary
- Can click example images to start example
- Can color atoms by per atom compute (kinetic energy etc)

## [0.4.2] Oct 27th 2022
- Added simulation summary sidebar
- Added simulation summary overlay
- Added Voro++ package to LAMMPS
- If analysis notebook is specified in the example, open it directly when Notebook is clicked
- Removed simd optimization since this breaks on Safari (both Mac and iOS)

## [0.4.1] Oct 19th 2022
- Added support for ## [customizing simulations](https://github.com/andeplane/atomify-examples-template)
- Improved example grid rendering

## [0.3.1] Oct 18th 2022
- Added JupyterLite for post simulation analysis
- Only sync particles and bonds when View is active
- Improved light settings

## [0.2.1] Oct 17th 2022
- Added new example simulations
- Added SSAO support for improved rendering
- Added render settings
- Added progressbar during simulation
- Adjusted default size on particles and bonds
- Syncing with LAMMPS during energy minimization
- Fixed bad coloring when LAMMPS changes ordering of atoms

## [0.1.5] Oct 16th 2022
- Showing last LAMMPS command in error 
- UI is more mobile friendly
- Showing console after simulation is finished

## [0.1.4] Oct 15th 2022
- Added stop button
- Added console to show LAMMPS output
- Handling exceptions from LAMMPS to show command errors

## [0.1.3] Oct 10th 2022
- Added rendering of dynamic bonds using LAMMPS neighbor lists
- Fixed canvas size

## [0.1.2] Oct 4rd 2022
- Can browse GitHub tree and run simulations
- Using React 18
- Can modify sync frequency

## [0.1.1] Sept 18th 2022
Initial prototype with ## [OMOVI](https://github.com/andeplane/omovi) rendering data from ## [LAMMPS](https://lammps.org/) in the browser.
