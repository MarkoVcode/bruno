/**
 * Trace Component - Request-level trace configuration
 *
 * This component allows users to enable and configure trace plugins for individual requests.
 * It provides a dropdown to select trace plugins and displays the configuration that will
 * be applied (headers and query parameters).
 *
 * Features:
 *   - Plugin selection dropdown
 *   - Display of trace headers and query parameters
 *   - Enable/disable trace functionality
 *   - Inherits from collection-level settings
 */

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { PluginRegistry } from 'plugins/registry';
import { updateRequestTrace } from 'providers/ReduxStore/slices/collections';
import StyledWrapper from './StyledWrapper';

const Trace = ({ item, collection }) => {
  const dispatch = useDispatch();
  const registry = PluginRegistry.getInstance();

  // Get all available plugins
  const availablePlugins = registry.getAllPlugins();

  // Get current trace configuration from request or collection
  const getTraceConfig = () => {
    // Check if request has trace config (draft or saved)
    if (item.draft?.request?.trace) {
      return item.draft.request.trace;
    }
    if (item.request?.trace) {
      return item.request.trace;
    }

    // Fall back to collection-level config
    if (collection?.trace) {
      return {
        ...collection.trace,
        inheritedFromCollection: true
      };
    }

    // Default: no trace enabled
    return {
      enabled: false,
      pluginId: null,
      inheritedFromCollection: false
    };
  };

  const [traceConfig, setTraceConfig] = useState(getTraceConfig());
  const [selectedPlugin, setSelectedPlugin] = useState(null);

  // Load selected plugin when config changes
  useEffect(() => {
    if (traceConfig.pluginId) {
      const plugin = registry.getPlugin(traceConfig.pluginId);
      setSelectedPlugin(plugin);
    } else {
      setSelectedPlugin(null);
    }
  }, [traceConfig.pluginId]);

  // Handle plugin selection
  const handlePluginSelect = (e) => {
    const pluginId = e.target.value;

    const newConfig = {
      enabled: pluginId !== '',
      pluginId: pluginId || null,
      inheritedFromCollection: false
    };

    setTraceConfig(newConfig);

    // Dispatch Redux action to save trace config
    dispatch(updateRequestTrace({
      itemUid: item.uid,
      collectionUid: collection.uid,
      trace: newConfig
    }));
  };

  // Handle enable/disable toggle
  const handleToggleEnabled = () => {
    const newConfig = {
      ...traceConfig,
      enabled: !traceConfig.enabled,
      inheritedFromCollection: false
    };

    setTraceConfig(newConfig);

    // Dispatch Redux action to save trace config
    dispatch(updateRequestTrace({
      itemUid: item.uid,
      collectionUid: collection.uid,
      trace: newConfig
    }));
  };

  return (
    <StyledWrapper className="w-full">
      <div className="trace-container">
        {/* Header Section */}
        <div className="trace-header mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Request Trace Configuration</h3>
            {traceConfig.inheritedFromCollection && (
              <span className="text-xs text-gray-500 italic">
                (Inherited from collection)
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Enable trace plugins to capture additional debug information from your API.
            Trace responses appear in the DevTools panel.
          </p>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="trace-toggle mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={traceConfig.enabled}
              onChange={handleToggleEnabled}
              className="mr-2"
            />
            <span className="text-sm">Enable trace for this request</span>
          </label>
        </div>

        {/* Plugin Selection */}
        <div className="trace-plugin-selector mb-4">
          <label className="block text-sm font-medium mb-2">
            Tracing plugin:
          </label>
          <select
            value={traceConfig.pluginId || ''}
            onChange={handlePluginSelect}
            disabled={!traceConfig.enabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select a trace plugin...</option>
            {availablePlugins.map((plugin) => (
              <option key={plugin.id} value={plugin.id}>
                {plugin.name} (v{plugin.version})
              </option>
            ))}
          </select>
          {traceConfig.enabled && !traceConfig.pluginId && (
            <p className="text-xs text-red-500 mt-1">
              Please select a trace plugin to enable tracing
            </p>
          )}
        </div>

        {/* Plugin Configuration Display */}
        {selectedPlugin && traceConfig.enabled && (
          <div className="trace-config-display">
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Plugin Description:</h4>
              <p className="text-xs text-gray-600">{selectedPlugin.description}</p>
            </div>

            {/* Headers Section */}
            {selectedPlugin.traceConfig.headers && selectedPlugin.traceConfig.headers.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">
                  Headers (will be added to request):
                </h4>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                  {selectedPlugin.traceConfig.headers.map((header, index) => (
                    <div key={index} className="mb-2 last:mb-0">
                      <div className="flex items-center justify-between">
                        <code className="text-xs font-mono bg-white px-2 py-1 rounded border">
                          {header.name}: {header.value}
                        </code>
                        <span className={`text-xs ${header.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                          {header.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      {header.description && (
                        <p className="text-xs text-gray-500 mt-1 ml-2">
                          {header.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Query Parameters Section */}
            {selectedPlugin.traceConfig.queryParams && selectedPlugin.traceConfig.queryParams.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">
                  Query Parameters (will be added to request):
                </h4>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                  {selectedPlugin.traceConfig.queryParams.map((param, index) => (
                    <div key={index} className="mb-2 last:mb-0">
                      <div className="flex items-center justify-between">
                        <code className="text-xs font-mono bg-white px-2 py-1 rounded border">
                          {param.name}={param.value}
                        </code>
                        <span className={`text-xs ${param.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                          {param.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      {param.description && (
                        <p className="text-xs text-gray-500 mt-1 ml-2">
                          {param.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Notes */}
            <div className="trace-notes bg-blue-50 border border-blue-200 rounded-md p-3">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                ℹ️ Important Notes:
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Trace only works for GET requests</li>
                <li>• Original response appears in the main response pane</li>
                <li>• Trace response appears in the DevTools panel</li>
                <li>• A background request with trace headers is sent automatically</li>
              </ul>
            </div>
          </div>
        )}

        {/* No plugin selected state */}
        {traceConfig.enabled && !selectedPlugin && (
          <div className="trace-empty-state bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
            <p className="text-sm text-gray-600">
              Select a trace plugin to see configuration details
            </p>
          </div>
        )}

        {/* Disabled state */}
        {!traceConfig.enabled && (
          <div className="trace-disabled-state bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
            <p className="text-sm text-gray-600">
              Enable tracing to configure trace plugins for this request
            </p>
          </div>
        )}
      </div>
    </StyledWrapper>
  );
};

export default Trace;
