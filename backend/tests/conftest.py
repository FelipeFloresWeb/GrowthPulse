"""Shared test fixtures."""

import os
import io
import csv
import pytest
import boto3
from moto import mock_aws
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.store import storage, tasks, task_results


@pytest.fixture(autouse=True)
def clear_storage():
    """Clear in-memory storage before each test."""
    storage.clear()
    tasks.clear()
    task_results.clear()
    yield
    storage.clear()
    tasks.clear()
    task_results.clear()


@pytest.fixture
def sample_csv_data():
    """Sample CSV data as list of dicts."""
    return [
        {"Company Name": "Acme Corp", "Revenue": "50000", "Sector": "Tech"},
        {"Company Name": "Beta Inc", "Revenue": "75000", "Sector": "Finance"},
        {"Company Name": "Gamma LLC", "Revenue": "30000", "Sector": "Health"},
        {"Company Name": "Delta Co", "Revenue": "90000", "Sector": "Tech"},
        {"Company Name": "Epsilon SA", "Revenue": "120000", "Sector": "Finance"},
    ]


@pytest.fixture
def sample_csv_bytes(sample_csv_data):
    """Sample CSV as bytes for upload."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=sample_csv_data[0].keys())
    writer.writeheader()
    writer.writerows(sample_csv_data)
    return output.getvalue().encode("utf-8")


@pytest.fixture
def sample_normalized_data():
    """Sample normalized data."""
    return [
        {"company_name": "Acme Corp", "revenue": 50000, "sector": "Tech"},
        {"company_name": "Beta Inc", "revenue": 75000, "sector": "Finance"},
        {"company_name": "Gamma LLC", "revenue": 30000, "sector": "Health"},
        {"company_name": "Delta Co", "revenue": 90000, "sector": "Tech"},
        {"company_name": "Epsilon SA", "revenue": 120000, "sector": "Finance"},
    ]


@pytest.fixture
def sample_metrics():
    """Sample collected metrics."""
    return {
        "total_revenue": 365000,
        "total_clients": 5,
        "avg_revenue_per_client": 73000,
        "churn_rate": 12.5,
        "cac": 250.0,
        "ltv": 876000.0,
    }


@pytest.fixture
def mock_sqs():
    """Mock AWS SQS using moto."""
    with mock_aws():
        client = boto3.client(
            "sqs",
            region_name="us-east-1",
            aws_access_key_id="test",
            aws_secret_access_key="test",
        )
        # Create queues
        for queue_name in [
            "growthpulse-normalize",
            "growthpulse-collect",
            "growthpulse-analyze",
        ]:
            client.create_queue(QueueName=queue_name)
        yield client


@pytest.fixture
async def async_client():
    """Async test client for FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
