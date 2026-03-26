import React from 'react';
import { render, screen } from '@testing-library/react';
import GrowthScore from '@/components/GrowthScore';

const mockAnalysis = {
  growth_score: 78,
  potential_revenue_increase: 35.5,
  recommendations: [
    'Invest in digital marketing',
    'Expand to new markets',
    'Reduce churn rate',
  ],
  risk_level: 'low' as const,
  market_position: 'growing' as const,
};

describe('GrowthScore', () => {
  it('renders growth score container', () => {
    render(<GrowthScore analysis={mockAnalysis} />);
    expect(screen.getByTestId('growth-score')).toBeInTheDocument();
  });

  it('displays the score value', () => {
    render(<GrowthScore analysis={mockAnalysis} />);
    expect(screen.getByTestId('score-value')).toHaveTextContent('78');
  });

  it('renders the score gauge', () => {
    render(<GrowthScore analysis={mockAnalysis} />);
    expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
  });

  it('displays potential revenue increase', () => {
    render(<GrowthScore analysis={mockAnalysis} />);
    const el = screen.getByTestId('revenue-increase');
    expect(el).toHaveTextContent('+35.5%');
  });

  it('displays risk badge with low risk', () => {
    render(<GrowthScore analysis={mockAnalysis} />);
    const badge = screen.getByTestId('risk-badge');
    expect(badge).toHaveTextContent('Risk: Low');
  });

  it('displays medium risk', () => {
    render(
      <GrowthScore
        analysis={{ ...mockAnalysis, risk_level: 'medium' }}
      />
    );
    expect(screen.getByTestId('risk-badge')).toHaveTextContent('Risk: Medium');
  });

  it('displays high risk', () => {
    render(
      <GrowthScore
        analysis={{ ...mockAnalysis, risk_level: 'high' }}
      />
    );
    expect(screen.getByTestId('risk-badge')).toHaveTextContent('Risk: High');
  });

  it('displays market position', () => {
    render(<GrowthScore analysis={mockAnalysis} />);
    expect(screen.getByTestId('position-badge')).toHaveTextContent('Growing');
  });

  it('displays all market positions', () => {
    const positions = [
      { key: 'emerging', label: 'Emerging' },
      { key: 'established', label: 'Established' },
      { key: 'dominant', label: 'Dominant' },
    ] as const;

    positions.forEach(({ key, label }) => {
      const { unmount } = render(
        <GrowthScore
          analysis={{ ...mockAnalysis, market_position: key }}
        />
      );
      expect(screen.getByTestId('position-badge')).toHaveTextContent(label);
      unmount();
    });
  });

  it('renders all recommendations', () => {
    render(<GrowthScore analysis={mockAnalysis} />);
    const list = screen.getByTestId('recommendations-list');
    expect(list).toBeInTheDocument();
    expect(screen.getByText('Invest in digital marketing')).toBeInTheDocument();
    expect(screen.getByText('Expand to new markets')).toBeInTheDocument();
    expect(screen.getByText('Reduce churn rate')).toBeInTheDocument();
  });

  it('renders section header', () => {
    render(<GrowthScore analysis={mockAnalysis} />);
    expect(screen.getByText('Growth Analysis (AI)')).toBeInTheDocument();
  });

  it('uses green color for high score', () => {
    render(<GrowthScore analysis={{ ...mockAnalysis, growth_score: 80 }} />);
    const scoreEl = screen.getByTestId('score-value');
    expect(scoreEl).toHaveStyle({ color: '#10b981' });
  });

  it('uses yellow color for medium score', () => {
    render(<GrowthScore analysis={{ ...mockAnalysis, growth_score: 50 }} />);
    const scoreEl = screen.getByTestId('score-value');
    expect(scoreEl).toHaveStyle({ color: '#f59e0b' });
  });

  it('uses red color for low score', () => {
    render(<GrowthScore analysis={{ ...mockAnalysis, growth_score: 20 }} />);
    const scoreEl = screen.getByTestId('score-value');
    expect(scoreEl).toHaveStyle({ color: '#ef4444' });
  });
});
