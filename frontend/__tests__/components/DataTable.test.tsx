import React from 'react';
import { render, screen } from '@testing-library/react';
import DataTable from '@/components/DataTable';

const mockData = [
  { name: 'Company A', revenue: 50000, sector: 'Tech' },
  { name: 'Company B', revenue: 75000, sector: 'Health' },
  { name: 'Company C', revenue: 30000, sector: 'Retail' },
];

describe('DataTable', () => {
  it('renders nothing for empty data', () => {
    const { container } = render(<DataTable data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for undefined-like empty array', () => {
    const { container } = render(<DataTable data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders table container', () => {
    render(<DataTable data={mockData} />);
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<DataTable data={mockData} />);
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('revenue')).toBeInTheDocument();
    expect(screen.getByText('sector')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<DataTable data={mockData} />);
    expect(screen.getByTestId('table-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('table-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('table-row-2')).toBeInTheDocument();
  });

  it('renders cell values', () => {
    render(<DataTable data={mockData} />);
    expect(screen.getByText('Company A')).toBeInTheDocument();
    expect(screen.getByText('75000')).toBeInTheDocument();
    expect(screen.getByText('Retail')).toBeInTheDocument();
  });

  it('shows record count', () => {
    render(<DataTable data={mockData} />);
    expect(screen.getByText('Showing 3 of 3 records')).toBeInTheDocument();
  });

  it('limits to 10 rows', () => {
    const largeData = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    render(<DataTable data={largeData} />);
    expect(screen.getByText('Showing 10 of 20 records')).toBeInTheDocument();
    expect(screen.getByTestId('table-row-9')).toBeInTheDocument();
    expect(screen.queryByTestId('table-row-10')).not.toBeInTheDocument();
  });

  it('renders section title', () => {
    render(<DataTable data={mockData} />);
    expect(screen.getByText('Normalized Data')).toBeInTheDocument();
  });

  it('handles null/undefined cell values', () => {
    const dataWithNull = [{ a: null, b: undefined, c: 'ok' }];
    render(<DataTable data={dataWithNull as unknown as Record<string, unknown>[]} />);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
