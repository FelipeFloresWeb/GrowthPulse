import React from 'react';
import { render, screen } from '@testing-library/react';
import MetricsCards from '@/components/MetricsCards';

const mockMetrics = {
  total_revenue: 1500000,
  total_clients: 250,
  avg_revenue_per_client: 6000,
  churn_rate: 0.08,
  cac: 1200,
  ltv: 36000,
};

describe('MetricsCards', () => {
  it('renders metrics container', () => {
    render(<MetricsCards metrics={mockMetrics} />);
    expect(screen.getByTestId('metrics-cards')).toBeInTheDocument();
  });

  it('renders all 6 metric cards', () => {
    render(<MetricsCards metrics={mockMetrics} />);
    expect(screen.getByTestId('metric-total_revenue')).toBeInTheDocument();
    expect(screen.getByTestId('metric-total_clients')).toBeInTheDocument();
    expect(screen.getByTestId('metric-avg_revenue_per_client')).toBeInTheDocument();
    expect(screen.getByTestId('metric-churn_rate')).toBeInTheDocument();
    expect(screen.getByTestId('metric-cac')).toBeInTheDocument();
    expect(screen.getByTestId('metric-ltv')).toBeInTheDocument();
  });

  it('renders metric labels', () => {
    render(<MetricsCards metrics={mockMetrics} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Clients')).toBeInTheDocument();
    expect(screen.getByText('Avg Revenue/Client')).toBeInTheDocument();
    expect(screen.getByText('Churn Rate')).toBeInTheDocument();
    expect(screen.getByText('CAC')).toBeInTheDocument();
    expect(screen.getByText('LTV')).toBeInTheDocument();
  });

  it('formats total_clients as number', () => {
    render(<MetricsCards metrics={mockMetrics} />);
    const card = screen.getByTestId('metric-total_clients');
    expect(card).toHaveTextContent('250');
  });

  it('formats churn_rate as percentage', () => {
    render(<MetricsCards metrics={mockMetrics} />);
    const card = screen.getByTestId('metric-churn_rate');
    // 0.08 = 8.0% in en-US
    expect(card).toHaveTextContent('8.0%');
  });
});
