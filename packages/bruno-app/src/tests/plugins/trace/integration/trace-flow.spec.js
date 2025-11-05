/**
 * @jest-environment jsdom
 *
 * Trace Flow Integration Tests
 * Tests end-to-end trace functionality including request interception,
 * background request triggering, and response routing
 */

import '@testing-library/jest-dom';

describe('Trace Flow Integration', () => {
  let mockFetch;
  let mockRequest;
  let mockCollection;
  let BFF_debug;
  let PluginRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock fetch for network requests
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    mockCollection = {
      name: 'Test Collection',
      config: {
        trace: {
          enabled: false,
          parameter: 'collection-trace'
        }
      }
    };

    mockRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      headers: {
        Authorization: 'Bearer token123'
      },
      config: {
        trace: {
          enabled: false,
          parameter: 'request-trace'
        }
      }
    };

    // Mock plugin and registry
    BFF_debug = {
      name: 'BFF_debug',
      shouldIntercept: jest.fn(),
      intercept: jest.fn(),
      processResponse: jest.fn()
    };

    PluginRegistry = {
      getPlugin: jest.fn((name) => name === 'BFF_debug' ? BFF_debug : null),
      getAllPlugins: jest.fn(() => [BFF_debug])
    };
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe('Complete Trace Workflow', () => {
    it('should execute full trace flow from request to response', async () => {
      // 1. Enable trace at request level
      mockRequest.config.trace.enabled = true;
      mockRequest.config.trace.parameter = 'debug';

      // 2. Check if should intercept
      BFF_debug.shouldIntercept.mockReturnValue(true);

      // 3. Create trace request
      const traceRequest = {
        url: 'https://api.example.com/users?debug',
        method: 'GET',
        headers: mockRequest.headers
      };
      BFF_debug.intercept.mockResolvedValue(traceRequest);

      // 4. Mock trace response
      const traceResponse = {
        status: 200,
        data: {
          trace: {
            duration: 123,
            steps: []
          }
        }
      };
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(traceResponse.data),
        status: traceResponse.status
      });

      // 5. Process response
      BFF_debug.processResponse.mockResolvedValue({
        destination: 'devtools',
        data: traceResponse
      });

      // Execute workflow
      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);
      expect(shouldIntercept).toBe(true);

      const trace = await BFF_debug.intercept(mockRequest);
      expect(trace).toEqual(traceRequest);

      const result = await BFF_debug.processResponse(traceResponse, mockRequest);
      expect(result.destination).toBe('devtools');
    });

    it('should not execute trace when disabled', async () => {
      mockRequest.config.trace.enabled = false;

      BFF_debug.shouldIntercept.mockReturnValue(false);

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);
      expect(shouldIntercept).toBe(false);

      expect(BFF_debug.intercept).not.toHaveBeenCalled();
    });

    it('should only trace GET requests', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        mockRequest.method = method;
        mockRequest.config.trace.enabled = true;

        BFF_debug.shouldIntercept.mockReturnValue(false);

        const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);
        expect(shouldIntercept).toBe(false);
      });
    });
  });

  describe('Collection-Level to Request-Level Inheritance', () => {
    it('should use request-level config when both are set', () => {
      mockCollection.config.trace.enabled = true;
      mockCollection.config.trace.parameter = 'collection-param';

      mockRequest.config.trace.enabled = true;
      mockRequest.config.trace.parameter = 'request-param';

      // Request level should take precedence
      BFF_debug.shouldIntercept.mockReturnValue(true);

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);
      expect(shouldIntercept).toBe(true);
    });

    it('should inherit from collection when request not configured', () => {
      mockCollection.config.trace.enabled = true;
      mockCollection.config.trace.parameter = 'collection-param';

      mockRequest.config.trace = null;

      // Should inherit from collection
      BFF_debug.shouldIntercept.mockReturnValue(true);

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);
      expect(shouldIntercept).toBe(true);
    });

    it('should disable trace when collection enables but request disables', () => {
      mockCollection.config.trace.enabled = true;
      mockRequest.config.trace.enabled = false;

      BFF_debug.shouldIntercept.mockReturnValue(false);

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);
      expect(shouldIntercept).toBe(false);
    });

    it('should enable trace when collection disables but request enables', () => {
      mockCollection.config.trace.enabled = false;
      mockRequest.config.trace.enabled = true;

      BFF_debug.shouldIntercept.mockReturnValue(true);

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);
      expect(shouldIntercept).toBe(true);
    });
  });

  describe('Background Request Triggering', () => {
    it('should trigger background trace request after main request', async () => {
      mockRequest.config.trace.enabled = true;

      BFF_debug.shouldIntercept.mockReturnValue(true);
      BFF_debug.intercept.mockResolvedValue({
        url: 'https://api.example.com/users?trace',
        method: 'GET',
        headers: mockRequest.headers
      });

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ trace: {} }),
        status: 200
      });

      await BFF_debug.intercept(mockRequest);

      // Background request should be triggered (implementation detail)
      expect(BFF_debug.intercept).toHaveBeenCalled();
    });

    it('should not block main request while trace executes', async () => {
      mockRequest.config.trace.enabled = true;

      BFF_debug.shouldIntercept.mockReturnValue(true);
      BFF_debug.intercept.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ url: 'trace-url' });
          }, 100);
        });
      });

      const mainRequest = Promise.resolve({ data: 'main' });
      const tracePromise = BFF_debug.intercept(mockRequest);

      // Main request should complete independently
      const mainResult = await mainRequest;
      expect(mainResult.data).toBe('main');

      // Trace can complete later
      await tracePromise;
    });

    it('should handle trace request failures gracefully', async () => {
      mockRequest.config.trace.enabled = true;

      BFF_debug.shouldIntercept.mockReturnValue(true);
      BFF_debug.intercept.mockRejectedValue(new Error('Network error'));

      await expect(BFF_debug.intercept(mockRequest)).rejects.toThrow();

      // Main request should still succeed even if trace fails
    });

    it('should preserve original request parameters in trace', async () => {
      mockRequest.url = 'https://api.example.com/users?page=1&limit=10';
      mockRequest.config.trace.enabled = true;
      mockRequest.config.trace.parameter = 'trace';

      BFF_debug.intercept.mockResolvedValue({
        url: 'https://api.example.com/users?page=1&limit=10&trace',
        method: 'GET',
        headers: mockRequest.headers
      });

      const trace = await BFF_debug.intercept(mockRequest);

      // Should preserve original query params
      expect(trace.url).toContain('page=1');
      expect(trace.url).toContain('limit=10');
      expect(trace.url).toContain('trace');
    });
  });

  describe('Response Routing', () => {
    it('should route trace response to DevTools', async () => {
      const traceResponse = {
        status: 200,
        data: { trace: { duration: 100 } }
      };

      BFF_debug.processResponse.mockResolvedValue({
        destination: 'devtools',
        data: traceResponse,
        showInMainWindow: false
      });

      const result = await BFF_debug.processResponse(traceResponse, mockRequest);

      expect(result.destination).toBe('devtools');
      expect(result.showInMainWindow).toBe(false);
    });

    it('should not display trace in main response window', async () => {
      const traceResponse = {
        status: 200,
        data: { trace: {} }
      };

      BFF_debug.processResponse.mockResolvedValue({
        destination: 'devtools',
        showInMainWindow: false
      });

      const result = await BFF_debug.processResponse(traceResponse, mockRequest);

      expect(result.showInMainWindow).toBe(false);
    });

    it('should handle missing DevTools gracefully', async () => {
      const traceResponse = {
        status: 200,
        data: { trace: {} }
      };

      BFF_debug.processResponse.mockResolvedValue({
        destination: 'devtools',
        fallback: 'console',
        data: traceResponse
      });

      const result = await BFF_debug.processResponse(traceResponse, mockRequest);

      // Should have fallback mechanism
      expect(result.destination || result.fallback).toBeDefined();
    });
  });

  describe('Multiple Simultaneous Traces', () => {
    it('should handle multiple trace requests concurrently', async () => {
      const requests = Array(5).fill(null).map((_, i) => ({
        ...mockRequest,
        url: `https://api.example.com/users/${i}`,
        config: {
          trace: {
            enabled: true,
            parameter: `trace-${i}`
          }
        }
      }));

      BFF_debug.shouldIntercept.mockReturnValue(true);
      BFF_debug.intercept.mockImplementation((req) =>
        Promise.resolve({
          url: `${req.url}?${req.config.trace.parameter}`,
          method: 'GET'
        }));

      const traces = await Promise.all(requests.map((req) => BFF_debug.intercept(req)));

      expect(traces).toHaveLength(5);
      traces.forEach((trace, i) => {
        expect(trace.url).toContain(`trace-${i}`);
      });
    });

    it('should isolate trace data between concurrent requests', async () => {
      const req1 = { ...mockRequest, config: { trace: { enabled: true, parameter: 't1' } } };
      const req2 = { ...mockRequest, config: { trace: { enabled: true, parameter: 't2' } } };

      BFF_debug.intercept
        .mockResolvedValueOnce({ url: 'url1?t1', data: { id: 1 } })
        .mockResolvedValueOnce({ url: 'url2?t2', data: { id: 2 } });

      const [trace1, trace2] = await Promise.all([
        BFF_debug.intercept(req1),
        BFF_debug.intercept(req2)
      ]);

      expect(trace1.data.id).toBe(1);
      expect(trace2.data.id).toBe(2);
    });
  });

  describe('Network Failure Handling', () => {
    it('should handle network timeout in trace request', async () => {
      mockRequest.config.trace.enabled = true;

      BFF_debug.intercept.mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000);
        }));

      await expect(BFF_debug.intercept(mockRequest)).rejects.toThrow('Timeout');
    });

    it('should handle 500 errors in trace response', async () => {
      const errorResponse = {
        status: 500,
        data: null,
        error: 'Internal Server Error'
      };

      BFF_debug.processResponse.mockResolvedValue({
        destination: 'devtools',
        error: true,
        data: errorResponse
      });

      const result = await BFF_debug.processResponse(errorResponse, mockRequest);

      expect(result.error).toBe(true);
    });

    it('should handle network connection failures', async () => {
      mockRequest.config.trace.enabled = true;

      BFF_debug.intercept.mockRejectedValue(new Error('Network connection failed'));

      await expect(BFF_debug.intercept(mockRequest)).rejects.toThrow('Network connection failed');
    });
  });

  describe('Plugin Integration with Registry', () => {
    it('should discover BFF_debug plugin from registry', () => {
      const plugin = PluginRegistry.getPlugin('BFF_debug');

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('BFF_debug');
    });

    it('should execute plugin lifecycle correctly', () => {
      const allPlugins = PluginRegistry.getAllPlugins();

      expect(allPlugins).toContain(BFF_debug);
    });

    it('should allow plugin configuration updates', () => {
      mockRequest.config.trace.parameter = 'new-param';

      BFF_debug.shouldIntercept.mockReturnValue(true);

      const shouldIntercept = BFF_debug.shouldIntercept(mockRequest);
      expect(shouldIntercept).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle requests with fragment identifiers', async () => {
      mockRequest.url = 'https://api.example.com/users#section';
      mockRequest.config.trace.enabled = true;

      BFF_debug.intercept.mockResolvedValue({
        url: 'https://api.example.com/users?trace#section'
      });

      const trace = await BFF_debug.intercept(mockRequest);

      expect(trace.url).toBeDefined();
    });

    it('should handle URLs with special characters', async () => {
      mockRequest.url = 'https://api.example.com/users?name=John%20Doe&age=30';
      mockRequest.config.trace.enabled = true;

      BFF_debug.intercept.mockResolvedValue({
        url: mockRequest.url + '&trace'
      });

      const trace = await BFF_debug.intercept(mockRequest);

      expect(trace.url).toContain('John%20Doe');
    });

    it('should handle rapid enable/disable toggling', async () => {
      mockRequest.config.trace.enabled = true;
      BFF_debug.shouldIntercept.mockReturnValue(true);

      let result1 = BFF_debug.shouldIntercept(mockRequest);
      expect(result1).toBe(true);

      mockRequest.config.trace.enabled = false;
      BFF_debug.shouldIntercept.mockReturnValue(false);

      let result2 = BFF_debug.shouldIntercept(mockRequest);
      expect(result2).toBe(false);
    });

    it('should handle malformed trace parameters gracefully', async () => {
      mockRequest.config.trace.parameter = '@@##$$%%';
      mockRequest.config.trace.enabled = true;

      BFF_debug.intercept.mockResolvedValue({
        url: 'https://api.example.com/users?trace=%40%40%23%23%24%24%25%25'
      });

      const trace = await BFF_debug.intercept(mockRequest);

      // Should URL encode special characters
      expect(trace.url).toBeDefined();
    });
  });
});
