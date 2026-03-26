'use client';

import React, { useState, useRef, DragEvent } from 'react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  onProcess: () => void;
  isUploading: boolean;
  isProcessing: boolean;
  uploadedFilename?: string;
  uploadedRows?: number;
}

export default function FileUpload({
  onUpload,
  onProcess,
  isUploading,
  isProcessing,
  uploadedFilename,
  uploadedRows,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      onUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const isUploaded = !!uploadedFilename;

  return (
    <div data-testid="file-upload" className="w-full max-w-xl mx-auto">
      <div
        data-testid="drop-zone"
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragging
            ? 'border-emerald-400 bg-emerald-400/10 scale-105'
            : isUploaded
              ? 'border-emerald-600 bg-emerald-900/20'
              : 'border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-900/80'
          }
        `}
      >
        {isUploading ? (
          <div data-testid="upload-spinner" className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-10 w-10 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <p className="text-gray-300">Uploading file...</p>
          </div>
        ) : isUploaded ? (
          <div data-testid="upload-success" className="flex flex-col items-center gap-2">
            <svg
              className="h-10 w-10 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-emerald-300 font-semibold">{uploadedFilename}</p>
            <p className="text-gray-400 text-sm">
              {uploadedRows} rows loaded
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <svg
              className="h-12 w-12 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-300 font-medium">
              Drag your CSV file here
            </p>
            <p className="text-gray-500 text-sm">or click to browse</p>
          </div>
        )}

        <input
          ref={inputRef}
          data-testid="file-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {isUploaded && !isProcessing && (
        <div className="mt-4 flex justify-center">
          <button
            data-testid="process-button"
            onClick={onProcess}
            className="
              px-8 py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-emerald-600 to-emerald-500
              hover:from-emerald-500 hover:to-emerald-400
              transition-all duration-300 shadow-lg shadow-emerald-900/30
              hover:shadow-emerald-800/40 hover:scale-105
            "
          >
            Process
          </button>
        </div>
      )}
    </div>
  );
}
