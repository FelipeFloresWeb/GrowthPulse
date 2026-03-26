from enum import Enum
from typing import Optional
from pydantic import BaseModel


class TaskType(str, Enum):
    NORMALIZE = "normalize"
    COLLECT = "collect"
    ANALYZE = "analyze"


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskMessage(BaseModel):
    task_id: str
    upload_id: str
    task_type: TaskType
    payload: dict


class TaskInfo(BaseModel):
    task_id: str
    task_type: TaskType
    status: TaskStatus
    result: Optional[dict] = None


class UploadResponse(BaseModel):
    upload_id: str
    filename: str
    rows: int
    columns: list[str]
    preview: list[dict]


class ProcessResponse(BaseModel):
    upload_id: str
    tasks: list[TaskInfo]


class StatusResponse(BaseModel):
    upload_id: str
    tasks: list[TaskInfo]
    completed: bool


class ResultsResponse(BaseModel):
    upload_id: str
    normalized_data: Optional[list[dict]] = None
    metrics: Optional[dict] = None
    analysis: Optional[dict] = None
