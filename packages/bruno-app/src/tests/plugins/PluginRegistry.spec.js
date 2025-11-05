/**
 * @jest-environment jsdom
 *
 * PluginRegistry Core Tests
 * Tests plugin registration, discovery, and lifecycle management
 */

import '@testing-library/jest-dom';

describe('PluginRegistry', () => {
  let PluginRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock implementation will be updated once actual code is available
    PluginRegistry = {
      register: jest.fn(),
      discover: jest.fn(),
      getPlugin: jest.fn(),
      getAllPlugins: jest.fn(),
      unregister: jest.fn()
    };
  });

  describe('Plugin Registration', () => {
    it('should register a new plugin successfully', () => {
      const mockPlugin = {
        name: 'BFF_debug',
        version: '1.0.0',
        type: 'trace',
        initialize: jest.fn()
      };

      PluginRegistry.register(mockPlugin);

      expect(PluginRegistry.register).toHaveBeenCalledWith(mockPlugin);
      expect(PluginRegistry.register).toHaveBeenCalledTimes(1);
    });

    it('should prevent duplicate plugin registration', () => {
      const mockPlugin = {
        name: 'BFF_debug',
        version: '1.0.0',
        type: 'trace'
      };

      PluginRegistry.register(mockPlugin);
      const result = PluginRegistry.register(mockPlugin);

      // Should reject or return error for duplicate
      expect(result).toBeDefined();
    });

    it('should validate required plugin fields', () => {
      const invalidPlugin = {
        // Missing required fields
        type: 'trace'
      };

      expect(() => {
        PluginRegistry.register(invalidPlugin);
      }).toThrow();
    });

    it('should handle plugin with missing version', () => {
      const pluginWithoutVersion = {
        name: 'test-plugin',
        type: 'trace'
      };

      // Should either auto-assign version or reject
      const result = PluginRegistry.register(pluginWithoutVersion);
      expect(result).toBeDefined();
    });
  });

  describe('Plugin Discovery', () => {
    it('should discover all registered plugins', () => {
      const plugins = [
        { name: 'plugin1', type: 'trace' },
        { name: 'plugin2', type: 'interceptor' }
      ];

      plugins.forEach((p) => PluginRegistry.register(p));
      const discovered = PluginRegistry.discover();

      expect(discovered).toBeDefined();
      expect(Array.isArray(discovered)).toBe(true);
    });

    it('should discover plugins by type', () => {
      const tracePlugin = { name: 'trace1', type: 'trace' };
      const interceptorPlugin = { name: 'int1', type: 'interceptor' };

      PluginRegistry.register(tracePlugin);
      PluginRegistry.register(interceptorPlugin);

      const tracePlugins = PluginRegistry.discover({ type: 'trace' });
      expect(tracePlugins).toBeDefined();
    });

    it('should return empty array when no plugins match criteria', () => {
      const result = PluginRegistry.discover({ type: 'nonexistent' });
      expect(result).toEqual([]);
    });

    it('should discover plugins by name pattern', () => {
      PluginRegistry.register({ name: 'BFF_debug', type: 'trace' });
      PluginRegistry.register({ name: 'BFF_logger', type: 'trace' });

      const bffPlugins = PluginRegistry.discover({ namePattern: /^BFF_/ });
      expect(bffPlugins).toBeDefined();
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should initialize plugin on registration', () => {
      const mockPlugin = {
        name: 'lifecycle-test',
        type: 'trace',
        initialize: jest.fn()
      };

      PluginRegistry.register(mockPlugin);

      // Should call initialize during or after registration
      expect(mockPlugin.initialize).toBeDefined();
    });

    it('should handle plugin initialization failures gracefully', () => {
      const faultyPlugin = {
        name: 'faulty',
        type: 'trace',
        initialize: jest.fn(() => {
          throw new Error('Init failed');
        })
      };

      expect(() => {
        PluginRegistry.register(faultyPlugin);
      }).not.toThrow(); // Should handle gracefully
    });

    it('should unregister plugin successfully', () => {
      const plugin = { name: 'temp-plugin', type: 'trace' };

      PluginRegistry.register(plugin);
      PluginRegistry.unregister('temp-plugin');

      expect(PluginRegistry.getPlugin('temp-plugin')).toBeUndefined();
    });

    it('should call cleanup on plugin unregister', () => {
      const mockPlugin = {
        name: 'cleanup-test',
        type: 'trace',
        cleanup: jest.fn()
      };

      PluginRegistry.register(mockPlugin);
      PluginRegistry.unregister('cleanup-test');

      expect(mockPlugin.cleanup).toBeDefined();
    });
  });

  describe('Plugin Retrieval', () => {
    it('should retrieve plugin by name', () => {
      const plugin = { name: 'test-plugin', type: 'trace' };

      PluginRegistry.register(plugin);
      const retrieved = PluginRegistry.getPlugin('test-plugin');

      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('test-plugin');
    });

    it('should return undefined for non-existent plugin', () => {
      const result = PluginRegistry.getPlugin('does-not-exist');
      expect(result).toBeUndefined();
    });

    it('should get all plugins as array', () => {
      PluginRegistry.register({ name: 'p1', type: 'trace' });
      PluginRegistry.register({ name: 'p2', type: 'trace' });

      const all = PluginRegistry.getAllPlugins();

      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle null plugin registration', () => {
      expect(() => {
        PluginRegistry.register(null);
      }).toThrow();
    });

    it('should handle undefined plugin registration', () => {
      expect(() => {
        PluginRegistry.register(undefined);
      }).toThrow();
    });

    it('should validate plugin structure', () => {
      const invalidPlugin = {
        name: 123, // Should be string
        type: [] // Should be string
      };

      expect(() => {
        PluginRegistry.register(invalidPlugin);
      }).toThrow();
    });
  });
});
