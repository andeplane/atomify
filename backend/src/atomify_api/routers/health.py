"""Health check endpoint for Cloud Run and load balancers."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint - no authentication required."""
    return {"status": "healthy"}


@router.get("/ready")
async def readiness_check() -> dict[str, str]:
    """Readiness check - verifies service is ready to accept traffic."""
    # TODO: Add database connectivity check
    return {"status": "ready"}

