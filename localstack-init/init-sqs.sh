#!/bin/bash
awslocal sqs create-queue --queue-name growthpulse-normalize
awslocal sqs create-queue --queue-name growthpulse-collect
awslocal sqs create-queue --queue-name growthpulse-analyze
echo "SQS queues created successfully"
