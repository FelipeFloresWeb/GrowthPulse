"""Tests for upload router."""

import pytest
from unittest.mock import patch, AsyncMock
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.store import storage


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_upload_csv_success(mock_stop, mock_start, client, sample_csv_bytes):
    response = await client.post(
        "/api/upload",
        files={"file": ("test.csv", sample_csv_bytes, "text/csv")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "upload_id" in data
    assert data["filename"] == "test.csv"
    assert data["rows"] == 5
    assert "Company Name" in data["columns"]
    assert len(data["preview"]) == 5
    assert data["upload_id"] in storage


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_upload_non_csv(mock_stop, mock_start, client):
    response = await client.post(
        "/api/upload",
        files={"file": ("test.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 400
    assert "CSV" in response.json()["detail"]


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_upload_empty_csv(mock_stop, mock_start, client):
    response = await client.post(
        "/api/upload",
        files={"file": ("empty.csv", b"col1,col2\n", "text/csv")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_upload_stores_data(mock_stop, mock_start, client, sample_csv_bytes):
    response = await client.post(
        "/api/upload",
        files={"file": ("data.csv", sample_csv_bytes, "text/csv")},
    )
    upload_id = response.json()["upload_id"]
    assert upload_id in storage
    assert storage[upload_id]["filename"] == "data.csv"
    assert len(storage[upload_id]["data"]) == 5


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_upload_non_utf8(mock_stop, mock_start, client):
    """Test uploading a non-UTF-8 file returns 400."""
    invalid_bytes = b"\xff\xfe" + "col1,col2\n".encode("utf-16-le")
    response = await client.post(
        "/api/upload",
        files={"file": ("bad.csv", invalid_bytes, "text/csv")},
    )
    assert response.status_code == 400
    assert "UTF-8" in response.json()["detail"]
