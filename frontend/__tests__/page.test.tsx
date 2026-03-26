import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/app/page';
import { useTasks } from '@/hooks/useTasks';

jest.mock('@/hooks/useTasks');
const mockedUseTasks = useTasks as jest.MockedFunction<typeof useTasks>;

const defaultHookReturn = {
  uploadResponse: null,
  tasks: [],
  results: null,
  isUploading: false,
  isProcessing: false,
  error: null,
  upload: jest.fn(),
  process: jest.fn(),
  reset: jest.fn(),
};

describe('HomePage', () => {
  beforeEach(() => {
    mockedUseTasks.mockReturnValue({ ...defaultHookReturn });
  });

  it('renders hero title', () => {
    render(<HomePage />);
    expect(screen.getByTestId('hero-title')).toHaveTextContent('GrowthPulse Marketing');
  });

  it('renders the page', () => {
    render(<HomePage />);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders footer badge', () => {
    render(<HomePage />);
    expect(screen.getByTestId('footer-badge')).toHaveTextContent(
      'Powered by AWS SQS + OpenAI GPT'
    );
  });

  it('shows file upload by default', () => {
    render(<HomePage />);
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('does not show task pipeline without tasks', () => {
    render(<HomePage />);
    expect(screen.queryByTestId('task-pipeline')).not.toBeInTheDocument();
  });

  it('shows task pipeline when tasks exist', () => {
    mockedUseTasks.mockReturnValue({
      ...defaultHookReturn,
      tasks: [
        { task_id: 't1', task_type: 'normalize', status: 'processing' },
      ],
    });
    render(<HomePage />);
    expect(screen.getByTestId('task-pipeline')).toBeInTheDocument();
  });

  it('passes uploadResponse data to FileUpload', () => {
    mockedUseTasks.mockReturnValue({
      ...defaultHookReturn,
      uploadResponse: {
        upload_id: 'u1',
        filename: 'data.csv',
        rows: 100,
        columns: ['a'],
        preview: [],
      },
    });
    render(<HomePage />);
    expect(screen.getByText('data.csv')).toBeInTheDocument();
    expect(screen.getByText('100 rows loaded')).toBeInTheDocument();
  });

  it('shows error banner when error exists', () => {
    mockedUseTasks.mockReturnValue({
      ...defaultHookReturn,
      error: 'Algo deu errado',
    });
    render(<HomePage />);
    expect(screen.getByTestId('error-banner')).toHaveTextContent('Algo deu errado');
  });

  it('does not show error banner when no error', () => {
    render(<HomePage />);
    expect(screen.queryByTestId('error-banner')).not.toBeInTheDocument();
  });

  it('shows results when available', () => {
    mockedUseTasks.mockReturnValue({
      ...defaultHookReturn,
      results: {
        upload_id: 'u1',
        metrics: {
          total_revenue: 100000,
          total_clients: 50,
          avg_revenue_per_client: 2000,
          churn_rate: 0.05,
          cac: 500,
          ltv: 10000,
        },
        analysis: {
          growth_score: 75,
          potential_revenue_increase: 25,
          recommendations: ['Do X'],
          risk_level: 'low',
          market_position: 'growing',
        },
        normalized_data: [{ a: '1', b: '2' }],
      },
    });
    render(<HomePage />);
    expect(screen.getByTestId('metrics-cards')).toBeInTheDocument();
    expect(screen.getByTestId('growth-score')).toBeInTheDocument();
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByTestId('reset-button')).toBeInTheDocument();
  });

  it('does not show data table when normalized_data is empty', () => {
    mockedUseTasks.mockReturnValue({
      ...defaultHookReturn,
      results: {
        upload_id: 'u1',
        metrics: {
          total_revenue: 100000,
          total_clients: 50,
          avg_revenue_per_client: 2000,
          churn_rate: 0.05,
          cac: 500,
          ltv: 10000,
        },
        normalized_data: [],
      },
    });
    render(<HomePage />);
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });

  it('calls reset when reset button clicked', async () => {
    const resetFn = jest.fn();
    mockedUseTasks.mockReturnValue({
      ...defaultHookReturn,
      reset: resetFn,
      results: {
        upload_id: 'u1',
        metrics: {
          total_revenue: 100000,
          total_clients: 50,
          avg_revenue_per_client: 2000,
          churn_rate: 0.05,
          cac: 500,
          ltv: 10000,
        },
      },
    });
    render(<HomePage />);
    await userEvent.click(screen.getByTestId('reset-button'));
    expect(resetFn).toHaveBeenCalledTimes(1);
  });

  it('does not show results sections when not available', () => {
    mockedUseTasks.mockReturnValue({
      ...defaultHookReturn,
      results: {
        upload_id: 'u1',
      },
    });
    render(<HomePage />);
    expect(screen.queryByTestId('metrics-cards')).not.toBeInTheDocument();
    expect(screen.queryByTestId('growth-score')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });
});
