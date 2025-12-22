"""Tests for health endpoints."""

import pytest
from fastapi.testclient import TestClient

from atomify_api.main import app


@pytest.fixture
def client() -> TestClient:
    """Create a test client."""
    return TestClient(app)


def test_health_check(client: TestClient) -> None:
    """Test health endpoint returns healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_ready_check(client: TestClient) -> None:
    """Test readiness endpoint returns ready status."""
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}

