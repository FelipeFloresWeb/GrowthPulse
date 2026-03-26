"""SQS service for sending and receiving messages via LocalStack."""

import os
import json
import boto3
from botocore.config import Config


def get_endpoint_url() -> str:
    return os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566")


def get_sqs_client():
    return boto3.client(
        "sqs",
        endpoint_url=get_endpoint_url(),
        region_name=os.environ.get("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
        config=Config(retries={"max_attempts": 3}),
    )


def get_queue_url(queue_name: str) -> str:
    return f"{get_endpoint_url()}/000000000000/{queue_name}"


def send_message(queue_name: str, message_body: dict) -> dict:
    client = get_sqs_client()
    queue_url = get_queue_url(queue_name)
    response = client.send_message(
        QueueUrl=queue_url,
        MessageBody=json.dumps(message_body),
    )
    return response


def receive_messages(queue_name: str, max_messages: int = 1) -> list[dict]:
    client = get_sqs_client()
    queue_url = get_queue_url(queue_name)
    response = client.receive_message(
        QueueUrl=queue_url,
        MaxNumberOfMessages=max_messages,
        WaitTimeSeconds=0,
    )
    return response.get("Messages", [])


def delete_message(queue_name: str, receipt_handle: str) -> dict:
    client = get_sqs_client()
    queue_url = get_queue_url(queue_name)
    response = client.delete_message(
        QueueUrl=queue_url,
        ReceiptHandle=receipt_handle,
    )
    return response
