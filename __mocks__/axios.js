const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn()
};

const mockAxiosCreate = jest.fn(() => mockAxiosInstance);

module.exports = {
  create: mockAxiosCreate,
  ...mockAxiosInstance
};