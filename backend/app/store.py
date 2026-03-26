"""Shared in-memory storage for the application."""

from app.models.schemas import TaskInfo

# upload_id -> {filename: str, data: list[dict]}
storage: dict[str, dict] = {}

# upload_id -> {task_type -> TaskInfo}
tasks: dict[str, dict[str, TaskInfo]] = {}

# upload_id -> {normalize: ..., collect: ..., analyze: ...}
task_results: dict[str, dict] = {}
