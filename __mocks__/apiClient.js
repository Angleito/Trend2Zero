const mockApiClient = {
  interceptors: {
    request: {
      use: jest.fn((successHandler, errorHandler) => {
        return successHandler;
      })
    },
    response: {
      use: jest.fn((successHandler, errorHandler) => {
        return successHandler;
      })
    }
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn()
};

module.exports = mockApiClient;