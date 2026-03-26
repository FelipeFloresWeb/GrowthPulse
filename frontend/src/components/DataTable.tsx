'use client';

import React from 'react';

interface DataTableProps {
  data: Record<string, unknown>[];
}

export default function DataTable({ data }: DataTableProps) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const displayData = data.slice(0, 10);

  return (
    <div
      data-testid="data-table"
      className="w-full max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300">
          Normalized Data
        </h3>
        <p className="text-xs text-gray-500">
          Showing {displayData.length} of {data.length} records
        </p>
      </div>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody data-testid="table-body">
            {displayData.map((row, i) => (
              <tr
                key={i}
                data-testid={`table-row-${i}`}
                className={`
                  border-t border-gray-800/50
                  ${i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'}
                  hover:bg-gray-800/30 transition-colors
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2 text-gray-300 whitespace-nowrap"
                  >
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
