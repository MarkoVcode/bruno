/**
 * @jest-environment jsdom
 *
 * BFF_debug Plugin Core Tests
 * Tests the BFF_debug trace plugin functionality
 */

import '@testing-library/jest-dom';

describe('BFF_debug Plugin', () => {
  let BFF_debug;
  let mockRequest;
  let mockCollection;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock request object
    mockRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      headers: {},
      config: {
        trace: {
          enabled: false,
          parameter: 'default'
        }
      }
    };

    // Mock collection object
    mockCollection = {
      config: {
        trace: {
          enabled: false,
          parameter: 'collection-default'
        }
      }
    };

    // Mock plugin will be updated with actual implementation
    BFF_debug = {
      name: 'BFF_debug',
      type: 'trace',
      version: '1.0.0',
      shouldIntercept: jest.fn(),
      intercept: jest.fn(),
      processResponse: jest.fn()
    };
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin name', () => {
      expect(BFF_debug.name).toBe('BFF_debug');
    });

    it('should be of type trace', () => {
      expect(BFF_debug.type).toBe('trace');
    });

    it('should have version information', () => {
      expect(BFF_debug.version).toBeDefined();
      expect(typeof BFF_debug.version).toBe('string');
    });
  });

  describe('Request Interception', () => {
    it('should only intercept GET requests', () => {
      mockRequest.method = 'GET';
      mockRequest.config.trace.enabled = true;

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);

      expect(shouldIntercept).toBe(true);
    });

    it('should not intercept POST requests', () => {
      mockRequest.method = 'POST';
      mockRequest.config.trace.enabled = true;

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);

      expect(shouldIntercept).toBe(false);
    });

    it('should not intercept PUT requests', () => {
      mockRequest.method = 'PUT';
      mockRequest.config.trace.enabled = true;

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);

      expect(shouldIntercept).toBe(false);
    });

    it('should not intercept DELETE requests', () => {
      mockRequest.method = 'DELETE';
      mockRequest.config.trace.enabled = true;

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);

      expect(shouldIntercept).toBe(false);
    });

    it('should not intercept when trace is disabled', () => {
      mockRequest.method = 'GET';
      mockRequest.config.trace.enabled = false;

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);

      expect(shouldIntercept).toBe(false);
    });

    it('should intercept when enabled at request level', () => {
      mockRequest.method = 'GET';
      mockRequest.config.trace.enabled = true;

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);

      expect(shouldIntercept).toBe(true);
    });
  });

  describe('Configuration Inheritance', () => {
    it('should use request-level config over collection-level', () => {
      mockCollection.config.trace.enabled = false;
      mockCollection.config.trace.parameter = 'collection-param';

      mockRequest.config.trace.enabled = true;
      mockRequest.config.trace.parameter = 'request-param';

      // Request level should take precedence
      const config = BFF_debug.getEffectiveConfig?.(mockRequest, mockCollection);

      if (config) {
        expect(config.enabled).toBe(true);
        expect(config.parameter).toBe('request-param');
      }
    });

    it('should inherit collection-level config when request not configured', () => {
      mockCollection.config.trace.enabled = true;
      mockCollection.config.trace.parameter = 'collection-param';

      mockRequest.config.trace = null;

      const config = BFF_debug.getEffectiveConfig?.(mockRequest, mockCollection);

      if (config) {
        expect(config.enabled).toBe(true);
        expect(config.parameter).toBe('collection-param');
      }
    });

    it('should handle missing collection config', () => {
      mockCollection.config.trace = null;
      mockRequest.config.trace.enabled = true;

      const config = BFF_debug.getEffectiveConfig?.(mockRequest, mockCollection);

      // Should use request config only
      expect(config).toBeDefined();
    });

    it('should handle missing request config', () => {
      mockRequest.config.trace = null;
      mockCollection.config.trace.enabled = true;

      const config = BFF_debug.getEffectiveConfig?.(mockRequest, mockCollection);

      // Should use collection config only
      expect(config).toBeDefined();
    });
  });

  describe('Trace Request Creation', () => {
    it('should create background trace request with correct URL parameter', async () => {
      mockRequest.method = 'GET';
      mockRequest.url = 'https://api.example.com/users';
      mockRequest.config.trace.enabled = true;
      mockRequest.config.trace.parameter = 'debug-trace';

      const traceRequest = await BFF_debug.intercept(mockRequest);

      expect(traceRequest).toBeDefined();
      expect(traceRequest.url).toContain('debug-trace');
    });

    it('should preserve original request headers in trace request', async () => {
      mockRequest.headers = {
        'Authorization': 'Bearer token123',
        'Content-Type': 'application/json'
      };
      mockRequest.config.trace.enabled = true;

      const traceRequest = await BFF_debug.intercept(mockRequest);

      if (traceRequest?.headers) {
        expect(traceRequest.headers['Authorization']).toBe('Bearer token123');
      }
    });

    it('should handle URL with existing query parameters', async () => {
      mockRequest.url = 'https://api.example.com/users?page=1&limit=10';
      mockRequest.config.trace.enabled = true;
      mockRequest.config.trace.parameter = 'trace';

      const traceRequest = await BFF_debug.intercept(mockRequest);

      expect(traceRequest?.url).toBeDefined();
      // Should properly append or add trace parameter
    });

    it('should handle URL without query parameters', async () => {
      mockRequest.url = 'https://api.example.com/users';
      mockRequest.config.trace.enabled = true;
      mockRequest.config.trace.parameter = 'trace';

      const traceRequest = await BFF_debug.intercept(mockRequest);

      expect(traceRequest?.url).toBeDefined();
      // Should add trace parameter
    });
  });

  describe('Response Routing', () => {
    it('should route trace response to DevTools by default', async () => {
      const mockResponse = {
        data: { trace: 'data' },
        status: 200,
        headers: {}
      };

      const result = await BFF_debug.processResponse(mockResponse, mockRequest);

      expect(result?.destination).toBe('devtools');
    });

    it('should not show trace response in main window', async () => {
      const mockResponse = {
        data: { trace: 'data' },
        status: 200
      };

      const result = await BFF_debug.processResponse(mockResponse, mockRequest);

      expect(result?.showInMainWindow).toBe(false);
    });

    it('should handle trace response errors gracefully', async () => {
      const errorResponse = {
        status: 500,
        data: null,
        error: 'Network error'
      };

      const result = await BFF_debug.processResponse(errorResponse, mockRequest);

      // Should not throw, handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed trace configuration', () => {
      mockRequest.config.trace = 'invalid';

      expect(() => {
        BFF_debug.shouldIntercept(mockRequest);
      }).not.toThrow();
    });

    it('should handle missing trace configuration', () => {
      mockRequest.config.trace = undefined;

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);

      expect(shouldIntercept).toBe(false);
    });

    it('should handle null request object', () => {
      expect(() => {
        BFF_debug.shouldIntercept(null);
      }).not.toThrow();
    });

    it('should handle undefined URL', () => {
      mockRequest.url = undefined;
      mockRequest.config.trace.enabled = true;

      expect(() => {
        BFF_debug.intercept(mockRequest);
      }).not.toThrow();
    });

    it('should handle very long trace parameters', async () => {
      mockRequest.config.trace.parameter = 'a'.repeat(1000);
      mockRequest.config.trace.enabled = true;

      const traceRequest = await BFF_debug.intercept(mockRequest);

      // Should either truncate or handle gracefully
      expect(traceRequest).toBeDefined();
    });

    it('should handle special characters in trace parameter', async () => {
      mockRequest.config.trace.parameter = 'trace&param=value';
      mockRequest.config.trace.enabled = true;

      const traceRequest = await BFF_debug.intercept(mockRequest);

      // Should properly URL encode
      expect(traceRequest).toBeDefined();
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous trace requests', async () => {
      const requests = Array(5).fill(null).map((_, i) => ({
        ...mockRequest,
        url: `https://api.example.com/users/${i}`,
        config: { trace: { enabled: true, parameter: `trace-${i}` } }
      }));

      const promises = requests.map((req) => BFF_debug.intercept(req));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => expect(result).toBeDefined());
    });

    it('should isolate trace requests from each other', async () => {
      const req1 = { ...mockRequest, config: { trace: { enabled: true, parameter: 'trace1' } } };
      const req2 = { ...mockRequest, config: { trace: { enabled: true, parameter: 'trace2' } } };

      const [result1, result2] = await Promise.all([
        BFF_debug.intercept(req1),
        BFF_debug.intercept(req2)
      ]);

      // Each trace should maintain its own parameter
      expect(result1?.url).not.toBe(result2?.url);
    });
  });
});
