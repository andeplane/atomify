# Atomify API

Backend API service for Atomify - a molecular dynamics visualization tool.

## Development

```bash
# Install dependencies
uv sync --all-extras

# Run development server
uv run uvicorn atomify_api.main:app --reload --host 0.0.0.0 --port 8000

# Run type checker
uv run ty check src/

# Run tests
uv run pytest

# Run linter
uv run ruff check src/
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` - SQLite database path
- `FIREBASE_PROJECT_ID` - Firebase project ID  
- `GCS_BUCKET_NAME` - Google Cloud Storage bucket name
- `CORS_ORIGINS` - Comma-separated list of allowed origins

