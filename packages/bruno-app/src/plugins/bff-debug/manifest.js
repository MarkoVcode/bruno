/**
 * BFF_debug Plugin Manifest
 *
 * This plugin adds Backend-for-Frontend (BFF) debug tracing capabilities.
 * When enabled, it adds specific headers and query parameters to trigger
 * debug trace responses from BFF servers.
 *
 * Configuration:
 *   - Header: X-Bff-No-Cache: true (disables caching for fresh debug data)
 *   - Query Param: upstreamDebug: true (enables upstream debug tracing)
 */

const BFF_DEBUG_MANIFEST = {
  // Unique identifier for the plugin
  id: 'BFF_debug',

  // Display name shown in UI
  name: 'BFF Debug Trace',

  // Plugin version
  version: '1.0.0',

  // Plugin description
  description: 'Enable debug tracing for Backend-for-Frontend (BFF) services',

  // Plugin author
  author: 'Bruno',

  // Trace configuration
  traceConfig: {
    // Headers to add when trace is enabled
    headers: [
      {
        name: 'X-Bff-No-Cache',
        value: 'true',
        enabled: true,
        description: 'Disable BFF caching to ensure fresh debug data'
      }
    ],

    // Query parameters to add when trace is enabled
    queryParams: [
      {
        name: 'upstreamDebug',
        value: 'true',
        enabled: true,
        description: 'Enable upstream debug tracing in BFF'
      }
    ]
  },

  /**
   * Optional: Transform the trace response before displaying
   * @param {Object} response - Raw trace response
   * @returns {Object} Transformed response
   */
  transformResponse: (response) => {
    // For BFF_debug, we want to extract and highlight debug information
    if (!response || !response.data) {
      return response;
    }

    try {
      // If response contains debug data, parse and structure it
      const data = typeof response.data === 'string'
        ? JSON.parse(response.data)
        : response.data;

      // Look for common debug/trace fields
      const debugInfo = {
        timestamp: new Date().toISOString(),
        originalData: data,
        traceData: null,
        debugHeaders: response.headers || {},
        requestId: response.headers?.['x-request-id'] || response.headers?.['x-correlation-id']
      };

      // Extract trace information if present
      if (data.trace || data.debug || data._debug || data._trace) {
        debugInfo.traceData = data.trace || data.debug || data._debug || data._trace;
      }

      // Extract upstream calls if present
      if (data.upstreamCalls || data.upstream || data._upstream) {
        debugInfo.upstreamCalls = data.upstreamCalls || data.upstream || data._upstream;
      }

      // Extract timing information
      if (data.timing || data._timing || data.performance) {
        debugInfo.timing = data.timing || data._timing || data.performance;
      }

      return {
        ...response,
        data: debugInfo,
        isTransformed: true,
        transformedBy: 'BFF_debug'
      };
    } catch (error) {
      // If transformation fails, return original response
      console.warn('[BFF_debug] Failed to transform response:', error);
      return {
        ...response,
        transformError: error.message
      };
    }
  }
};

export default BFF_DEBUG_MANIFEST;
