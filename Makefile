SHELL := bash
.ONESHELL:
.SHELLFLAGS := -eu -o pipefail -c
.DELETE_ON_ERROR:
MAKEFLAGS += --warn-undefined-variables
ARGS ?=  # Default to empty value

help: ## Show this help
	@egrep -h '(\s##\s|^[A-Z_ ]+$$|^\#\# .*)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {if ($$2) {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2} else if ($$1 ~ /^\#\# .*/) {printf "\n\033[1m%s\033[0m\n", substr($$1, 4)} else {printf "\n\033[1m%s\033[0m\n", $$1}}'

## FRONTEND

frontend-install: ## Install frontend dependencies
	cd . && npm install

frontend-start: ## Start frontend development server
	cd . && npm start

frontend-build: ## Build frontend for production
	cd . && npm run build

frontend-test: ## Run frontend tests
	cd . && npm test $(ARGS)

frontend-test-run: ## Run frontend tests once (CI mode)
	cd . && npm run test:run

frontend-typecheck: ## Run TypeScript type checking
	cd . && npm run typecheck

frontend-lint: ## Run frontend linter (prettier)
	cd . && npx prettier --check .

frontend-lint-fix: ## Fix frontend linting issues
	cd . && npx prettier --write .

## JUPYTER

JUPYTER_VENV := .venv-jupyterlite

jupyter: ## Build the JupyterLite site into public/jupyter (piplite wheels, lammps.js client, COI patch)
	test -d node_modules/lammps.js/dist || { echo "error: node_modules/lammps.js/dist is missing — run 'make frontend-install' (npm install) first" >&2; exit 1; }
	test -x $(JUPYTER_VENV)/bin/pip || python3 -m venv $(JUPYTER_VENV)
	$(JUPYTER_VENV)/bin/pip install --quiet -r jupyterlite/requirements.txt build
	rm -rf public/jupyter .jupyterlite.doit.db
	# Wheels in <repo>/pypi/ (lammps-js, lammps-logfile) are auto-indexed
	# into the piplite index because the lite dir is the repo root.
	$(JUPYTER_VENV)/bin/jupyter lite build --contents jupyterlite/content --output-dir public/jupyter
	# Notebooks import the engine from {site}/lammps/client.js; ship the whole
	# built package so its relative imports (worker, wasm modules) resolve.
	mkdir -p public/jupyter/lammps
	cp -R node_modules/lammps.js/dist/. public/jupyter/lammps/
	# Cross-origin isolation on static hosting (ADR-002 §5).
	$(JUPYTER_VENV)/bin/python scripts/jupyter_coi_patch.py public/jupyter

## DEVELOPMENT

dev-frontend: frontend-start ## Alias for frontend-start

test: frontend-test-run ## Run all tests

lint: frontend-lint ## Run all linters

lint-fix: frontend-lint-fix ## Fix all linting issues

typecheck: frontend-typecheck ## Run all type checkers

install: frontend-install ## Install all dependencies

## CI / QUALITY

ci-frontend: frontend-install frontend-typecheck frontend-lint frontend-test-run ## Run all frontend CI checks

ci: ci-frontend ## Run all CI checks

