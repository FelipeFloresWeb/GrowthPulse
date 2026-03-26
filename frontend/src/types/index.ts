export type TaskType = 'normalize' | 'collect' | 'analyze';
export type TaskStatusType = 'pending' | 'processing' | 'completed' | 'failed';

export interface TaskInfo {
  task_id: string;
  task_type: TaskType;
  status: TaskStatusType;
  result?: Record<string, unknown>;
}

export interface UploadResponse {
  upload_id: string;
  filename: string;
  rows: number;
  columns: string[];
  preview: Record<string, string>[];
}

export interface ProcessResponse {
  upload_id: string;
  tasks: TaskInfo[];
}

export interface StatusResponse {
  upload_id: string;
  tasks: TaskInfo[];
  completed: boolean;
}

export interface ResultsResponse {
  upload_id: string;
  normalized_data?: Record<string, unknown>[];
  metrics?: {
    total_revenue: number;
    total_clients: number;
    avg_revenue_per_client: number;
    churn_rate: number;
    cac: number;
    ltv: number;
  };
  analysis?: {
    growth_score: number;
    potential_revenue_increase: number;
    recommendations: string[];
    risk_level: 'low' | 'medium' | 'high';
    market_position: 'emerging' | 'growing' | 'established' | 'dominant';
  };
}
