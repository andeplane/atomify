const AnalyzeNotebook = (simulationId: string) => {
  const notebook = 
  {
    "metadata": {
      "language_info": {
        "codemirror_mode": {
          "name": "python",
          "version": 3
        },
        "file_extension": ".py",
        "mimetype": "text/x-python",
        "name": "python",
        "nbconvert_exporter": "python",
        "pygments_lexer": "ipython3",
        "version": "3.8"
      },
      "kernelspec": {
        "name": "python",
        "display_name": "Python (Pyodide)",
        "language": "python"
      }
    },
    "nbformat_minor": 4,
    "nbformat": 4,
    "cells": [
      {
        "cell_type": "code",
        "source": "import piplite\nawait piplite.install(['atomify-lammps-logfile'])",
        "metadata": {
          "trusted": true
        },
        "execution_count": null,
        "outputs": []
      },
      {
        "cell_type": "code",
        "source": "import lammps_logfile\n\nlog = lammps_logfile.File(\"###SIMULATIONID###/log.lammps\")\n\nt = log.get(\"Step\")\ntemp = log.get(\"Temp\")\n\nimport matplotlib.pyplot as plt\nplt.plot(t, temp, label=\"Temperature\")\nplt.xlabel('Timestep')\nplt.title(\"Temperature over time\")\nplt.show()",
        "metadata": {
          "trusted": true
        },
        "execution_count": null,
        "outputs": []
      }
    ]
  }
  notebook["cells"][1]["source"] = notebook["cells"][1]["source"].replace("###SIMULATIONID###", simulationId)
  return notebook
}

export default AnalyzeNotebook