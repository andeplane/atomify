# Atomify Embedding

Atomify now supports embedding simulations directly in web pages using base64-encoded simulation data. This allows you to share complete simulations (including all required files) through a single URL parameter.

## How it Works

The embedding system uses a protobuf-like schema to serialize simulation data into a compact base64 format that can be passed as a URL parameter. This includes:

- Simulation metadata (id, title, description, keywords)
- All simulation files (LAMMPS input scripts, data files, force field files, etc.)
- Analysis descriptions and Jupyter notebooks

## Usage

### Basic Usage

To embed a simulation, add the `embeddedSimulationData` parameter to the Atomify URL:

```
https://your-atomify-host.com/?embeddedSimulationData=<base64-encoded-simulation>
```

### Creating Embedded Simulations

#### From Scratch

```typescript
import { createSimulationDataFromFiles, generateEmbeddedUrl } from './utils/embedding';

const lammpsScript = `
# Simple LJ particles simulation
units lj
atom_style atomic
dimension 3
boundary p p p

region box block 0 10 0 10 0 10
create_box 1 box
create_atoms 1 random 100 12345 box

mass 1 1.0
pair_style lj/cut 2.5
pair_coeff 1 1 1.0 1.0 2.5

velocity all create 1.0 12345

neighbor 0.3 bin
neigh_modify delay 0 every 20 check no

thermo 100
run 1000
`;

const simulationData = createSimulationDataFromFiles(
  'simple-lj',
  'Simple LJ Particles',
  'A basic simulation of Lennard-Jones particles.',
  'simple.in',
  {
    'simple.in': lammpsScript
  },
  {
    keywords: ['lennard jones', 'basic'],
    analysisDescription: '# Simple LJ Simulation\nThis is a basic example.'
  }
);

const embeddedUrl = generateEmbeddedUrl('https://your-atomify-host.com', simulationData);
```

#### From Existing Atomify Simulation

```typescript
import { generateEmbeddedUrlFromAtomifySimulation } from './utils/embedding';

const existingSimulation = {
  id: "diffusion",
  title: "Diffusion",
  description: "Measure diffusion coefficient using MSD.",
  inputScript: "simple_diffusion.in",
  keywords: ["lennard jones", "diffusion"],
  files: [
    {
      fileName: "simple_diffusion.in",
      url: "examples/diffusion/diffusion/simple_diffusion.in"
    }
  ]
};

const embeddedUrl = await generateEmbeddedUrlFromAtomifySimulation(
  'https://your-atomify-host.com', 
  existingSimulation
);
```

## Features

- **Complete simulation packaging**: All files are embedded, no external dependencies
- **Automatic loading**: Simulations start automatically when the embedded URL is accessed
- **No network requests**: All simulation data is self-contained in the URL
- **Compatible with existing features**: Analysis notebooks, multiple files, etc.

## URL Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| `embeddedSimulationData` | Base64-encoded simulation data | Yes (for base64 embedding) |
| `embeddedSimulationUrl` | URL to examples JSON (legacy) | No |
| `simulationIndex` | Index in examples array (legacy) | No |

## Schema

The embedding uses the following schema structure:

```typescript
interface SimulationData {
  id: string;
  title: string;
  description: string;
  analysisDescription?: string;
  analysisScript?: string;
  inputScript: string;
  keywords: string[];
  files: { [key: string]: SimulationFile };
}

interface SimulationFile {
  content?: 
    | { $case: 'text'; text: string }
    | { $case: 'data'; data: Uint8Array };
}
```

## Backwards Compatibility

The original embedding method using `embeddedSimulationUrl` and `simulationIndex` parameters is still supported for backwards compatibility.

## Browser Console Utility

When you have a simulation loaded in Atomify, you can generate an embedded URL directly from the browser console:

```javascript
// In the browser console while a simulation is loaded:
const embeddedUrl = window.generateEmbeddedUrl();
// This will log the embedded URL and return it
```

## Complete Example

Here's a complete example showing how to create and use an embedded simulation:

```javascript
// 1. Create a simple simulation in the browser console
const createSimulationDataFromFiles = window.createSimulationDataFromFiles;
const generateEmbeddedUrl = window.generateEmbeddedUrlFn;

const lammpsScript = `
units lj
atom_style atomic
dimension 3
boundary p p p

region box block 0 10 0 10 0 10
create_box 1 box
create_atoms 1 random 100 12345 box

mass 1 1.0
pair_style lj/cut 2.5
pair_coeff 1 1 1.0 1.0 2.5

velocity all create 1.0 12345
neighbor 0.3 bin
neigh_modify delay 0 every 20 check no

thermo 100
run 1000
`;

const simulationData = createSimulationDataFromFiles(
  'demo-lj',
  'Demo LJ Particles',
  'A demonstration of Lennard-Jones particles.',
  'demo.in',
  { 'demo.in': lammpsScript },
  { keywords: ['demo', 'lennard jones'] }
);

const embeddedUrl = generateEmbeddedUrl(window.location.origin, simulationData);
console.log('Embedded URL:', embeddedUrl);

// 2. Copy the URL and paste it in a new browser tab
// 3. The simulation will automatically load and start
```

## Integration in External Websites

To embed Atomify simulations in external websites, you can create embedded URLs and use them in iframes:

```html
<iframe 
  src="https://atomify.com/?embeddedSimulationData=<your-base64-data>"
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

When accessed, embedded URLs will automatically load and start the simulation in an optimized embedded view.