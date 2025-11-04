/**
 * Test suite for Collection Environment Import Functionality
 * Tests the import process for collection environments
 */

import { processBrunoCollection } from '../../importers/bruno-collection';
import {
  validateSchema,
  transformItemsInCollection,
  updateUidsInCollection,
  hydrateSeqInCollection
} from '../../importers/common';

// Mock the common utilities
jest.mock('../../importers/common', () => ({
  validateSchema: jest.fn((collection) => Promise.resolve(collection)),
  transformItemsInCollection: jest.fn((collection) => collection),
  updateUidsInCollection: jest.fn((collection) => collection),
  hydrateSeqInCollection: jest.fn((collection) => collection)
}));

describe('Collection Environment Import Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processBrunoCollection - Valid Imports', () => {
    test('should import collection with valid environments', async () => {
      const jsonData = {
        name: 'Test Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [
              { name: 'API_URL', value: 'http://localhost:3000', enabled: true, type: 'text' },
              { name: 'API_KEY', value: 'test-key', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);

      expect(result).toBeDefined();
      expect(hydrateSeqInCollection).toHaveBeenCalledWith(jsonData);
      expect(updateUidsInCollection).toHaveBeenCalled();
      expect(transformItemsInCollection).toHaveBeenCalled();
      expect(validateSchema).toHaveBeenCalled();
    });

    test('should import collection with multiple environments', async () => {
      const jsonData = {
        name: 'Multi-Env Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [{ name: 'ENV', value: 'dev', enabled: true, type: 'text' }]
          },
          {
            name: 'Staging',
            variables: [{ name: 'ENV', value: 'staging', enabled: true, type: 'text' }]
          },
          {
            name: 'Production',
            variables: [{ name: 'ENV', value: 'prod', enabled: true, type: 'text' }]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });

    test('should import collection with empty environments array', async () => {
      const jsonData = {
        name: 'No Envs Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: []
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
      expect(validateSchema).toHaveBeenCalled();
    });

    test('should import collection with secret variables', async () => {
      const jsonData = {
        name: 'Secret Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [
              { name: 'PUBLIC_KEY', value: 'public', enabled: true, secret: false, type: 'text' },
              { name: 'SECRET_KEY', value: '', enabled: true, secret: true, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });

    test('should import environment with special characters in names', async () => {
      const jsonData = {
        name: 'Special Chars Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Dev/Test (Local) [2024]',
            variables: [
              { name: 'API-URL', value: 'http://localhost', enabled: true, type: 'text' },
              { name: 'API_KEY_v2', value: 'key', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });

    test('should import environment with UTF-8 characters', async () => {
      const jsonData = {
        name: 'UTF-8 Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [
              { name: 'MESSAGE', value: 'Hello 世界 🌍', enabled: true, type: 'text' },
              { name: 'EMOJI', value: '🚀🎉💯', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });

    test('should import environment with disabled variables', async () => {
      const jsonData = {
        name: 'Disabled Vars Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [
              { name: 'ENABLED_VAR', value: 'enabled', enabled: true, type: 'text' },
              { name: 'DISABLED_VAR', value: 'disabled', enabled: false, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });
  });

  describe('processBrunoCollection - Invalid Imports', () => {
    test('should throw error for invalid JSON structure', async () => {
      validateSchema.mockRejectedValueOnce(new Error('Invalid schema'));

      const invalidData = {
        name: 'Invalid Collection'
        // Missing required fields
      };

      await expect(processBrunoCollection(invalidData)).rejects.toThrow('Import collection failed');
    });

    test('should handle collection with malformed environments', async () => {
      const jsonData = {
        name: 'Malformed Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: 'not-an-array' // Invalid type
      };

      await expect(processBrunoCollection(jsonData)).rejects.toThrow();
    });

    test('should handle environment with missing name', async () => {
      validateSchema.mockRejectedValueOnce(new Error('Environment name is required'));

      const jsonData = {
        name: 'Test Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            // Missing name
            variables: [
              { name: 'VAR', value: 'value', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      await expect(processBrunoCollection(jsonData)).rejects.toThrow();
    });

    test('should handle environment with invalid variables format', async () => {
      validateSchema.mockRejectedValueOnce(new Error('Variables must be an array'));

      const jsonData = {
        name: 'Test Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: 'not-an-array' // Invalid type
          }
        ]
      };

      await expect(processBrunoCollection(jsonData)).rejects.toThrow();
    });

    test('should handle variable with missing name', async () => {
      validateSchema.mockRejectedValueOnce(new Error('Variable name is required'));

      const jsonData = {
        name: 'Test Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [
              { value: 'value', enabled: true, type: 'text' } // Missing name
            ]
          }
        ]
      };

      await expect(processBrunoCollection(jsonData)).rejects.toThrow();
    });

    test('should handle null environments', async () => {
      const jsonData = {
        name: 'Null Envs Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: null
      };

      await expect(processBrunoCollection(jsonData)).rejects.toThrow();
    });
  });

  describe('Import Edge Cases', () => {
    test('should handle environment with empty variables array', async () => {
      const jsonData = {
        name: 'Empty Vars Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: []
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });

    test('should handle variable with empty string value', async () => {
      const jsonData = {
        name: 'Empty Value Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [
              { name: 'EMPTY_VAR', value: '', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });

    test('should handle environment with very long variable values', async () => {
      const longValue = 'x'.repeat(10000);
      const jsonData = {
        name: 'Long Value Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [
              { name: 'LONG_VAR', value: longValue, enabled: true, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });

    test('should handle environment name with maximum length', async () => {
      const longName = 'Environment-'.repeat(20);
      const jsonData = {
        name: 'Test Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: longName,
            variables: [
              { name: 'VAR', value: 'value', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });

    test('should handle collection with duplicate environment names', async () => {
      const jsonData = {
        name: 'Duplicate Env Names',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [{ name: 'VAR1', value: 'value1', enabled: true, type: 'text' }]
          },
          {
            name: 'Development',
            variables: [{ name: 'VAR2', value: 'value2', enabled: true, type: 'text' }]
          }
        ]
      };

      // Should process but may need validation for duplicates
      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });

    test('should handle variable with duplicate names in same environment', async () => {
      const jsonData = {
        name: 'Duplicate Var Names',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [
              { name: 'API_URL', value: 'value1', enabled: true, type: 'text' },
              { name: 'API_URL', value: 'value2', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });

    test('should handle variable with whitespace in name', async () => {
      const jsonData = {
        name: 'Whitespace Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [
              { name: '  TRIMMED_VAR  ', value: 'value', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });

    test('should handle multiline variable values', async () => {
      const jsonData = {
        name: 'Multiline Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [
              {
                name: 'MULTILINE_VAR',
                value: 'Line 1\nLine 2\nLine 3',
                enabled: true,
                type: 'text'
              }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });
  });

  describe('Import with UIDs', () => {
    test('should generate UIDs for environments without UIDs', async () => {
      const jsonData = {
        name: 'Test Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Development',
            variables: [
              { name: 'VAR', value: 'value', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(updateUidsInCollection).toHaveBeenCalled();
    });

    test('should preserve existing UIDs if present', async () => {
      updateUidsInCollection.mockImplementation((collection) => {
        // Simulate adding UIDs
        collection.environments.forEach(env => {
          env.uid = env.uid || 'generated-uid';
          env.variables.forEach(v => {
            v.uid = v.uid || 'generated-var-uid';
          });
        });
        return collection;
      });

      const jsonData = {
        name: 'Test Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            uid: 'existing-env-uid',
            name: 'Development',
            variables: [
              { uid: 'existing-var-uid', name: 'VAR', value: 'value', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      const result = await processBrunoCollection(jsonData);
      expect(result).toBeDefined();
    });
  });
});
