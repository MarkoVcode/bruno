/**
 * Test suite for Collection Environment Export Functionality
 * Tests the exportCollection function's handling of environments
 */

import {
  exportCollection,
  deleteUidsInEnvs,
  deleteSecretsInEnvs
} from '../../collections/export';
import * as FileSaver from 'file-saver';

// Mock FileSaver
jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}));

describe('Collection Environment Export Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteUidsInEnvs', () => {
    test('should delete UIDs from environment variables', () => {
      const envs = [
        {
          uid: 'env-1',
          name: 'Development',
          variables: [
            { uid: 'var-1', name: 'API_URL', value: 'http://localhost:3000', enabled: true },
            { uid: 'var-2', name: 'API_KEY', value: 'test-key', enabled: true, secret: false }
          ]
        },
        {
          uid: 'env-2',
          name: 'Production',
          variables: [
            { uid: 'var-3', name: 'API_URL', value: 'https://api.example.com', enabled: true }
          ]
        }
      ];

      deleteUidsInEnvs(envs);

      // Verify environment UIDs are deleted
      expect(envs[0].uid).toBeUndefined();
      expect(envs[1].uid).toBeUndefined();

      // Verify variable UIDs are deleted
      expect(envs[0].variables[0].uid).toBeUndefined();
      expect(envs[0].variables[1].uid).toBeUndefined();
      expect(envs[1].variables[0].uid).toBeUndefined();

      // Verify other properties are preserved
      expect(envs[0].name).toBe('Development');
      expect(envs[0].variables[0].name).toBe('API_URL');
      expect(envs[0].variables[0].value).toBe('http://localhost:3000');
    });

    test('should handle empty environment array', () => {
      const envs = [];
      expect(() => deleteUidsInEnvs(envs)).not.toThrow();
    });

    test('should handle environments with no variables', () => {
      const envs = [
        { uid: 'env-1', name: 'Empty', variables: [] }
      ];

      deleteUidsInEnvs(envs);
      expect(envs[0].uid).toBeUndefined();
      expect(envs[0].variables).toEqual([]);
    });
  });

  describe('deleteSecretsInEnvs', () => {
    test('should clear values of secret variables', () => {
      const envs = [
        {
          name: 'Development',
          variables: [
            { name: 'PUBLIC_KEY', value: 'public-value', secret: false, enabled: true },
            { name: 'SECRET_KEY', value: 'secret-value', secret: true, enabled: true },
            { name: 'PASSWORD', value: 'password123', secret: true, enabled: true }
          ]
        }
      ];

      deleteSecretsInEnvs(envs);

      // Public variables should retain values
      expect(envs[0].variables[0].value).toBe('public-value');

      // Secret variables should have empty values
      expect(envs[0].variables[1].value).toBe('');
      expect(envs[0].variables[2].value).toBe('');

      // Secret flag should remain
      expect(envs[0].variables[1].secret).toBe(true);
      expect(envs[0].variables[2].secret).toBe(true);
    });

    test('should handle variables without secret flag', () => {
      const envs = [
        {
          name: 'Development',
          variables: [
            { name: 'NORMAL_VAR', value: 'normal-value', enabled: true }
          ]
        }
      ];

      deleteSecretsInEnvs(envs);
      expect(envs[0].variables[0].value).toBe('normal-value');
    });

    test('should handle empty environments', () => {
      const envs = [];
      expect(() => deleteSecretsInEnvs(envs)).not.toThrow();
    });

    test('should preserve non-secret variables with empty values', () => {
      const envs = [
        {
          name: 'Development',
          variables: [
            { name: 'EMPTY_VAR', value: '', secret: false, enabled: true }
          ]
        }
      ];

      deleteSecretsInEnvs(envs);
      expect(envs[0].variables[0].value).toBe('');
    });
  });

  describe('exportCollection - Environment Export', () => {
    test('should export collection with valid environments', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        version: '1',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: [
              { uid: 'var-1', name: 'API_URL', value: 'http://localhost:3000', enabled: true },
              { uid: 'var-2', name: 'API_KEY', value: 'secret-key', enabled: true, secret: true }
            ]
          }
        ]
      };

      exportCollection(collection);

      // Verify FileSaver was called
      expect(FileSaver.saveAs).toHaveBeenCalledTimes(1);
      const [[blob, filename]] = FileSaver.saveAs.mock.calls;

      // Verify filename
      expect(filename).toBe('Test Collection.json');

      // Verify blob type
      expect(blob.type).toBe('application/json');

      // Verify blob content
      return blob.text().then(text => {
        const exported = JSON.parse(text);

        // Collection UID should be removed
        expect(exported.uid).toBeUndefined();

        // Environment UIDs should be removed
        expect(exported.environments[0].uid).toBeUndefined();
        expect(exported.environments[0].variables[0].uid).toBeUndefined();

        // Secret values should be cleared
        expect(exported.environments[0].variables[1].value).toBe('');

        // Other data should be preserved
        expect(exported.name).toBe('Test Collection');
        expect(exported.environments[0].name).toBe('Development');
        expect(exported.environments[0].variables[0].value).toBe('http://localhost:3000');
      });
    });

    test('should export collection with special characters in environment names', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        version: '1',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Dev/Test (Local) [2024]',
            variables: [
              { uid: 'var-1', name: 'URL', value: 'http://localhost', enabled: true }
            ]
          }
        ]
      };

      exportCollection(collection);

      expect(FileSaver.saveAs).toHaveBeenCalledTimes(1);
      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then(text => {
        const exported = JSON.parse(text);
        expect(exported.environments[0].name).toBe('Dev/Test (Local) [2024]');
      });
    });

    test('should export collection with multiple environments', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Multi-Env Collection',
        version: '1',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: [{ uid: 'var-1', name: 'ENV', value: 'dev', enabled: true }]
          },
          {
            uid: 'env-2',
            name: 'Staging',
            variables: [{ uid: 'var-2', name: 'ENV', value: 'staging', enabled: true }]
          },
          {
            uid: 'env-3',
            name: 'Production',
            variables: [{ uid: 'var-3', name: 'ENV', value: 'prod', enabled: true }]
          }
        ]
      };

      exportCollection(collection);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then(text => {
        const exported = JSON.parse(text);
        expect(exported.environments).toHaveLength(3);
        expect(exported.environments[0].name).toBe('Development');
        expect(exported.environments[1].name).toBe('Staging');
        expect(exported.environments[2].name).toBe('Production');
      });
    });

    test('should export collection with empty environments array', () => {
      const collection = {
        uid: 'collection-1',
        name: 'No Envs Collection',
        version: '1',
        items: [],
        environments: []
      };

      exportCollection(collection);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then(text => {
        const exported = JSON.parse(text);
        expect(exported.environments).toEqual([]);
      });
    });

    test('should handle environment with disabled variables', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        version: '1',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: [
              { uid: 'var-1', name: 'ENABLED_VAR', value: 'enabled', enabled: true },
              { uid: 'var-2', name: 'DISABLED_VAR', value: 'disabled', enabled: false }
            ]
          }
        ]
      };

      exportCollection(collection);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then(text => {
        const exported = JSON.parse(text);
        expect(exported.environments[0].variables[0].enabled).toBe(true);
        expect(exported.environments[0].variables[1].enabled).toBe(false);
      });
    });

    test('should handle UTF-8 characters in variable values', () => {
      const collection = {
        uid: 'collection-1',
        name: 'UTF-8 Collection',
        version: '1',
        items: [],
        environments: [
          {
            uid: 'env-1',
            name: 'Development',
            variables: [
              { uid: 'var-1', name: 'MESSAGE', value: 'Hello 世界 🌍', enabled: true },
              { uid: 'var-2', name: 'EMOJI', value: '🚀🎉💯', enabled: true }
            ]
          }
        ]
      };

      exportCollection(collection);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then(text => {
        const exported = JSON.parse(text);
        expect(exported.environments[0].variables[0].value).toBe('Hello 世界 🌍');
        expect(exported.environments[0].variables[1].value).toBe('🚀🎉💯');
      });
    });

    test('should remove process environment variables', () => {
      const collection = {
        uid: 'collection-1',
        name: 'Test Collection',
        version: '1',
        items: [],
        environments: [],
        processEnvVariables: { NODE_ENV: 'test', PATH: '/usr/bin' }
      };

      exportCollection(collection);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then(text => {
        const exported = JSON.parse(text);
        expect(exported.processEnvVariables).toBeUndefined();
      });
    });
  });

  describe('Export Error Handling', () => {
    test('should handle environment with null variables array', () => {
      const envs = [
        { uid: 'env-1', name: 'Development', variables: null }
      ];

      // Should not throw
      expect(() => {
        deleteUidsInEnvs(envs);
        deleteSecretsInEnvs(envs);
      }).not.toThrow();
    });

    test('should handle environment with undefined variables', () => {
      const envs = [
        { uid: 'env-1', name: 'Development' }
      ];

      expect(() => {
        deleteUidsInEnvs(envs);
        deleteSecretsInEnvs(envs);
      }).not.toThrow();
    });
  });
});
