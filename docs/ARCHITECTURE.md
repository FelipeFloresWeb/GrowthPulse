# Architecture — GrowthPulse

## Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                  │     │                  │     │                 │
│   Next.js App    │────▶│   FastAPI API    │────▶│   AWS SQS       │
│   (Frontend)     │     │   (Backend)      │     │   (LocalStack)  │
│                  │◀────│                  │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     :3000                   :8000                   :4566
```

## Tech Stack

### Frontend (`/frontend`)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Jest + React Testing Library
- **HTTP Client**: Native fetch API

### Backend (`/backend`)
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **AWS SDK**: boto3
- **AI**: OpenAI SDK (GPT-4o-mini for growth analysis)
- **Testing**: pytest + pytest-cov + httpx
- **Local SQS**: LocalStack

### Local Infrastructure
- **Docker Compose**: LocalStack (SQS) + Backend + Frontend
- **LocalStack**: Emulates AWS SQS locally on port 4566

## Monorepo Structure

```
AWS-SQS/
├── docs/
│   ├── PRD.md
│   └── ARCHITECTURE.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── FileUpload.tsx
│   │   │   ├── TaskPipeline.tsx
│   │   │   ├── MetricsCards.tsx
│   │   │   ├── GrowthScore.tsx
│   │   │   └── DataTable.tsx
│   │   ├── hooks/
│   │   │   └── useTasks.ts
│   │   ├── lib/
│   │   │   └── api.ts
│   │   └── types/
│   │       └── index.ts
│   ├── __tests__/
│   ├── jest.config.ts
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── upload.py
│   │   │   └── tasks.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── sqs_service.py
│   │   │   ├── normalizer.py
│   │   │   ├── collector.py
│   │   │   └── analyzer.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py
│   │   └── workers/
│   │       ├── __init__.py
│   │       └── processor.py
│   ├── tests/
│   ├── requirements.txt
│   └── pytest.ini
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Data Flow

### 1. Upload
```
Client → POST /api/upload (CSV) → Store in memory → Return upload_id
```

### 2. Process
```
Client → POST /api/tasks/process/{upload_id}
  → Send message to "normalize" queue
  → Send message to "collect" queue
  → Send message to "analyze" queue
  → Return task_ids
```

### 3. Worker (Background)
```
Worker polls normalize queue → processes → updates status
Worker polls collect queue → processes → updates status
Worker polls analyze queue → processes → updates status
```

### 4. Status
```
Client → GET /api/tasks/{upload_id}/status → Return status for each task
```

### 5. Results
```
Client → GET /api/tasks/{upload_id}/results → Return processed data
```

## Data Models

### TaskMessage (SQS)
```json
{
  "task_id": "uuid",
  "upload_id": "uuid",
  "task_type": "normalize | collect | analyze",
  "payload": { ... }
}
```

### TaskStatus
```json
{
  "task_id": "uuid",
  "task_type": "normalize | collect | analyze",
  "status": "pending | processing | completed | failed",
  "result": { ... }
}
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload` | Upload CSV spreadsheet |
| POST | `/api/tasks/process/{upload_id}` | Dispatch all 3 tasks |
| GET | `/api/tasks/{upload_id}/status` | Task status |
| GET | `/api/tasks/{upload_id}/results` | Processed results |
| GET | `/api/health` | Health check |
