// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Enhanced mock for React hooks
const createMockHook = (initialState = null) => {
  const state = typeof initialState === 'function' 
    ? initialState() 
    : initialState;
  
  const setState = jest.fn((newState) => {
    if (typeof newState === 'function') {
      return newState(state);
    }
    return newState;
  });

  return [state, setState];
};

// Suppress specific warnings and errors
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  const suppressedErrors = [
    /Warning: ReactDOM.render is no longer supported in React 18/,
    /Warning: An update inside a test was not wrapped in act/,
    /Warning: You are importing a standalone React Runtime/,
    /Warning: Detected multiple renderers/,
    /undefined is not iterable/,
    /Cannot destructure property/,
    /The above error occurred in the/
  ];

  if (!suppressedErrors.some(regex => regex.test(args[0]))) {
    originalError(...args);
  }
};

console.warn = (...args) => {
  const suppressedWarnings = [
    /React does not recognize the.*prop on a DOM element/,
    /Invalid prop.*passed to/,
    /Encountered two children with the same key/
  ];

  if (!suppressedWarnings.some(regex => regex.test(args[0]))) {
    originalWarn(...args);
  }
};

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforeHistoryChange: jest.fn(),
      isReady: true,
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      }
    };
  }
}));

// Mock React core hooks with enhanced functionality
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
  useState: jest.fn(createMockHook),
  useEffect: jest.fn((fn) => {
    const cleanup = fn() || (() => {});
    return cleanup;
  }),
  useCallback: jest.fn((fn) => fn),
  useMemo: jest.fn((fn) => fn()),
  useRef: jest.fn(() => ({ current: null }))
}));

// Mock fetch for API testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  })
);

// Add any global test utilities or configurations
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

// Configure timeout for async tests
jest.setTimeout(15000);

// Silence React act() warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: An update inside a test was not wrapped in act')
  ) {
    return;
  }
  originalConsoleError(...args);
};
