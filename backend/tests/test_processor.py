"""Tests for the background worker processor."""

import json
import asyncio
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from app.models.schemas import TaskInfo, TaskStatus, TaskType
from app.store import storage, tasks, task_results
from app.workers.processor import (
    handle_message,
    poll_queues,
    process_analyze,
    process_collect,
    process_normalize,
    start_worker,
    stop_worker,
)


@pytest.fixture
def setup_upload(sample_csv_data):
    upload_id = "test-upload-123"
    storage[upload_id] = {"filename": "test.csv", "data": sample_csv_data}
    tasks[upload_id] = {
        "normalize": TaskInfo(
            task_id="t1", task_type=TaskType.NORMALIZE, status=TaskStatus.PENDING
        ),
        "collect": TaskInfo(
            task_id="t2", task_type=TaskType.COLLECT, status=TaskStatus.PENDING
        ),
        "analyze": TaskInfo(
            task_id="t3", task_type=TaskType.ANALYZE, status=TaskStatus.PENDING
        ),
    }
    task_results[upload_id] = {}
    return upload_id


async def test_process_normalize(setup_upload):
    result = await process_normalize(setup_upload)
    assert isinstance(result, list)
    assert len(result) == 5
    assert "company_name" in result[0]


async def test_process_collect(setup_upload, sample_normalized_data):
    # Store normalized data first
    task_results[setup_upload] = {"normalize": sample_normalized_data}
    result = await process_collect(setup_upload)
    assert isinstance(result, dict)
    assert "total_revenue" in result
    assert "total_clients" in result


async def test_process_collect_no_normalized(setup_upload):
    result = await process_collect(setup_upload)
    assert isinstance(result, dict)
    assert "total_clients" in result


async def test_process_analyze(setup_upload, sample_metrics):
    task_results[setup_upload] = {"collect": sample_metrics}
    result = await process_analyze(setup_upload)
    assert isinstance(result, dict)
    assert "growth_score" in result
    assert "recommendations" in result


async def test_process_analyze_no_metrics(setup_upload):
    result = await process_analyze(setup_upload)
    assert isinstance(result, dict)
    assert "growth_score" in result


@patch("app.workers.processor.sqs_service")
async def test_handle_message_normalize(mock_sqs, setup_upload):
    message = {
        "Body": json.dumps({
            "task_id": "t1",
            "upload_id": setup_upload,
            "task_type": "normalize",
            "payload": {"upload_id": setup_upload},
        }),
        "ReceiptHandle": "rh-123",
    }

    await handle_message("growthpulse-normalize", message)

    assert tasks[setup_upload]["normalize"].status == TaskStatus.COMPLETED
    assert "normalize" in task_results[setup_upload]
    mock_sqs.delete_message.assert_called_once_with(
        "growthpulse-normalize", "rh-123"
    )


@patch("app.workers.processor.sqs_service")
async def test_handle_message_collect(mock_sqs, setup_upload, sample_normalized_data):
    task_results[setup_upload]["normalize"] = sample_normalized_data
    message = {
        "Body": json.dumps({
            "task_id": "t2",
            "upload_id": setup_upload,
            "task_type": "collect",
            "payload": {"upload_id": setup_upload},
        }),
        "ReceiptHandle": "rh-456",
    }

    await handle_message("growthpulse-collect", message)

    assert tasks[setup_upload]["collect"].status == TaskStatus.COMPLETED
    assert "collect" in task_results[setup_upload]


@patch("app.workers.processor.sqs_service")
async def test_handle_message_analyze(mock_sqs, setup_upload, sample_metrics):
    task_results[setup_upload]["collect"] = sample_metrics
    message = {
        "Body": json.dumps({
            "task_id": "t3",
            "upload_id": setup_upload,
            "task_type": "analyze",
            "payload": {"upload_id": setup_upload},
        }),
        "ReceiptHandle": "rh-789",
    }

    await handle_message("growthpulse-analyze", message)

    assert tasks[setup_upload]["analyze"].status == TaskStatus.COMPLETED
    assert "analyze" in task_results[setup_upload]


