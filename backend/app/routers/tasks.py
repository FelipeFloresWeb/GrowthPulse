"""Tasks router: handles task processing, status, and results."""

import json
import uuid
import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    ProcessResponse,
    ResultsResponse,
    StatusResponse,
    TaskInfo,
    TaskMessage,
    TaskStatus,
    TaskType,
)
from app.services import sqs_service
from app.store import storage, task_results, tasks

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

QUEUE_MAP = {
    TaskType.NORMALIZE: "growthpulse-normalize",
    TaskType.COLLECT: "growthpulse-collect",
    TaskType.ANALYZE: "growthpulse-analyze",
}


@router.post("/process/{upload_id}", response_model=ProcessResponse)
async def process_upload(upload_id: str):
    """Send processing tasks to SQS queues."""
    if upload_id not in storage:
        raise HTTPException(status_code=404, detail="Upload not found")

    task_list = []
    tasks[upload_id] = {}
    task_results[upload_id] = {}

    for task_type in TaskType:
        task_id = str(uuid.uuid4())
        message = TaskMessage(
            task_id=task_id,
            upload_id=upload_id,
            task_type=task_type,
            payload={"upload_id": upload_id},
        )

        queue_name = QUEUE_MAP[task_type]
        try:
            sqs_service.send_message(queue_name, message.model_dump())
        except Exception as e:
            logger.error(f"Failed to send message to {queue_name}: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to send task {task_type.value} to queue",
            )

        task_info = TaskInfo(
            task_id=task_id,
            task_type=task_type,
            status=TaskStatus.PENDING,
        )
        tasks[upload_id][task_type.value] = task_info
        task_list.append(task_info)

    return ProcessResponse(upload_id=upload_id, tasks=task_list)


@router.get("/{upload_id}/status", response_model=StatusResponse)
async def get_status(upload_id: str):
    """Get status of all tasks for an upload."""
    if upload_id not in tasks:
        raise HTTPException(status_code=404, detail="Tasks not found for this upload")

    task_list = list(tasks[upload_id].values())
    completed = all(t.status == TaskStatus.COMPLETED for t in task_list)

    return StatusResponse(
        upload_id=upload_id,
        tasks=task_list,
        completed=completed,
    )


@router.get("/{upload_id}/results", response_model=ResultsResponse)
async def get_results(upload_id: str):
    """Get processed results for an upload."""
    if upload_id not in task_results:
        raise HTTPException(
            status_code=404, detail="Results not found for this upload"
        )

    results = task_results[upload_id]

    return ResultsResponse(
        upload_id=upload_id,
        normalized_data=results.get("normalize"),
        metrics=results.get("collect"),
        analysis=results.get("analyze"),
    )
