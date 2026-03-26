import {
  UploadResponse,
  ProcessResponse,
  StatusResponse,
  ResultsResponse,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text().catch(() => 'Erro desconhecido');
    throw new Error(`Erro ${response.status}: ${message}`);
  }
  return response.json();
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<UploadResponse>(response);
}

export async function processTasks(
  uploadId: string
): Promise<ProcessResponse> {
  const response = await fetch(
    `${BASE_URL}/api/tasks/process/${uploadId}`,
    { method: 'POST' }
  );

  return handleResponse<ProcessResponse>(response);
}

export async function getStatus(uploadId: string): Promise<StatusResponse> {
  const response = await fetch(
    `${BASE_URL}/api/tasks/${uploadId}/status`
  );

  return handleResponse<StatusResponse>(response);
}

export async function getResults(
  uploadId: string
): Promise<ResultsResponse> {
  const response = await fetch(
    `${BASE_URL}/api/tasks/${uploadId}/results`
  );

  return handleResponse<ResultsResponse>(response);
}