@patch("app.workers.processor.sqs_service")
async def test_handle_message_upload_not_found(mock_sqs):
    message = {
        "Body": json.dumps({
            "task_id": "t1",
            "upload_id": "nonexistent",
            "task_type": "normalize",
            "payload": {},
        }),
        "ReceiptHandle": "rh-123",
    }

    await handle_message("growthpulse-normalize", message)

    mock_sqs.delete_message.assert_not_called()


@patch("app.workers.processor.sqs_service")
@patch("app.workers.processor.normalize", side_effect=Exception("Processing error"))
async def test_handle_message_processing_error(mock_normalize, mock_sqs, setup_upload):
    message = {
        "Body": json.dumps({
            "task_id": "t1",
            "upload_id": setup_upload,
            "task_type": "normalize",
            "payload": {},
        }),
        "ReceiptHandle": "rh-123",
    }

    await handle_message("growthpulse-normalize", message)

    assert tasks[setup_upload]["normalize"].status == TaskStatus.FAILED


@patch("app.workers.processor.sqs_service")
async def test_handle_message_result_is_list(mock_sqs, setup_upload):
    """Test that list results get wrapped in dict for TaskInfo."""
    message = {
        "Body": json.dumps({
            "task_id": "t1",
            "upload_id": setup_upload,
            "task_type": "normalize",
            "payload": {},
        }),
        "ReceiptHandle": "rh-123",
    }

    await handle_message("growthpulse-normalize", message)

    task_info = tasks[setup_upload]["normalize"]
    assert task_info.result is not None
    assert "data" in task_info.result


async def test_start_and_stop_worker():
    import app.workers.processor as proc

    with patch.object(proc, "poll_queues", new_callable=AsyncMock):
        await start_worker()
        assert proc._worker_task is not None

        await stop_worker()
        assert proc._worker_task is None


@patch("app.workers.processor.sqs_service")
async def test_poll_queues_processes_messages(mock_sqs, setup_upload):
    """Test that poll_queues picks up messages and processes them."""
    import app.workers.processor as proc

    call_count = 0

    def fake_receive(queue_name):
        nonlocal call_count
        call_count += 1
        # Only return a message on the first call for normalize queue
        if call_count == 1 and queue_name == "growthpulse-normalize":
            return [{
                "Body": json.dumps({
                    "task_id": "t1",
                    "upload_id": setup_upload,
                    "task_type": "normalize",
                    "payload": {},
                }),
                "ReceiptHandle": "rh-poll",
            }]
        return []

    mock_sqs.receive_messages.side_effect = fake_receive
    mock_sqs.delete_message.return_value = {}

    # Run poll_queues but stop it after one iteration
    proc._running = True

    async def stop_after_delay():
        await asyncio.sleep(0.1)
        proc._running = False

    asyncio.create_task(stop_after_delay())
    await poll_queues()

    assert tasks[setup_upload]["normalize"].status == TaskStatus.COMPLETED


@patch("app.workers.processor.sqs_service")
async def test_poll_queues_handles_errors(mock_sqs):
    """Test that poll_queues continues even when errors occur."""
    import app.workers.processor as proc

    mock_sqs.receive_messages.side_effect = Exception("Connection error")

    proc._running = True

    async def stop_after_delay():
        await asyncio.sleep(0.1)
        proc._running = False

    asyncio.create_task(stop_after_delay())
    # Should not raise
    await poll_queues()


@patch("app.workers.processor.sqs_service")
async def test_handle_message_no_tasks_entry(mock_sqs):
    """Test handle_message when upload exists but tasks entry is missing."""
    upload_id = "upload-no-tasks"
    storage[upload_id] = {"filename": "test.csv", "data": [{"Name": "A", "Revenue": "100"}]}

    message = {
        "Body": json.dumps({
            "task_id": "t1",
            "upload_id": upload_id,
            "task_type": "normalize",
            "payload": {},
        }),
        "ReceiptHandle": "rh-123",
    }

    await handle_message("growthpulse-normalize", message)

    # Should still store results even without tasks tracking
    assert "normalize" in task_results[upload_id]
    mock_sqs.delete_message.assert_called_once()
