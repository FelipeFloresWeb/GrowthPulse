'use client';

import React from 'react';
import { TaskInfo, TaskStatusType } from '@/types';

interface TaskPipelineProps {
  tasks: TaskInfo[];
}

const TASK_CONFIG = [
  {
    type: 'normalize',
    label: 'Normalization',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
      />
    ),
  },
  {
    type: 'collect',
    label: 'Collection',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    ),
  },
  {
    type: 'analyze',
    label: 'AI Analysis (GPT)',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    ),
  },
];

function getStatusStyles(status: TaskStatusType) {
  switch (status) {
    case 'completed':
      return {
        badge: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
        circle: 'bg-emerald-500 border-emerald-400',
        line: 'bg-emerald-500',
        label: 'Completed',
      };
    case 'processing':
      return {
        badge: 'bg-blue-900/50 text-blue-300 border-blue-700 animate-pulse',
        circle: 'bg-blue-500 border-blue-400 animate-pulse',
        line: 'bg-blue-500',
        label: 'Processing',
      };
    case 'failed':
      return {
        badge: 'bg-red-900/50 text-red-300 border-red-700',
        circle: 'bg-red-500 border-red-400',
        line: 'bg-red-500',
        label: 'Failed',
      };
    default:
      return {
        badge: 'bg-gray-800/50 text-gray-400 border-gray-700',
        circle: 'bg-gray-600 border-gray-500',
        line: 'bg-gray-700',
        label: 'Pending',
      };
  }
}

export default function TaskPipeline({ tasks }: TaskPipelineProps) {
  const getTaskStatus = (type: string): TaskStatusType => {
    const task = tasks.find((t) => t.task_type === type);
    return task?.status || 'pending';
  };

  return (
    <div data-testid="task-pipeline" className="w-full max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between">
        {TASK_CONFIG.map((config, index) => {
          const status = getTaskStatus(config.type);
          const styles = getStatusStyles(status);

          return (
            <React.Fragment key={config.type}>
              {index > 0 && (
                <div
                  data-testid={`pipeline-line-${index}`}
                  className={`flex-1 h-0.5 mx-2 transition-colors duration-500 ${styles.line}`}
                />
              )}
              <div
                data-testid={`task-${config.type}`}
                className="flex flex-col items-center gap-2 min-w-[120px]"
              >
                <div
                  className={`
                    w-14 h-14 rounded-full border-2 flex items-center justify-center
                    transition-all duration-500 ${styles.circle}
                  `}
                >
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {config.icon}
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-200">
                  {config.label}
                </span>
                <span
                  data-testid={`status-${config.type}`}
                  className={`
                    text-xs px-2 py-0.5 rounded-full border
                    transition-all duration-500 ${styles.badge}
                  `}
                >
                  {styles.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
