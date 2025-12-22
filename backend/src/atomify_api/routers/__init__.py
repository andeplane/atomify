"""API routers for the Atomify backend."""

from atomify_api.routers.health import router as health_router
from atomify_api.routers.test import router as test_router

__all__ = ["health_router", "test_router"]
