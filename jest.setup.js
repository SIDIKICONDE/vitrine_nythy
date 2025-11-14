/**
 * Jest setup file
 * Mock jsdom and dompurify for server-side rendering tests
 */

// Mock JSDOM to avoid ESM import issues
jest.mock('jsdom', () => ({
  JSDOM: class MockJSDOM {
    constructor() {
      this.window = {
        document: {
          createElement: () => ({}),
        },
      };
    }
  },
}));

// Mock DOMPurify to provide a basic sanitization function
jest.mock('dompurify', () => ({
  __esModule: true,
  default: (window) => ({
    sanitize: (dirty, config) => {
      if (!dirty || typeof dirty !== 'string') return '';
      
      // Simple sanitization logic for tests
      if (config?.ALLOWED_TAGS?.length === 0) {
        // Strip all HTML tags
        return dirty.replace(/<[^>]*>/g, '');
      }
      
      // Allow some basic tags
      const allowedTags = config?.ALLOWED_TAGS || [];
      let result = dirty;
      
      // Remove dangerous tags
      result = result.replace(/<script[^>]*>.*?<\/script>/gi, '');
      result = result.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
      result = result.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
      
      // If allowed tags is empty array, remove all tags
      if (Array.isArray(allowedTags) && allowedTags.length === 0) {
        result = result.replace(/<[^>]*>/g, '');
      }
      
      return result;
    },
  }),
}));

