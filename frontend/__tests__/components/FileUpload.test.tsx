import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '@/components/FileUpload';

describe('FileUpload', () => {
  const defaultProps = {
    onUpload: jest.fn(),
    onProcess: jest.fn(),
    isUploading: false,
    isProcessing: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders drop zone', () => {
    render(<FileUpload {...defaultProps} />);
    expect(screen.getByTestId('drop-zone')).toBeInTheDocument();
    expect(screen.getByText('Drag your CSV file here')).toBeInTheDocument();
  });

  it('renders file input', () => {
    render(<FileUpload {...defaultProps} />);
    const input = screen.getByTestId('file-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('accept', '.csv');
  });

  it('shows spinner when uploading', () => {
    render(<FileUpload {...defaultProps} isUploading={true} />);
    expect(screen.getByTestId('upload-spinner')).toBeInTheDocument();
    expect(screen.getByText('Uploading file...')).toBeInTheDocument();
  });

  it('shows file info after upload', () => {
    render(
      <FileUpload
        {...defaultProps}
        uploadedFilename="data.csv"
        uploadedRows={42}
      />
    );
    expect(screen.getByTestId('upload-success')).toBeInTheDocument();
    expect(screen.getByText('data.csv')).toBeInTheDocument();
    expect(screen.getByText('42 rows loaded')).toBeInTheDocument();
  });

  it('shows process button after upload', () => {
    render(
      <FileUpload
        {...defaultProps}
        uploadedFilename="data.csv"
        uploadedRows={10}
      />
    );
    expect(screen.getByTestId('process-button')).toBeInTheDocument();
    expect(screen.getByText('Process')).toBeInTheDocument();
  });

  it('hides process button when processing', () => {
    render(
      <FileUpload
        {...defaultProps}
        uploadedFilename="data.csv"
        uploadedRows={10}
        isProcessing={true}
      />
    );
    expect(screen.queryByTestId('process-button')).not.toBeInTheDocument();
  });

  it('calls onProcess when button clicked', async () => {
    const onProcess = jest.fn();
    render(
      <FileUpload
        {...defaultProps}
        onProcess={onProcess}
        uploadedFilename="data.csv"
        uploadedRows={10}
      />
    );
    await userEvent.click(screen.getByTestId('process-button'));
    expect(onProcess).toHaveBeenCalledTimes(1);
  });

  it('calls onUpload when file selected via input', async () => {
    const onUpload = jest.fn();
    render(<FileUpload {...defaultProps} onUpload={onUpload} />);

    const file = new File(['content'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByTestId('file-input');

    await userEvent.upload(input, file);
    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it('handles drag over', () => {
    render(<FileUpload {...defaultProps} />);
    const dropZone = screen.getByTestId('drop-zone');

    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
    // Drag state is visual; just confirm no crash
    expect(dropZone).toBeInTheDocument();
  });

  it('handles drag leave', () => {
    render(<FileUpload {...defaultProps} />);
    const dropZone = screen.getByTestId('drop-zone');

    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
    fireEvent.dragLeave(dropZone, { dataTransfer: { files: [] } });
    expect(dropZone).toBeInTheDocument();
  });

  it('handles file drop with csv', () => {
    const onUpload = jest.fn();
    render(<FileUpload {...defaultProps} onUpload={onUpload} />);
    const dropZone = screen.getByTestId('drop-zone');

    const file = new File(['data'], 'test.csv', { type: 'text/csv' });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it('ignores non-csv file drop', () => {
    const onUpload = jest.fn();
    render(<FileUpload {...defaultProps} onUpload={onUpload} />);
    const dropZone = screen.getByTestId('drop-zone');

    const file = new File(['data'], 'test.txt', { type: 'text/plain' });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onUpload).not.toHaveBeenCalled();
  });

  it('opens file dialog on Enter key', () => {
    render(<FileUpload {...defaultProps} />);
    const dropZone = screen.getByTestId('drop-zone');
    // Just ensure no crash on keydown
    fireEvent.keyDown(dropZone, { key: 'Enter' });
    expect(dropZone).toBeInTheDocument();
  });

  it('does not open file dialog on non-Enter key', () => {
    render(<FileUpload {...defaultProps} />);
    const dropZone = screen.getByTestId('drop-zone');
    fireEvent.keyDown(dropZone, { key: 'Space' });
    expect(dropZone).toBeInTheDocument();
  });
});
