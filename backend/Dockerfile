# syntax=docker/dockerfile:1

# Build stage
FROM python:3.12-slim AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies (no dev dependencies)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

# Copy source code
COPY src/ src/
COPY alembic.ini ./
COPY migrations/ migrations/

# Install the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev


# Runtime stage
FROM python:3.12-slim AS runtime

# Create non-root user
RUN groupadd -r atomify && useradd -r -g atomify atomify

# Set working directory
WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application code and migrations
COPY --from=builder /app/src /app/src
COPY --from=builder /app/alembic.ini /app/alembic.ini
COPY --from=builder /app/migrations /app/migrations

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Create data directory for SQLite (will be mounted as volume in Cloud Run)
RUN mkdir -p /data && chown atomify:atomify /data

# Switch to non-root user
USER atomify

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health').raise_for_status()"

# Start server
# Note: Run migrations separately before deployment (e.g., as a Cloud Run job)
# to avoid race conditions when scaling to multiple instances
CMD ["uvicorn", "atomify_api.main:app", "--host", "0.0.0.0", "--port", "8000"]

