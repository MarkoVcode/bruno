/**
 * Trace Interceptor Utility
 *
 * Handles request interception for trace functionality.
 * When a request has trace enabled:
 *   1. Original request executes normally
 *   2. Background trace request is sent with trace headers/params
 *   3. Trace response is routed to DevTools
 *
 * Only works for GET requests to prevent side effects from duplicated writes.
 */

import { PluginRegistry } from 'plugins/registry';
import { setCurrentTrace, addPendingTrace, removePendingTrace, addTraceError } from 'providers/ReduxStore/slices/trace';
import { openConsole, setActiveTab } from 'providers/ReduxStore/slices/logs';

/**
 * Check if trace is enabled for a request
 * @param {Object} item - Request item
 * @param {Object} collection - Collection containing the request
 * @returns {Object|null} Trace config or null
 */
export const getTraceConfig = (item, collection) => {
  // Check request-level trace config first (draft or saved)
  if (item.draft?.request?.trace?.enabled) {
    return item.draft.request.trace;
  }
  if (item.request?.trace?.enabled) {
    return item.request.trace;
  }

  // Fall back to collection-level trace config
  if (collection?.trace?.enabled) {
    return collection.trace;
  }

  return null;
};

/**
 * Check if request is eligible for tracing (GET only)
 * @param {Object} request - Request object
 * @returns {boolean}
 */
export const isTraceEligible = (request) => {
  const method = request?.method?.toUpperCase() || 'GET';
  return method === 'GET';
};

/**
 * Build trace request from original request and trace config
 * @param {Object} originalRequest - Original request object
 * @param {string} pluginId - Plugin ID to use for trace
 * @returns {Object} Modified request with trace headers/params
 */
export const buildTraceRequest = (originalRequest, pluginId) => {
  const registry = PluginRegistry.getInstance();
  const plugin = registry.getPlugin(pluginId);

  if (!plugin) {
    console.warn(`[TraceInterceptor] Plugin not found: ${pluginId}`);
    return originalRequest;
  }

  // Apply trace configuration to request
  const modifiedRequest = registry.applyTraceConfig(pluginId, originalRequest);

  // CRITICAL: Use Bruno's apiKeyAuthValueForQueryParams mechanism to add trace query params
  // This is the ONLY way Bruno adds query params to the URL during request processing
  if (plugin.traceConfig.queryParams && plugin.traceConfig.queryParams.length > 0) {
    const enabledParams = plugin.traceConfig.queryParams.filter((p) => p.enabled !== false);
    if (enabledParams.length > 0) {
      // For now, we can only add ONE param using this mechanism
      // Future: we may need to append additional params directly to the URL
      const firstParam = enabledParams[0];
      modifiedRequest.apiKeyAuthValueForQueryParams = {
        placement: 'queryparams',
        key: firstParam.name,
        value: firstParam.value
      };
      console.log('[TraceInterceptor] Added trace query param via API key mechanism:', firstParam);
    }
  }

  return modifiedRequest;
};

/**
 * Execute trace request in background
 * @param {Object} item - Original request item
 * @param {Object} collection - Collection object
 * @param {Object} environment - Environment object
 * @param {Object} runtimeVariables - Runtime variables
 * @param {Object} traceRequest - Request with trace config applied
 * @param {Function} sendRequest - Function to send HTTP request
 * @param {string} requestId - Unique request ID
 * @param {Object} dispatch - Redux dispatch function
 * @param {string} pluginId - Plugin ID used for trace
 * @returns {Promise<void>}
 */
