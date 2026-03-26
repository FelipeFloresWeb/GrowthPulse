import { renderHook, act } from '@testing-library/react';
import { useTasks } from '@/hooks/useTasks';
import * as api from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('useTasks', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useTasks());

    expect(result.current.uploadResponse).toBeNull();
    expect(result.current.tasks).toEqual([]);
    expect(result.current.results).toBeNull();
    expect(result.current.isUploading).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('upload', () => {
    it('uploads file and stores response', async () => {
      const mockUpload = {
        upload_id: 'u1',
        filename: 'test.csv',
        rows: 5,
        columns: ['a'],
        preview: [{ a: '1' }],
      };
      mockedApi.uploadFile.mockResolvedValueOnce(mockUpload);

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.upload(new File([''], 'test.csv'));
      });

      expect(result.current.uploadResponse).toEqual(mockUpload);
      expect(result.current.isUploading).toBe(false);
    });

    it('handles upload error', async () => {
      mockedApi.uploadFile.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.upload(new File([''], 'test.csv'));
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.isUploading).toBe(false);
    });

    it('handles non-Error rejection', async () => {
      mockedApi.uploadFile.mockRejectedValueOnce('string error');

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.upload(new File([''], 'test.csv'));
      });

      expect(result.current.error).toBe('Erro ao fazer upload');
    });
  });

  describe('process', () => {
    it('does nothing if no upload response', async () => {
      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.process();
      });

      expect(mockedApi.processTasks).not.toHaveBeenCalled();
    });

    it('processes, polls, and fetches results', async () => {
      const mockUpload = {
        upload_id: 'u1',
        filename: 'test.csv',
        rows: 5,
        columns: ['a'],
        preview: [],
      };
      const mockTasks = [
        { task_id: 't1', task_type: 'normalize' as const, status: 'pending' as const },
      ];
      const mockResults = {
        upload_id: 'u1',
        metrics: {
          total_revenue: 100000,
          total_clients: 50,
          avg_revenue_per_client: 2000,
          churn_rate: 0.05,
          cac: 500,
          ltv: 10000,
        },
      };

      mockedApi.uploadFile.mockResolvedValueOnce(mockUpload);
      mockedApi.processTasks.mockResolvedValueOnce({
        upload_id: 'u1',
        tasks: mockTasks,
      });
      mockedApi.getStatus.mockResolvedValueOnce({
        upload_id: 'u1',
        tasks: [{ ...mockTasks[0], status: 'completed' }],
        completed: true,
      });
      mockedApi.getResults.mockResolvedValueOnce(mockResults);

      const { result } = renderHook(() => useTasks());

      // Upload first
      await act(async () => {
        await result.current.upload(new File([''], 'test.csv'));
      });

      // Process
      await act(async () => {
        await result.current.process();
      });

      expect(result.current.isProcessing).toBe(true);

      // Advance timer for polling
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Wait for async operations to complete
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.results).toEqual(mockResults);
      expect(result.current.isProcessing).toBe(false);
    });

    it('handles process error', async () => {
      const mockUpload = {
        upload_id: 'u1',
        filename: 'test.csv',
        rows: 5,
        columns: ['a'],
        preview: [],
      };

      mockedApi.uploadFile.mockResolvedValueOnce(mockUpload);
      mockedApi.processTasks.mockRejectedValueOnce(new Error('Process failed'));

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.upload(new File([''], 'test.csv'));
      });

      await act(async () => {
        await result.current.process();
      });

      expect(result.current.error).toBe('Process failed');
      expect(result.current.isProcessing).toBe(false);
    });

    it('handles non-Error process rejection', async () => {
      const mockUpload = {
        upload_id: 'u1',
        filename: 'test.csv',
        rows: 5,
        columns: ['a'],
        preview: [],
      };

      mockedApi.uploadFile.mockResolvedValueOnce(mockUpload);
      mockedApi.processTasks.mockRejectedValueOnce('string error');

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.upload(new File([''], 'test.csv'));
      });

      await act(async () => {
        await result.current.process();
      });

      expect(result.current.error).toBe('Erro ao processar tarefas');
    });

    it('handles polling error', async () => {
      const mockUpload = {
        upload_id: 'u1',
        filename: 'test.csv',
        rows: 5,
        columns: ['a'],
        preview: [],
      };

      mockedApi.uploadFile.mockResolvedValueOnce(mockUpload);
      mockedApi.processTasks.mockResolvedValueOnce({
        upload_id: 'u1',
        tasks: [],
      });
      mockedApi.getStatus.mockRejectedValueOnce(new Error('Poll failed'));

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.upload(new File([''], 'test.csv'));
      });

      await act(async () => {
        await result.current.process();
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.error).toBe('Poll failed');
      expect(result.current.isProcessing).toBe(false);
    });

    it('handles non-Error polling rejection', async () => {
      const mockUpload = {
        upload_id: 'u1',
        filename: 'test.csv',
        rows: 5,
        columns: ['a'],
        preview: [],
      };

      mockedApi.uploadFile.mockResolvedValueOnce(mockUpload);
      mockedApi.processTasks.mockResolvedValueOnce({
        upload_id: 'u1',
        tasks: [],
      });
      mockedApi.getStatus.mockRejectedValueOnce('string error');

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.upload(new File([''], 'test.csv'));
      });

      await act(async () => {
        await result.current.process();
      });

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.error).toBe('Erro ao verificar status');
    });
  });

  describe('reset', () => {
    it('clears all state', async () => {
      const mockUpload = {
        upload_id: 'u1',
        filename: 'test.csv',
        rows: 5,
        columns: ['a'],
        preview: [],
      };
      mockedApi.uploadFile.mockResolvedValueOnce(mockUpload);

      const { result } = renderHook(() => useTasks());

      await act(async () => {
        await result.current.upload(new File([''], 'test.csv'));
      });

      expect(result.current.uploadResponse).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.uploadResponse).toBeNull();
      expect(result.current.tasks).toEqual([]);
      expect(result.current.results).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});
