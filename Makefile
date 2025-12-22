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

## BACKEND

backend-install: ## Install backend dependencies
	cd backend && uv sync --all-extras

backend-start: ## Start backend development server
	cd backend && uv run uvicorn atomify_api.main:app --reload --host 127.0.0.1 --port 8000

backend-start-prod: ## Start backend server (production mode)
	cd backend && uv run uvicorn atomify_api.main:app --host 0.0.0.0 --port 8000

backend-test: ## Run backend tests
	cd backend && uv run pytest $(ARGS)

backend-test-verbose: ## Run backend tests with verbose output
	cd backend && uv run pytest -v $(ARGS)

backend-typecheck: ## Run backend type checking (ty)
	cd backend && uv run ty check src/

backend-lint: ## Run backend linter (ruff)
	cd backend && uv run ruff check src/

backend-lint-fix: ## Fix backend linting issues
	cd backend && uv run ruff check --fix src/

backend-format: ## Format backend code (ruff)
	cd backend && uv run ruff format src/

backend-migrate: ## Run database migrations
	cd backend && uv run alembic upgrade head

backend-migrate-create: ## Create a new migration (use ARGS="-m 'message'")
	cd backend && uv run alembic revision --autogenerate $(ARGS)

backend-db-reset: ## Reset database (WARNING: deletes all data)
	cd backend && rm -f atomify.db && uv run alembic upgrade head

## DOCKER

docker-build: ## Build backend Docker image
	cd backend && docker build -t atomify-api:latest .

docker-run: ## Run backend in Docker
	cd backend && docker run -p 8000:8000 --env-file .env atomify-api:latest

## DEVELOPMENT

dev-frontend: frontend-start ## Alias for frontend-start

dev-backend: backend-start ## Alias for backend-start

test: frontend-test-run backend-test ## Run all tests

lint: frontend-lint backend-lint ## Run all linters

lint-fix: frontend-lint-fix backend-lint-fix ## Fix all linting issues

typecheck: frontend-typecheck backend-typecheck ## Run all type checkers

install: frontend-install backend-install ## Install all dependencies

## CI / QUALITY

ci-frontend: frontend-install frontend-typecheck frontend-lint frontend-test-run ## Run all frontend CI checks

ci-backend: backend-install backend-typecheck backend-lint backend-test ## Run all backend CI checks

ci: ci-frontend ci-backend ## Run all CI checks

