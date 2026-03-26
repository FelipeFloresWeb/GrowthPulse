# PRD — GrowthPulse: Marketing Intelligence Platform

## Overview

**GrowthPulse** is a marketing intelligence platform that demonstrates the use of AWS SQS queues for asynchronous task processing. The fictional company "GrowthPulse Marketing" helps other businesses increase their revenue through data-driven analysis.

## Problem

Marketing companies need to process multiple client data analysis tasks asynchronously and at scale:
1. Normalize spreadsheets submitted by clients
2. Collect and structure the normalized data
3. Analyze the client's growth potential upon adopting the services

## Solution

A web platform where the user uploads a client spreadsheet and triggers 3 chained tasks via SQS:

| # | Task | SQS Queue | Description |
|---|------|-----------|-------------|
| 1 | Normalization | `growthpulse-normalize` | Cleans, standardizes, and validates spreadsheet data |
| 2 | Data Collection | `growthpulse-collect` | Extracts key metrics (revenue, clients, churn, CAC, LTV) |
| 3 | Growth Analysis (GPT) | `growthpulse-analyze` | Uses OpenAI GPT to generate growth potential score and recommendations |

## Personas

- **Marketing Analyst** — Uploads spreadsheets and monitors the processing pipeline
- **Manager** — Views results and growth potential reports

## Features

### F1 — Spreadsheet Upload
- CSV/XLSX file upload
- Basic format validation
- Data preview display

### F2 — Task Dispatch
- "Process" button sends all 3 tasks to SQS queues
- Each task is sent as an independent message
- Immediate response with task IDs

### F3 — Real-Time Tracking
- Dashboard with status for each task (pending → processing → completed)
- Status polling via API
- Visual progress indicators

### F4 — Results
- Normalized data in table format
- Collected metrics in cards
- Growth score with radar chart
- Prioritized recommendations list

## Non-Functional Requirements

- **Test coverage**: 100% frontend and backend
- **Monorepo**: Next.js (frontend) + FastAPI (backend)
- **SQS**: LocalStack for local development
- **AI**: OpenAI GPT for growth analysis (with rule-based fallback)
- **Responsiveness**: Mobile-first

## Out of Scope

- User authentication
- Database persistence (in-memory data for demo)
- Production deployment
- Real data processing (simulated with delays)

## Success Metrics

- Full pipeline executed in < 30 seconds
- 100% test coverage
- Intuitive UX for LinkedIn demonstration
