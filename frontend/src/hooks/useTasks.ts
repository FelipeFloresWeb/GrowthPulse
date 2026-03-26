'use client';

import { useState, useCallback, useRef } from 'react';
import { TaskInfo, UploadResponse, ResultsResponse } from '@/types';
import * as api from '@/lib/api';

const POLL_INTERVAL = 2000;

export function useTasks() {
  const [uploadResponse, setUploadResponse] =
    useState<UploadResponse | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const upload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const response = await api.uploadFile(file);
      setUploadResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const process = useCallback(async () => {
    if (!uploadResponse) return;

    setIsProcessing(true);
    setError(null);

    try {
      const processResponse = await api.processTasks(uploadResponse.upload_id);
      setTasks(processResponse.tasks);

      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          const statusResponse = await api.getStatus(
            uploadResponse.upload_id
          );
          setTasks(statusResponse.tasks);

          if (statusResponse.completed) {
            stopPolling();
            const resultsResponse = await api.getResults(
              uploadResponse.upload_id
            );
            setResults(resultsResponse);
            setIsProcessing(false);
          }
        } catch (err) {
          stopPolling();
          setError(
            err instanceof Error ? err.message : 'Erro ao verificar status'
          );
          setIsProcessing(false);
        }
      }, POLL_INTERVAL);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erro ao processar tarefas'
      );
      setIsProcessing(false);
    }
  }, [uploadResponse, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setUploadResponse(null);
    setTasks([]);
    setResults(null);
    setIsUploading(false);
    setIsProcessing(false);
    setError(null);
  }, [stopPolling]);

  return {
    uploadResponse,
    tasks,
    results,
    isUploading,
    isProcessing,
    error,
    upload,
    process,
    reset,
  };
}
