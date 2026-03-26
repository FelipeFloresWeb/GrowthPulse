"""Tests for main app and health endpoint."""

import pytest
from unittest.mock import patch, AsyncMock
from httpx import ASGITransport, AsyncClient

from app.main import app, lifespan


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_health_check(mock_stop, mock_start, client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "growthpulse"


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_cors_headers(mock_stop, mock_start, client):
    response = await client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_not_found(mock_stop, mock_start, client):
    response = await client.get("/nonexistent")
    assert response.status_code == 404


@patch("app.main.stop_worker", new_callable=AsyncMock)
@patch("app.main.start_worker", new_callable=AsyncMock)
async def test_lifespan(mock_start, mock_stop):
    """Test the lifespan context manager calls start/stop worker."""
    async with lifespan(app):
        mock_start.assert_called_once()
    mock_stop.assert_called_once()
