/**
 * PluginRegistry - Central registry for managing trace plugins
 *
 * This registry manages all available trace plugins in Bruno.
 * Plugins can be registered, retrieved, and activated for requests.
 *
 * Usage:
 *   const registry = PluginRegistry.getInstance();
 *   registry.registerPlugin(pluginManifest);
 *   const plugin = registry.getPlugin('BFF_debug');
 */

class PluginRegistry {
  constructor() {
    if (PluginRegistry.instance) {
      return PluginRegistry.instance;
    }

    this.plugins = new Map();
    PluginRegistry.instance = this;
  }

  /**
   * Get singleton instance of PluginRegistry
   * @returns {PluginRegistry}
   */
  static getInstance() {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /**
   * Register a new trace plugin
   * @param {Object} manifest - Plugin manifest containing id, name, config
   * @param {string} manifest.id - Unique plugin identifier
   * @param {string} manifest.name - Display name
   * @param {string} manifest.version - Plugin version
   * @param {Object} manifest.traceConfig - Trace configuration
   * @param {Array} manifest.traceConfig.headers - Headers to add
   * @param {Array} manifest.traceConfig.queryParams - Query params to add
   * @param {Function} manifest.transformResponse - Optional response transformer
   */
  registerPlugin(manifest) {
    if (!manifest || !manifest.id) {
      throw new Error('Plugin manifest must contain an id');
    }

    if (!manifest.name) {
      throw new Error('Plugin manifest must contain a name');
    }

    if (!manifest.traceConfig) {
      throw new Error('Plugin manifest must contain traceConfig');
    }

    // Validate traceConfig structure
    const { headers = [], queryParams = [] } = manifest.traceConfig;

    if (!Array.isArray(headers)) {
      throw new Error('traceConfig.headers must be an array');
    }

    if (!Array.isArray(queryParams)) {
      throw new Error('traceConfig.queryParams must be an array');
    }

    this.plugins.set(manifest.id, {
      ...manifest,
      registeredAt: new Date().toISOString()
    });

    console.log(`[PluginRegistry] Registered plugin: ${manifest.name} (${manifest.id})`);

    return true;
  }

  /**
   * Get a plugin by ID
   * @param {string} pluginId - Plugin identifier
   * @returns {Object|null} Plugin manifest or null if not found
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * Get all registered plugins
   * @returns {Array} Array of plugin manifests
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if a plugin is registered
   * @param {string} pluginId - Plugin identifier
   * @returns {boolean}
   */
  hasPlugin(pluginId) {
    return this.plugins.has(pluginId);
  }

  /**
   * Unregister a plugin
   * @param {string} pluginId - Plugin identifier
   * @returns {boolean} True if plugin was removed
   */
  unregisterPlugin(pluginId) {
    const existed = this.plugins.has(pluginId);
    this.plugins.delete(pluginId);

    if (existed) {
      console.log(`[PluginRegistry] Unregistered plugin: ${pluginId}`);
    }

    return existed;
  }

  /**
   * Apply plugin trace configuration to a request
   * @param {string} pluginId - Plugin to apply
   * @param {Object} request - Request object to modify
   * @returns {Object} Modified request with trace config applied
   */
  applyTraceConfig(pluginId, request) {
    const plugin = this.getPlugin(pluginId);

    if (!plugin) {
      console.warn(`[PluginRegistry] Plugin not found: ${pluginId}`);
      return request;
    }

    const { headers = [], queryParams = [] } = plugin.traceConfig;

    // Clone request to avoid mutation
    const modifiedRequest = { ...request };

    // Add trace headers
    if (headers.length > 0) {
      modifiedRequest.headers = [...(request.headers || [])];
      headers.forEach(({ name, value, enabled = true }) => {
        if (enabled) {
          modifiedRequest.headers.push({ name, value, enabled: true });
        }
      });
    }

    // Add trace query parameters by appending directly to the URL
    // Bruno doesn't have a mechanism to add query params from params array to the URL
    // so we need to append them directly to the URL string
    if (queryParams.length > 0 && modifiedRequest.url) {
      const enabledParams = queryParams.filter(({ enabled = true }) => enabled);

      if (enabledParams.length > 0) {
        enabledParams.forEach(({ name, value }) => {
          const separator = modifiedRequest.url.includes('?') ? '&' : '?';
          modifiedRequest.url = `${modifiedRequest.url}${separator}${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
          console.log('[PluginRegistry] Added trace query param to URL:', name, '=', value);
        });

        console.log('[PluginRegistry] Final trace URL:', modifiedRequest.url);
      }
    }

    return modifiedRequest;
  }

  /**
   * Transform response using plugin's transformer
   * @param {string} pluginId - Plugin to use
   * @param {Object} response - Response to transform
   * @returns {Object} Transformed response
   */
  transformResponse(pluginId, response) {
    const plugin = this.getPlugin(pluginId);

    if (!plugin || !plugin.transformResponse) {
      return response;
    }

    try {
      return plugin.transformResponse(response);
    } catch (error) {
      console.error(`[PluginRegistry] Error transforming response with plugin ${pluginId}:`, error);
      return response;
    }
  }
}

export default PluginRegistry;
