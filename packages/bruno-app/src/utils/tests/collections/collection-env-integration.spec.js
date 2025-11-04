/**
 * Integration Test Suite for Collection Environment Import/Export
 * Tests end-to-end workflows for environment management
 */

import { exportCollection, deleteUidsInEnvs, deleteSecretsInEnvs } from '../../collections/export';
import { processBrunoCollection } from '../../importers/bruno-collection';
import * as FileSaver from 'file-saver';

// Mock FileSaver
jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}));

// Mock common utilities
jest.mock('../../importers/common', () => ({
  validateSchema: jest.fn((collection) => Promise.resolve(collection)),
  transformItemsInCollection: jest.fn((collection) => collection),
  updateUidsInCollection: jest.fn((collection) => {
    // Add UIDs to environments and variables
    if (collection.environments) {
      collection.environments.forEach((env, envIndex) => {
        env.uid = env.uid || `env-uid-${envIndex}`;
        if (env.variables) {
          env.variables.forEach((v, vIndex) => {
            v.uid = v.uid || `var-uid-${envIndex}-${vIndex}`;
          });
        }
      });
    }
    return collection;
  }),
  hydrateSeqInCollection: jest.fn((collection) => collection)
}));

describe('Collection Environment Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Export → Import Round Trip', () => {
    test('should preserve environment data through export and import cycle', async () => {
      // Create a collection with environments
      const originalCollection = {
        uid: 'collection-1',
        name: 'Test Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: [
              { uid: 'var-1', name: 'API_URL', value: 'http://localhost:3000', enabled: true, type: 'text' },
              { uid: 'var-2', name: 'API_KEY', value: 'dev-key', enabled: true, secret: false, type: 'text' }
            ]
          },
          {
            uid: 'env-2',
            name: 'Production',
            variables: [
              { uid: 'var-3', name: 'API_URL', value: 'https://api.prod.com', enabled: true, type: 'text' },
              { uid: 'var-4', name: 'API_KEY', value: 'prod-secret', enabled: true, secret: true, type: 'text' }
            ]
          }
        ]
      };

      // Export the collection
      exportCollection(JSON.parse(JSON.stringify(originalCollection)));

      expect(FileSaver.saveAs).toHaveBeenCalledTimes(1);
      const [[blob]] = FileSaver.saveAs.mock.calls;
      const exportedJson = await blob.text();
      const exportedCollection = JSON.parse(exportedJson);

      // Verify export transformations
      expect(exportedCollection.uid).toBeUndefined();
      expect(exportedCollection.environments[0].uid).toBeUndefined();
      expect(exportedCollection.environments[0].variables[0].uid).toBeUndefined();
      expect(exportedCollection.environments[1].variables[1].value).toBe(''); // Secret cleared

      // Import the exported collection
      const reimportedCollection = await processBrunoCollection(exportedCollection);

      // Verify data integrity
      expect(reimportedCollection.name).toBe('Test Collection');
      expect(reimportedCollection.environments).toHaveLength(2);
      expect(reimportedCollection.environments[0].name).toBe('Development');
      expect(reimportedCollection.environments[0].variables[0].name).toBe('API_URL');
      expect(reimportedCollection.environments[0].variables[0].value).toBe('http://localhost:3000');
    });

    test('should handle multiple round trips', async () => {
      let collection = {
        uid: 'collection-1',
        name: 'Multi-Trip Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: [
              { uid: 'var-1', name: 'VERSION', value: 'v1', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      // Round trip 1: Export → Import
      exportCollection(JSON.parse(JSON.stringify(collection)));
      let [[blob1]] = FileSaver.saveAs.mock.calls;
      let exported1 = JSON.parse(await blob1.text());
      collection = await processBrunoCollection(exported1);

      // Round trip 2: Export → Import
      jest.clearAllMocks();
      exportCollection(JSON.parse(JSON.stringify(collection)));
      let [[blob2]] = FileSaver.saveAs.mock.calls;
      let exported2 = JSON.parse(await blob2.text());
      collection = await processBrunoCollection(exported2);

      // Data should remain consistent
      expect(collection.environments[0].variables[0].value).toBe('v1');
    });
  });

  describe('Complex Environment Scenarios', () => {
    test('should handle large collection with many environments', async () => {
      const environments = Array.from({ length: 50 }, (_, i) => ({
        uid: `env-${i}`,
        name: `Environment ${i}`,
        variables: Array.from({ length: 20 }, (_, j) => ({
          uid: `var-${i}-${j}`,
          name: `VAR_${j}`,
          value: `value-${i}-${j}`,
          enabled: true,
          type: 'text'
        }))
      }));

      const collection = {
        uid: 'large-collection',
        name: 'Large Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments
      };

      // Export
      exportCollection(JSON.parse(JSON.stringify(collection)));
      const [[blob]] = FileSaver.saveAs.mock.calls;
      const exported = JSON.parse(await blob.text());

      // Import
      const reimported = await processBrunoCollection(exported);

      // Verify all environments preserved
      expect(reimported.environments).toHaveLength(50);
      expect(reimported.environments[25].variables).toHaveLength(20);
    });

    test('should handle mixed secret and public variables', async () => {
      const collection = {
        uid: 'mixed-collection',
        name: 'Mixed Variables',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Mixed',
            variables: [
              { uid: 'var-1', name: 'PUBLIC_1', value: 'public1', enabled: true, secret: false, type: 'text' },
              { uid: 'var-2', name: 'SECRET_1', value: 'secret1', enabled: true, secret: true, type: 'text' },
              { uid: 'var-3', name: 'PUBLIC_2', value: 'public2', enabled: true, secret: false, type: 'text' },
              { uid: 'var-4', name: 'SECRET_2', value: 'secret2', enabled: true, secret: true, type: 'text' }
            ]
          }
        ]
      };

      exportCollection(JSON.parse(JSON.stringify(collection)));
      const [[blob]] = FileSaver.saveAs.mock.calls;
      const exported = JSON.parse(await blob.text());

      // Verify secrets cleared, publics preserved
      expect(exported.environments[0].variables[0].value).toBe('public1');
      expect(exported.environments[0].variables[1].value).toBe(''); // Secret
      expect(exported.environments[0].variables[2].value).toBe('public2');
      expect(exported.environments[0].variables[3].value).toBe(''); // Secret
    });

    test('should handle environment with special characters throughout', async () => {
      const collection = {
        uid: 'special-collection',
        name: 'Special & Characters <Test>',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Dev/Test (Local) [2024] {Updated}',
            variables: [
              {
                uid: 'var-1',
                name: 'URL-WITH-DASHES_AND_UNDERSCORES',
                value: 'https://example.com/path?query=value&other=true',
                enabled: true,
                type: 'text'
              },
              {
                uid: 'var-2',
                name: 'UTF8_VAR',
                value: 'Hello 世界 🌍 Привет مرحبا',
                enabled: true,
                type: 'text'
              }
            ]
          }
        ]
      };

      exportCollection(JSON.parse(JSON.stringify(collection)));
      const [[blob]] = FileSaver.saveAs.mock.calls;
      const exported = JSON.parse(await blob.text());

      const reimported = await processBrunoCollection(exported);

      expect(reimported.name).toBe('Special & Characters <Test>');
      expect(reimported.environments[0].name).toBe('Dev/Test (Local) [2024] {Updated}');
      expect(reimported.environments[0].variables[1].value).toBe('Hello 世界 🌍 Привет مرحبا');
    });
  });

  describe('Error Recovery', () => {
    test('should handle export with missing environment fields gracefully', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            name: 'Dev'
            // Missing variables field
          }
        ]
      };

      // Should not throw during export
      expect(() => {
        exportCollection(JSON.parse(JSON.stringify(collection)));
      }).not.toThrow();
    });

    test('should handle collection with no environments field', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test',
        version: '1',
        type: 'collection',
        items: []
        // No environments field
      };

      expect(() => {
        exportCollection(JSON.parse(JSON.stringify(collection)));
      }).not.toThrow();
    });
  });

  describe('State Management Integration', () => {
    test('should handle enabled/disabled state transitions', async () => {
      const collection = {
        uid: 'collection-1',
        name: 'State Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: [
              { uid: 'var-1', name: 'ENABLED_VAR', value: 'enabled', enabled: true, type: 'text' },
              { uid: 'var-2', name: 'DISABLED_VAR', value: 'disabled', enabled: false, type: 'text' }
            ]
          }
        ]
      };

      exportCollection(JSON.parse(JSON.stringify(collection)));
      const [[blob]] = FileSaver.saveAs.mock.calls;
      const exported = JSON.parse(await blob.text());
      const reimported = await processBrunoCollection(exported);

      // States should be preserved
      expect(reimported.environments[0].variables[0].enabled).toBe(true);
      expect(reimported.environments[0].variables[1].enabled).toBe(false);
    });

    test('should maintain variable order through export/import', async () => {
      const collection = {
        uid: 'collection-1',
        name: 'Order Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: [
              { uid: 'var-1', name: 'FIRST', value: '1', enabled: true, type: 'text' },
              { uid: 'var-2', name: 'SECOND', value: '2', enabled: true, type: 'text' },
              { uid: 'var-3', name: 'THIRD', value: '3', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      exportCollection(JSON.parse(JSON.stringify(collection)));
      const [[blob]] = FileSaver.saveAs.mock.calls;
      const exported = JSON.parse(await blob.text());
      const reimported = await processBrunoCollection(exported);

      expect(reimported.environments[0].variables[0].name).toBe('FIRST');
      expect(reimported.environments[0].variables[1].name).toBe('SECOND');
      expect(reimported.environments[0].variables[2].name).toBe('THIRD');
    });
  });

  describe('Notification and UI Integration', () => {
    test('should successfully complete export operation', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Export Test',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: []
          }
        ]
      };

      exportCollection(collection);

      expect(FileSaver.saveAs).toHaveBeenCalledTimes(1);
      expect(FileSaver.saveAs).toHaveBeenCalledWith(expect.any(Blob),
        'Export Test.json');
    });

    test('should generate correct filename for export', () => {
      const testCases = [
        { name: 'Simple Name', expected: 'Simple Name.json' },
        { name: 'Name With Spaces', expected: 'Name With Spaces.json' },
        { name: 'Special-Characters_123', expected: 'Special-Characters_123.json' },
        { name: 'Name.With.Dots', expected: 'Name.With.Dots.json' }
      ];

      testCases.forEach(({ name, expected }) => {
        jest.clearAllMocks();
        const collection = {
          uid: 'collection-1',
          name,
          version: '1',
          type: 'collection',
          items: [],
          environments: []
        };

        exportCollection(collection);

        const [[, filename]] = FileSaver.saveAs.mock.calls;
        expect(filename).toBe(expected);
      });
    });
  });

  describe('Performance and Scale', () => {
    test('should handle export of collection with very long variable values', async () => {
      const longValue = 'x'.repeat(50000); // 50KB value
      const collection = {
        uid: 'collection-1',
        name: 'Long Value Collection',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: [
              { uid: 'var-1', name: 'LONG_VAR', value: longValue, enabled: true, type: 'text' }
            ]
          }
        ]
      };

      exportCollection(JSON.parse(JSON.stringify(collection)));
      const [[blob]] = FileSaver.saveAs.mock.calls;
      const exported = JSON.parse(await blob.text());

      expect(exported.environments[0].variables[0].value.length).toBe(50000);
    });

    test('should handle collection with deeply nested structure', async () => {
      // Although environments are flat, test with complex collection structure
      const collection = {
        uid: 'collection-1',
        name: 'Complex Collection',
        version: '1',
        type: 'collection',
        items: [
          {
            uid: 'folder-1',
            type: 'folder',
            name: 'Folder 1',
            items: []
          }
        ],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: [
              { uid: 'var-1', name: 'VAR', value: 'value', enabled: true, type: 'text' }
            ]
          }
        ]
      };

      exportCollection(JSON.parse(JSON.stringify(collection)));
      const [[blob]] = FileSaver.saveAs.mock.calls;
      const exported = JSON.parse(await blob.text());
      const reimported = await processBrunoCollection(exported);

      expect(reimported.environments[0].name).toBe('Development');
    });
  });

  describe('Cancellation Flows', () => {
    test('should handle export cancellation gracefully', () => {
      // Mock FileSaver to simulate cancellation
      FileSaver.saveAs.mockImplementation(() => {
        throw new Error('User cancelled');
      });

      const collection = {
        uid: 'collection-1',
        name: 'Test',
        version: '1',
        type: 'collection',
        items: [],
        environments: []
      };

      expect(() => {
        exportCollection(collection);
      }).toThrow('User cancelled');
    });
  });

  describe('Data Integrity', () => {
    test('should maintain exact JSON structure after round trip', async () => {
      const collection = {
        uid: 'collection-1',
        name: 'Integrity Test',
        version: '1',
        type: 'collection',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: [
              {
                uid: 'var-1',
                name: 'API_URL',
                value: 'http://localhost:3000',
                enabled: true,
                type: 'text'
              }
            ]
          }
        ]
      };

      exportCollection(JSON.parse(JSON.stringify(collection)));
      const [[blob]] = FileSaver.saveAs.mock.calls;
      const exported = JSON.parse(await blob.text());
      const reimported = await processBrunoCollection(exported);

      // Check all critical fields preserved
      expect(reimported.name).toBe(collection.name);
      expect(reimported.version).toBe(collection.version);
      expect(reimported.type).toBe(collection.type);
      expect(reimported.environments[0].name).toBe(collection.environments[0].name);
      expect(reimported.environments[0].variables[0].name).toBe(collection.environments[0].variables[0].name);
      expect(reimported.environments[0].variables[0].value).toBe(collection.environments[0].variables[0].value);
    });
  });
});
