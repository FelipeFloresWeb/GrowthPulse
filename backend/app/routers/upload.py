"""Upload router: handles CSV file uploads."""

import csv
import io
import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import UploadResponse
from app.store import storage

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    """Upload a CSV file and store it in memory."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(text))
    data = list(reader)

    if not data:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    upload_id = str(uuid.uuid4())
    columns = list(data[0].keys()) if data else []

    storage[upload_id] = {
        "filename": file.filename,
        "data": data,
    }

    return UploadResponse(
        upload_id=upload_id,
        filename=file.filename,
        rows=len(data),
        columns=columns,
        preview=data[:5],
    )
