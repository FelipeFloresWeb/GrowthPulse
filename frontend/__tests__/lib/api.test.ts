import { uploadFile, processTasks, getStatus, getResults } from '@/lib/api';

const mockFetch = global.fetch as jest.Mock;

describe('API Client', () => {
  const BASE_URL = 'http://localhost:8000';

  describe('uploadFile', () => {
    it('sends POST request with FormData', async () => {
      const mockResponse = {
        upload_id: 'u1',
        filename: 'test.csv',
        rows: 10,
        columns: ['name'],
        preview: [{ name: 'Test' }],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const file = new File(['data'], 'test.csv', { type: 'text/csv' });
      const result = await uploadFile(file);

      expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/api/upload`, {
        method: 'POST',
        body: expect.any(FormData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('throws on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      const file = new File(['data'], 'test.csv', { type: 'text/csv' });
      await expect(uploadFile(file)).rejects.toThrow('Erro 400: Bad Request');
    });

    it('handles text() rejection gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => { throw new Error('fail'); },
      });

      const file = new File(['data'], 'test.csv', { type: 'text/csv' });
      await expect(uploadFile(file)).rejects.toThrow('Erro 500: Erro desconhecido');
    });
  });

  describe('processTasks', () => {
    it('sends POST to process endpoint', async () => {
      const mockResponse = {
        upload_id: 'u1',
        tasks: [{ task_id: 't1', task_type: 'normalize', status: 'pending' }],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await processTasks('u1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/tasks/process/u1`,
        { method: 'POST' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getStatus', () => {
    it('sends GET to status endpoint', async () => {
      const mockResponse = {
        upload_id: 'u1',
        tasks: [],
        completed: false,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStatus('u1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/tasks/u1/status`
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getResults', () => {
    it('sends GET to results endpoint', async () => {
      const mockResponse = { upload_id: 'u1', metrics: null };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getResults('u1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/api/tasks/u1/results`
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