export const executeTraceRequest = async (item, collection, environment, runtimeVariables, traceRequest, sendRequest, requestId, dispatch, pluginId) => {
  const registry = PluginRegistry.getInstance();

  // Add to pending traces
  dispatch(addPendingTrace({
    requestId,
    metadata: {
      url: traceRequest.url,
      method: traceRequest.method,
      plugin: pluginId,
      timestamp: new Date().toISOString()
    }
  }));

  try {
    console.log('[TraceInterceptor] Sending trace request:', requestId, traceRequest);
    console.log('[TraceInterceptor] Trace request URL:', traceRequest.url);
    console.log('[TraceInterceptor] Trace request params:', traceRequest.params);

    // Create trace item with modified request
    // CRITICAL: Remove draft property so electron uses item.request, not item.draft.request
    const traceItem = {
      ...item,
      request: traceRequest,
      draft: undefined, // Clear draft so electron uses our trace request
      name: `${item.name} [TRACE]`
    };

    console.log('[TraceInterceptor] Trace item being sent to electron:', traceItem);
    console.log('[TraceInterceptor] Trace request.apiKeyAuthValueForQueryParams:', traceItem.request.apiKeyAuthValueForQueryParams);

    // Send the trace request with proper signature
    const response = await sendRequest(traceItem, collection, environment, runtimeVariables);

    console.log('[TraceInterceptor] Trace response received:', requestId, response);
    console.log('[TraceInterceptor] Trace response URL (from response):', response.url);
    console.log('[TraceInterceptor] Trace response data type:', typeof response.data, Array.isArray(response.data) ? 'Array' : 'Object');
    console.log('[TraceInterceptor] Trace response data preview:', Array.isArray(response.data) ? response.data.slice(0, 3) : Object.keys(response.data || {}).slice(0, 5));

    // Transform response using plugin if available
    const transformedResponse = registry.transformResponse(pluginId, response);

    // Serialize timeline timestamps (convert Date objects to numbers for Redux)
    const serializedTransformedResponse = {
      ...transformedResponse,
      timeline: transformedResponse.timeline?.map((entry) => ({
        ...entry,
        timestamp: entry.timestamp instanceof Date ? entry.timestamp.getTime() : entry.timestamp
      }))
    };

    // Build trace data object
    const traceData = {
      metadata: {
        url: traceRequest.url,
        method: traceRequest.method,
        plugin: pluginId,
        timestamp: new Date().toISOString(),
        requestId
      },
      ...serializedTransformedResponse,
      originalRequest: traceRequest
    };

    // Dispatch trace data to Redux store
    dispatch(setCurrentTrace(traceData));

    // Auto-open DevTools and switch to Trace tab
    dispatch(openConsole());
    dispatch(setActiveTab('trace'));

    // Remove from pending
    dispatch(removePendingTrace(requestId));
  } catch (error) {
    console.error('[TraceInterceptor] Trace request failed:', error);

    // Add error to trace errors
    dispatch(addTraceError({
      requestId,
      error: error.message || 'Trace request failed',
      timestamp: new Date().toISOString()
    }));

    // Remove from pending
    dispatch(removePendingTrace(requestId));
  }
};

/**
 * Main interceptor function - called before sending a request
 * @param {Object} item - Request item
 * @param {Object} collection - Collection
 * @param {Object} request - Request object
 * @param {Function} sendRequest - Function to send HTTP request
 * @param {Object} dispatch - Redux dispatch
 * @param {Object} environment - Environment object
 * @returns {boolean} True if trace was triggered
 */
export const interceptRequest = async (item, collection, request, sendRequest, dispatch, environment) => {
  console.log('[TraceInterceptor] interceptRequest called', {
    itemName: item?.name,
    method: request?.method,
    traceEnabled: item?.request?.trace?.enabled || item?.draft?.request?.trace?.enabled || collection?.trace?.enabled
  });

  // Check if trace is enabled
  const traceConfig = getTraceConfig(item, collection);

  if (!traceConfig || !traceConfig.enabled || !traceConfig.pluginId) {
    console.log('[TraceInterceptor] Trace not enabled or no plugin selected');
    return false;
  }

  console.log('[TraceInterceptor] Trace config found:', traceConfig);

  // Check if request is eligible for tracing (GET only)
  if (!isTraceEligible(request)) {
    console.log('[TraceInterceptor] Request not eligible for tracing (non-GET method)');
    return false;
  }

  // Build trace request with plugin config
  const traceRequest = buildTraceRequest(request, traceConfig.pluginId);

  console.log('[TraceInterceptor] Built trace request:', traceRequest);

  // Generate unique request ID linked to item UID
  const requestId = `trace-${item.uid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Execute trace request in background (non-blocking)
  const runtimeVariables = collection.runtimeVariables || {};

  executeTraceRequest(item, collection, environment, runtimeVariables, traceRequest, sendRequest, requestId, dispatch, traceConfig.pluginId).catch((error) => {
    console.error('[TraceInterceptor] Background trace request error:', error);
  });

  return true;
};

export default {
  getTraceConfig,
  isTraceEligible,
  buildTraceRequest,
  executeTraceRequest,
  interceptRequest
};
