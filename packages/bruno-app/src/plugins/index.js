/**
 * Plugins Index - Central export point for all Bruno plugins
 *
 * This file initializes and exports the plugin registry along with
 * all available plugins. Plugins are automatically registered on import.
 */

import { PluginRegistry } from './registry';
import { BFF_DEBUG_MANIFEST } from './bff-debug';

// Initialize plugin registry
const registry = PluginRegistry.getInstance();

// Register built-in plugins
registry.registerPlugin(BFF_DEBUG_MANIFEST);

// Export registry and plugins
export { PluginRegistry, BFF_DEBUG_MANIFEST };

export default registry;
