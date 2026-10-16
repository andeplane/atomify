"""Syntax-check the code cells of the starter notebook template (ADR-002 §2).

The template is shipped as data (src/notebooks/analysis.template.ipynb), so
no TypeScript test can catch a Python typo in it. IPython magics and shell
escapes (lines starting with % or !) are skipped. Top-level `await` is
allowed: the Pyodide kernel supports it.
"""

import ast
import json
import sys

DEFAULT = "src/notebooks/analysis.template.ipynb"


def main(path: str) -> int:
    with open(path, encoding="utf-8") as f:
        notebook = json.load(f)
    failures = 0
    for index, cell in enumerate(notebook["cells"]):
        if cell["cell_type"] != "code":
            continue
        source = cell["source"]
        if isinstance(source, list):
            source = "".join(source)
        code = "\n".join(
            "" if line.lstrip().startswith(("%", "!")) else line
            for line in source.splitlines()
        )
        try:
            compile(code, f"{path}[cell {index}]", "exec",
                    flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
        except SyntaxError as error:
            print(f"cell {index}: {error}", file=sys.stderr)
            failures += 1
    if failures == 0:
        print(f"{path}: all code cells compile")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else DEFAULT))
