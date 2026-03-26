"""Tests for tasks router."""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.schemas import TaskInfo, TaskStatus, TaskType
from app.store import storage, tasks, task_results


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
def stored_upload(sample_csv_data):
    upload_id = "test-upload-123"
    storage[upload_id] = {"filename": "test.csv", "data": sample_csv_data}
    return upload_id


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
@patch("app.routers.tasks.sqs_service")
async def test_process_upload_success(
    mock_sqs, mock_stop, mock_start, client, stored_upload
):
    mock_sqs.send_message.return_value = {"MessageId": "msg-123"}

    response = await client.post(f"/api/tasks/process/{stored_upload}")
    assert response.status_code == 200
    data = response.json()
    assert data["upload_id"] == stored_upload
    assert len(data["tasks"]) == 3
    assert all(t["status"] == "pending" for t in data["tasks"])
    task_types = {t["task_type"] for t in data["tasks"]}
    assert task_types == {"normalize", "collect", "analyze"}


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_process_upload_not_found(mock_stop, mock_start, client):
    response = await client.post("/api/tasks/process/nonexistent")
    assert response.status_code == 404


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
@patch("app.routers.tasks.sqs_service")
async def test_process_sqs_failure(
    mock_sqs, mock_stop, mock_start, client, stored_upload
):
    mock_sqs.send_message.side_effect = Exception("SQS error")

    response = await client.post(f"/api/tasks/process/{stored_upload}")
    assert response.status_code == 500


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_get_status(mock_stop, mock_start, client, stored_upload):
    tasks[stored_upload] = {
        "normalize": TaskInfo(
            task_id="t1", task_type=TaskType.NORMALIZE, status=TaskStatus.COMPLETED
        ),
        "collect": TaskInfo(
            task_id="t2", task_type=TaskType.COLLECT, status=TaskStatus.PENDING
        ),
        "analyze": TaskInfo(
            task_id="t3", task_type=TaskType.ANALYZE, status=TaskStatus.PENDING
        ),
    }

    response = await client.get(f"/api/tasks/{stored_upload}/status")
    assert response.status_code == 200
    data = response.json()
    assert data["upload_id"] == stored_upload
    assert data["completed"] is False
    assert len(data["tasks"]) == 3


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_get_status_all_completed(mock_stop, mock_start, client, stored_upload):
    tasks[stored_upload] = {
        "normalize": TaskInfo(
            task_id="t1", task_type=TaskType.NORMALIZE, status=TaskStatus.COMPLETED
        ),
        "collect": TaskInfo(
            task_id="t2", task_type=TaskType.COLLECT, status=TaskStatus.COMPLETED
        ),
        "analyze": TaskInfo(
            task_id="t3", task_type=TaskType.ANALYZE, status=TaskStatus.COMPLETED
        ),
    }

    response = await client.get(f"/api/tasks/{stored_upload}/status")
    data = response.json()
    assert data["completed"] is True


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_get_status_not_found(mock_stop, mock_start, client):
    response = await client.get("/api/tasks/nonexistent/status")
    assert response.status_code == 404


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_get_results(mock_stop, mock_start, client, stored_upload):
    task_results[stored_upload] = {
        "normalize": [{"company_name": "Acme", "revenue": 50000}],
        "collect": {"total_revenue": 50000, "total_clients": 1},
        "analyze": {"growth_score": 75, "recommendations": ["Do more marketing"]},
    }

    response = await client.get(f"/api/tasks/{stored_upload}/results")
    assert response.status_code == 200
    data = response.json()
    assert data["upload_id"] == stored_upload
    assert data["normalized_data"] is not None
    assert data["metrics"] is not None
    assert data["analysis"] is not None


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_get_results_not_found(mock_stop, mock_start, client):
    response = await client.get("/api/tasks/nonexistent/results")
    assert response.status_code == 404


@patch("app.main.start_worker", new_callable=AsyncMock)
@patch("app.main.stop_worker", new_callable=AsyncMock)
async def test_get_results_partial(mock_stop, mock_start, client, stored_upload):
    task_results[stored_upload] = {
        "normalize": [{"company_name": "Acme"}],
    }

    response = await client.get(f"/api/tasks/{stored_upload}/results")
    assert response.status_code == 200
    data = response.json()
    assert data["normalized_data"] is not None
    assert data["metrics"] is None
    assert data["analysis"] is None
