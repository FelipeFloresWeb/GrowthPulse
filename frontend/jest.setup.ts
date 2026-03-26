import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock DataTransfer
class MockDataTransfer {
  items: { add: jest.Mock };
  files: File[];
  constructor() {
    this.files = [];
    this.items = { add: jest.fn() };
  }
}
global.DataTransfer = MockDataTransfer as unknown as typeof DataTransfer;
