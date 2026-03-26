"""Background worker that polls SQS queues and processes tasks."""

import asyncio
import json
import logging

from app.models.schemas import TaskMessage, TaskStatus, TaskType
from app.services import sqs_service
from app.services.analyzer import analyze
from app.services.collector import collect
from app.services.normalizer import normalize
from app.store import storage, task_results, tasks

logger = logging.getLogger(__name__)

QUEUE_MAP = {
    TaskType.NORMALIZE: "growthpulse-normalize",
    TaskType.COLLECT: "growthpulse-collect",
    TaskType.ANALYZE: "growthpulse-analyze",
}

# Flag to control the worker loop
_running = False
_worker_task: asyncio.Task | None = None


async def process_normalize(upload_id: str) -> list[dict]:
    """Process normalize task."""
    await asyncio.sleep(1)
    data = storage[upload_id]["data"]
    return normalize(data)


async def process_collect(upload_id: str) -> dict:
    """Process collect task."""
    await asyncio.sleep(2)
    # Use normalized data if available, otherwise raw data
    results = task_results.get(upload_id, {})
    data = results.get("normalize", storage[upload_id]["data"])
    return collect(data)


async def process_analyze(upload_id: str) -> dict:
    """Process analyze task."""
    await asyncio.sleep(3)
    # Use collected metrics if available
    results = task_results.get(upload_id, {})
    metrics = results.get("collect", {})
    return analyze(metrics)


PROCESSORS = {
    TaskType.NORMALIZE: process_normalize,
    TaskType.COLLECT: process_collect,
    TaskType.ANALYZE: process_analyze,
}


async def handle_message(queue_name: str, message: dict) -> None:
    """Process a single SQS message."""
    body = json.loads(message["Body"])
    task_msg = TaskMessage(**body)
    upload_id = task_msg.upload_id
    task_type = task_msg.task_type

    if upload_id not in storage:
        logger.error(f"Upload {upload_id} not found in storage")
        return

    # Update status to processing
    if upload_id in tasks and task_type.value in tasks[upload_id]:
        tasks[upload_id][task_type.value].status = TaskStatus.PROCESSING

    try:
        processor = PROCESSORS[task_type]
        result = await processor(upload_id)

        # Store result
        if upload_id not in task_results:
            task_results[upload_id] = {}
        task_results[upload_id][task_type.value] = result

        # Update status to completed
        if upload_id in tasks and task_type.value in tasks[upload_id]:
            tasks[upload_id][task_type.value].status = TaskStatus.COMPLETED
            tasks[upload_id][task_type.value].result = (
                result if isinstance(result, dict) else {"data": result}
            )

        # Delete message from queue
        sqs_service.delete_message(queue_name, message["ReceiptHandle"])
        logger.info(f"Completed task {task_type.value} for upload {upload_id}")

    except Exception as e:
        logger.error(f"Failed to process task {task_type.value}: {e}")
        if upload_id in tasks and task_type.value in tasks[upload_id]:
            tasks[upload_id][task_type.value].status = TaskStatus.FAILED


async def poll_queues() -> None:
    """Poll all SQS queues for messages."""
    global _running
    _running = True

    while _running:
        for task_type, queue_name in QUEUE_MAP.items():
            try:
                messages = sqs_service.receive_messages(queue_name)
                for message in messages:
                    await handle_message(queue_name, message)
            except Exception as e:
                logger.debug(f"Error polling {queue_name}: {e}")

        await asyncio.sleep(2)


async def start_worker() -> None:
    """Start the background worker."""
    global _worker_task
    _worker_task = asyncio.create_task(poll_queues())
    logger.info("Background worker started")


async def stop_worker() -> None:
    """Stop the background worker."""
    global _running, _worker_task
    _running = False
    if _worker_task is not None:
        _worker_task.cancel()
        try:
            await _worker_task
        except asyncio.CancelledError:
            pass
        _worker_task = None
    logger.info("Background worker stopped")
