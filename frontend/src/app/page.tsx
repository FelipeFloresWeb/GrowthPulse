'use client';

import React from 'react';
import { useTasks } from '@/hooks/useTasks';
import FileUpload from '@/components/FileUpload';
import TaskPipeline from '@/components/TaskPipeline';
import MetricsCards from '@/components/MetricsCards';
import GrowthScore from '@/components/GrowthScore';
import DataTable from '@/components/DataTable';

export default function HomePage() {
  const {
    uploadResponse,
    tasks,
    results,
    isUploading,
    isProcessing,
    error,
    upload,
    process,
    reset,
  } = useTasks();

  const hasResults = !!results;
  const hasTasks = tasks.length > 0;

  return (
    <main
      data-testid="home-page"
      className="min-h-screen bg-gray-950 py-12 px-4"
    >
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1
          data-testid="hero-title"
          className="text-4xl md:text-5xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-purple-400"
        >
          GrowthPulse Marketing
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Marketing intelligence to drive your business growth.
          Upload your data and receive AI-powered analysis.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          data-testid="error-banner"
          className="max-w-xl mx-auto mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800 text-red-300 text-sm text-center"
        >
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      <section className="mb-8">
        <FileUpload
          onUpload={upload}
          onProcess={process}
          isUploading={isUploading}
          isProcessing={isProcessing}
          uploadedFilename={uploadResponse?.filename}
          uploadedRows={uploadResponse?.rows}
        />
      </section>

      {/* Step 2: Pipeline */}
      {hasTasks && (
        <section className="mb-8 transition-opacity duration-500">
          <TaskPipeline tasks={tasks} />
        </section>
      )}

      {/* Step 3: Results */}
      {hasResults && (
        <div className="space-y-8 transition-opacity duration-500">
          {results.metrics && (
            <section>
              <MetricsCards metrics={results.metrics} />
            </section>
          )}

          {results.analysis && (
            <section>
              <GrowthScore analysis={results.analysis} />
            </section>
          )}

          {results.normalized_data && results.normalized_data.length > 0 && (
            <section>
              <DataTable data={results.normalized_data} />
            </section>
          )}

          {/* Reset Button */}
          <div className="flex justify-center">
            <button
              data-testid="reset-button"
              onClick={reset}
              className="px-6 py-2 rounded-lg text-sm font-medium text-gray-400 border border-gray-700 hover:bg-gray-800 hover:text-gray-200 transition-colors"
            >
              New Analysis
            </button>
          </div>
        </div>
      )}

      {/* Footer Badge */}
      <footer className="mt-16 text-center">
        <span
          data-testid="footer-badge"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 border border-gray-800 text-xs text-gray-500"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Powered by AWS SQS + OpenAI GPT
        </span>
      </footer>
    </main>
  );
}
