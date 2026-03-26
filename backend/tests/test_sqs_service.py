"""Tests for SQS service."""

import json
import os
import pytest
from unittest.mock import patch, MagicMock

from app.services import sqs_service


def test_get_endpoint_url_default():
    with patch.dict(os.environ, {}, clear=True):
        # Remove the key if present
        os.environ.pop("AWS_ENDPOINT_URL", None)
        url = sqs_service.get_endpoint_url()
        assert url == "http://localhost:4566"


def test_get_endpoint_url_custom():
    with patch.dict(os.environ, {"AWS_ENDPOINT_URL": "http://custom:5000"}):
        url = sqs_service.get_endpoint_url()
        assert url == "http://custom:5000"


def test_get_queue_url():
    with patch.dict(os.environ, {}, clear=True):
        os.environ.pop("AWS_ENDPOINT_URL", None)
        url = sqs_service.get_queue_url("test-queue")
        assert url == "http://localhost:4566/000000000000/test-queue"


@patch("app.services.sqs_service.get_sqs_client")
def test_send_message(mock_get_client):
    mock_client = MagicMock()
    mock_client.send_message.return_value = {"MessageId": "msg-123"}
    mock_get_client.return_value = mock_client

    result = sqs_service.send_message("test-queue", {"key": "value"})

    mock_client.send_message.assert_called_once()
    call_kwargs = mock_client.send_message.call_args[1]
    assert "test-queue" in call_kwargs["QueueUrl"]
    assert json.loads(call_kwargs["MessageBody"]) == {"key": "value"}
    assert result["MessageId"] == "msg-123"


@patch("app.services.sqs_service.get_sqs_client")
def test_receive_messages(mock_get_client):
    mock_client = MagicMock()
    mock_client.receive_message.return_value = {
        "Messages": [{"Body": '{"key": "value"}', "ReceiptHandle": "rh-123"}]
    }
    mock_get_client.return_value = mock_client

    messages = sqs_service.receive_messages("test-queue")

    assert len(messages) == 1
    assert messages[0]["ReceiptHandle"] == "rh-123"


@patch("app.services.sqs_service.get_sqs_client")
def test_receive_messages_empty(mock_get_client):
    mock_client = MagicMock()
    mock_client.receive_message.return_value = {}
    mock_get_client.return_value = mock_client

    messages = sqs_service.receive_messages("test-queue")
    assert messages == []


@patch("app.services.sqs_service.get_sqs_client")
def test_delete_message(mock_get_client):
    mock_client = MagicMock()
    mock_client.delete_message.return_value = {}
    mock_get_client.return_value = mock_client

    result = sqs_service.delete_message("test-queue", "rh-123")

    mock_client.delete_message.assert_called_once()
    call_kwargs = mock_client.delete_message.call_args[1]
    assert call_kwargs["ReceiptHandle"] == "rh-123"


@patch("app.services.sqs_service.get_sqs_client")
def test_receive_messages_with_max(mock_get_client):
    mock_client = MagicMock()
    mock_client.receive_message.return_value = {"Messages": []}
    mock_get_client.return_value = mock_client

    sqs_service.receive_messages("test-queue", max_messages=5)

    call_kwargs = mock_client.receive_message.call_args[1]
    assert call_kwargs["MaxNumberOfMessages"] == 5


def test_get_sqs_client():
    with patch.dict(os.environ, {
        "AWS_ENDPOINT_URL": "http://localhost:4566",
        "AWS_REGION": "us-east-1",
        "AWS_ACCESS_KEY_ID": "test",
        "AWS_SECRET_ACCESS_KEY": "test",
    }):
        client = sqs_service.get_sqs_client()
        assert client is not None
