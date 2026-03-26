'use client';

import React from 'react';

interface Metrics {
  total_revenue: number;
  total_clients: number;
  avg_revenue_per_client: number;
  churn_rate: number;
  cac: number;
  ltv: number;
}

interface MetricsCardsProps {
  metrics: Metrics;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatPercent(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

const METRIC_CONFIG = [
  {
    key: 'total_revenue' as const,
    label: 'Total Revenue',
    format: formatCurrency,
    color: 'from-emerald-600 to-emerald-800',
    textColor: 'text-emerald-400',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    key: 'total_clients' as const,
    label: 'Total Clients',
    format: formatNumber,
    color: 'from-blue-600 to-blue-800',
    textColor: 'text-blue-400',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
  {
    key: 'avg_revenue_per_client' as const,
    label: 'Avg Revenue/Client',
    format: formatCurrency,
    color: 'from-purple-600 to-purple-800',
    textColor: 'text-purple-400',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
  {
    key: 'churn_rate' as const,
    label: 'Churn Rate',
    format: formatPercent,
    color: 'from-orange-600 to-red-800',
    textColor: 'text-orange-400',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
  },
  {
    key: 'cac' as const,
    label: 'CAC',
    format: formatCurrency,
    color: 'from-yellow-600 to-yellow-800',
    textColor: 'text-yellow-400',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
  },
  {
    key: 'ltv' as const,
    label: 'LTV',
    format: formatCurrency,
    color: 'from-teal-600 to-teal-800',
    textColor: 'text-teal-400',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    ),
  },
];

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  return (
    <div
      data-testid="metrics-cards"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl mx-auto"
    >
      {METRIC_CONFIG.map((config) => (
        <div
          key={config.key}
          data-testid={`metric-${config.key}`}
          className={`
            relative overflow-hidden rounded-xl border border-gray-800
            bg-gray-900 p-5 transition-transform duration-300 hover:scale-105
          `}
        >
          <div
            className={`absolute inset-0 opacity-10 bg-gradient-to-br ${config.color}`}
          />
          <div className="relative flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gray-800/80`}>
              <svg
                className={`h-5 w-5 ${config.textColor}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {config.icon}
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                {config.label}
              </p>
              <p className={`text-xl font-bold ${config.textColor}`}>
                {config.format(metrics[config.key])}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
