import React from 'react';
import { render, screen } from '@testing-library/react';
import TaskPipeline from '@/components/TaskPipeline';
import { TaskInfo } from '@/types';

describe('TaskPipeline', () => {
  it('renders pipeline container', () => {
    render(<TaskPipeline tasks={[]} />);
    expect(screen.getByTestId('task-pipeline')).toBeInTheDocument();
  });

  it('renders all three task steps', () => {
    render(<TaskPipeline tasks={[]} />);
    expect(screen.getByTestId('task-normalize')).toBeInTheDocument();
    expect(screen.getByTestId('task-collect')).toBeInTheDocument();
    expect(screen.getByTestId('task-analyze')).toBeInTheDocument();
  });

  it('shows labels for each task', () => {
    render(<TaskPipeline tasks={[]} />);
    expect(screen.getByText('Normalization')).toBeInTheDocument();
    expect(screen.getByText('Collection')).toBeInTheDocument();
    expect(screen.getByText('AI Analysis (GPT)')).toBeInTheDocument();
  });

  it('shows pending status by default', () => {
    render(<TaskPipeline tasks={[]} />);
    const statuses = screen.getAllByText('Pending');
    expect(statuses).toHaveLength(3);
  });

  it('shows processing status', () => {
    const tasks: TaskInfo[] = [
      { task_id: 't1', task_type: 'normalize', status: 'processing' },
    ];
    render(<TaskPipeline tasks={tasks} />);
    expect(screen.getByTestId('status-normalize')).toHaveTextContent('Processing');
  });

  it('shows completed status', () => {
    const tasks: TaskInfo[] = [
      { task_id: 't1', task_type: 'normalize', status: 'completed' },
    ];
    render(<TaskPipeline tasks={tasks} />);
    expect(screen.getByTestId('status-normalize')).toHaveTextContent('Completed');
  });

  it('shows failed status', () => {
    const tasks: TaskInfo[] = [
      { task_id: 't1', task_type: 'collect', status: 'failed' },
    ];
    render(<TaskPipeline tasks={tasks} />);
    expect(screen.getByTestId('status-collect')).toHaveTextContent('Failed');
  });

  it('renders connecting lines between steps', () => {
    render(<TaskPipeline tasks={[]} />);
    expect(screen.getByTestId('pipeline-line-1')).toBeInTheDocument();
    expect(screen.getByTestId('pipeline-line-2')).toBeInTheDocument();
  });

  it('handles all tasks with different statuses', () => {
    const tasks: TaskInfo[] = [
      { task_id: 't1', task_type: 'normalize', status: 'completed' },
      { task_id: 't2', task_type: 'collect', status: 'processing' },
      { task_id: 't3', task_type: 'analyze', status: 'pending' },
    ];
    render(<TaskPipeline tasks={tasks} />);
    expect(screen.getByTestId('status-normalize')).toHaveTextContent('Completed');
    expect(screen.getByTestId('status-collect')).toHaveTextContent('Processing');
    expect(screen.getByTestId('status-analyze')).toHaveTextContent('Pending');
  });
});
