'use client';

import React from 'react';

interface Analysis {
  growth_score: number;
  potential_revenue_increase: number;
  recommendations: string[];
  risk_level: 'low' | 'medium' | 'high';
  market_position: 'emerging' | 'growing' | 'established' | 'dominant';
}

interface GrowthScoreProps {
  analysis: Analysis;
}

const RISK_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' },
  medium: { label: 'Medium', color: 'bg-yellow-900/50 text-yellow-300 border-yellow-700' },
  high: { label: 'High', color: 'bg-red-900/50 text-red-300 border-red-700' },
};

const POSITION_LABELS: Record<string, string> = {
  emerging: 'Emerging',
  growing: 'Growing',
  established: 'Established',
  dominant: 'Dominant',
};

function getScoreColor(score: number): string {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

export default function GrowthScore({ analysis }: GrowthScoreProps) {
  const {
    growth_score,
    potential_revenue_increase,
    recommendations,
    risk_level,
    market_position,
  } = analysis;

  const scoreColor = getScoreColor(growth_score);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset =
    circumference - (growth_score / 100) * circumference;

  const riskInfo = RISK_LABELS[risk_level] || RISK_LABELS.medium;

  return (
    <div
      data-testid="growth-score"
      className="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <svg
          className="h-5 w-5 text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
        <h2 className="text-lg font-bold text-purple-300">
          Growth Analysis (AI)
        </h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Score Gauge */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-36 h-36" data-testid="score-gauge">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#1f2937"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                data-testid="score-value"
                className="text-3xl font-bold"
                style={{ color: scoreColor }}
              >
                {growth_score}
              </span>
              <span className="text-xs text-gray-400">of 100</span>
            </div>
          </div>

          {/* Potential Revenue */}
          <div
            data-testid="revenue-increase"
            className="text-center bg-gray-800/50 rounded-lg px-4 py-2"
          >
            <p className="text-xs text-gray-400">Revenue Increase Potential</p>
            <p className="text-lg font-bold text-emerald-400">
              +{potential_revenue_increase.toLocaleString('en-US', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}%
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            <span
              data-testid="risk-badge"
              className={`px-3 py-1 rounded-full text-sm border ${riskInfo.color}`}
            >
              Risk: {riskInfo.label}
            </span>
            <span
              data-testid="position-badge"
              className="px-3 py-1 rounded-full text-sm border bg-purple-900/50 text-purple-300 border-purple-700"
            >
              {POSITION_LABELS[market_position] || market_position}
            </span>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Recommendations
            </h3>
            <ol
              data-testid="recommendations-list"
              className="space-y-2"
            >
              {recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="flex gap-2 text-sm text-gray-300"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-900/50 text-purple-300 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
