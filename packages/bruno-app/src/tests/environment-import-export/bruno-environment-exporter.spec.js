/**
 * Test suite for Bruno Environment Exporter
 * Tests the exportEnvironment and exportEnvironments functions
 */

import {
  exportEnvironment,
  exportEnvironments,
  deleteUidsInVariables,
  clearSecretValues
} from 'utils/exporters/bruno-environment';
import * as FileSaver from 'file-saver';

// Mock FileSaver
jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}));

describe('Bruno Environment Exporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteUidsInVariables', () => {
    test('should delete UIDs from variables array', () => {
      const variables = [
        { uid: 'var-1', name: 'API_URL', value: 'http://localhost:3000', enabled: true },
        { uid: 'var-2', name: 'API_KEY', value: 'test-key', enabled: true }
      ];

      deleteUidsInVariables(variables);

      expect(variables[0].uid).toBeUndefined();
      expect(variables[1].uid).toBeUndefined();
      expect(variables[0].name).toBe('API_URL');
      expect(variables[1].value).toBe('test-key');
    });

    test('should handle empty variables array', () => {
      const variables = [];
      expect(() => deleteUidsInVariables(variables)).not.toThrow();
      expect(variables).toEqual([]);
    });

    test('should handle null/undefined gracefully', () => {
      expect(() => deleteUidsInVariables(null)).not.toThrow();
      expect(() => deleteUidsInVariables(undefined)).not.toThrow();
    });
  });

  describe('clearSecretValues', () => {
    test('should clear values of secret variables', () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'PUBLIC_KEY', value: 'public-value', secret: false, enabled: true },
          { name: 'SECRET_KEY', value: 'secret-value', secret: true, enabled: true },
          { name: 'PASSWORD', value: 'password123', secret: true, enabled: true }
        ]
      };

      clearSecretValues(environment);

      // Public variables should retain values
      expect(environment.variables[0].value).toBe('public-value');

      // Secret variables should have empty values
      expect(environment.variables[1].value).toBe('');
      expect(environment.variables[2].value).toBe('');

      // Secret flag should remain
      expect(environment.variables[1].secret).toBe(true);
      expect(environment.variables[2].secret).toBe(true);
    });

    test('should handle variables without secret flag', () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'NORMAL_VAR', value: 'normal-value', enabled: true }
        ]
      };

      clearSecretValues(environment);
      expect(environment.variables[0].value).toBe('normal-value');
    });

    test('should handle environment with no variables', () => {
      const environment = { name: 'Empty', variables: [] };
      expect(() => clearSecretValues(environment)).not.toThrow();
    });

    test('should handle environment with null variables', () => {
      const environment = { name: 'Empty', variables: null };
      expect(() => clearSecretValues(environment)).not.toThrow();
    });
  });

  describe('exportEnvironment - Single Environment Export', () => {
    test('should export single environment with correct format', () => {
      const environment = {
        uid: 'env-1',
        name: 'Development',
        variables: [
          { uid: 'var-1', name: 'API_URL', value: 'http://localhost:3000', enabled: true },
          { uid: 'var-2', name: 'API_KEY', value: 'secret-key', enabled: true, secret: true }
        ]
      };

      exportEnvironment(environment);

      // Verify FileSaver was called
      expect(FileSaver.saveAs).toHaveBeenCalledTimes(1);
      const [[blob, filename]] = FileSaver.saveAs.mock.calls;

      // Verify filename format
      expect(filename).toBe('Development.json');

      // Verify blob type
      expect(blob.type).toBe('application/json');

      // Verify blob content
      return blob.text().then((text) => {
        const exported = JSON.parse(text);

        // Verify structure
        expect(exported).toHaveProperty('version', '1');
        expect(exported).toHaveProperty('type', 'environment');
        expect(exported).toHaveProperty('name', 'Development');
        expect(exported).toHaveProperty('variables');
        expect(exported).toHaveProperty('exportedAt');

        // Verify UIDs are removed
        expect(exported.uid).toBeUndefined();
        expect(exported.variables[0].uid).toBeUndefined();

        // Verify secret values are cleared by default
        expect(exported.variables[1].value).toBe('');

        // Verify other data is preserved
        expect(exported.variables[0].value).toBe('http://localhost:3000');
        expect(exported.variables[0].name).toBe('API_URL');

        // Verify exportedAt is a valid ISO date
        expect(new Date(exported.exportedAt).toISOString()).toBe(exported.exportedAt);
      });
    });

    test('should export environment with secrets when includeSecrets is true', () => {
      const environment = {
        uid: 'env-1',
        name: 'Development',
        variables: [
          { uid: 'var-1', name: 'SECRET_KEY', value: 'secret-value', enabled: true, secret: true }
        ]
      };

      exportEnvironment(environment, { includeSecrets: true });

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.variables[0].value).toBe('secret-value');
      });
    });

    test('should handle environment with special characters in name', () => {
      const environment = {
        uid: 'env-1',
        name: 'Dev/Test (Local) [2024] #1',
        variables: []
      };

      exportEnvironment(environment);

      const [[blob, filename]] = FileSaver.saveAs.mock.calls;
      expect(filename).toBe('Dev/Test (Local) [2024] #1.json');

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.name).toBe('Dev/Test (Local) [2024] #1');
      });
    });

    test('should handle environment with Unicode characters', () => {
      const environment = {
        uid: 'env-1',
        name: 'Development',
        variables: [
          { uid: 'var-1', name: 'MESSAGE', value: 'Hello 世界 🌍', enabled: true },
          { uid: 'var-2', name: 'EMOJI', value: '🚀🎉💯', enabled: true }
        ]
      };

      exportEnvironment(environment);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.variables[0].value).toBe('Hello 世界 🌍');
        expect(exported.variables[1].value).toBe('🚀🎉💯');
      });
    });

    test('should handle environment with no variables', () => {
      const environment = {
        uid: 'env-1',
        name: 'Empty',
        variables: []
      };

      exportEnvironment(environment);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.variables).toEqual([]);
      });
    });

    test('should handle environment with disabled variables', () => {
      const environment = {
        uid: 'env-1',
        name: 'Development',
        variables: [
          { uid: 'var-1', name: 'ENABLED_VAR', value: 'enabled', enabled: true },
          { uid: 'var-2', name: 'DISABLED_VAR', value: 'disabled', enabled: false }
        ]
      };

      exportEnvironment(environment);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.variables[0].enabled).toBe(true);
        expect(exported.variables[1].enabled).toBe(false);
      });
    });
  });

  describe('exportEnvironments - Multiple Environments Export', () => {
    test('should export multiple environments with correct format', () => {
      const environments = [
        {
          uid: 'env-1',
          name: 'Development',
          variables: [{ uid: 'var-1', name: 'ENV', value: 'dev', enabled: true }]
        },
        {
          uid: 'env-2',
          name: 'Production',
          variables: [{ uid: 'var-2', name: 'ENV', value: 'prod', enabled: true }]
        }
      ];

      exportEnvironments(environments, 'My Collection');

      expect(FileSaver.saveAs).toHaveBeenCalledTimes(1);
      const [[blob, filename]] = FileSaver.saveAs.mock.calls;

      // Verify filename format
      expect(filename).toBe('My Collection-environments.json');

      // Verify blob type
      expect(blob.type).toBe('application/json');

      return blob.text().then((text) => {
        const exported = JSON.parse(text);

        // Verify structure
        expect(exported).toHaveProperty('version', '1');
        expect(exported).toHaveProperty('type', 'environments');
        expect(exported).toHaveProperty('environments');
        expect(exported).toHaveProperty('exportedAt');
        expect(exported).toHaveProperty('collectionName', 'My Collection');

        // Verify multiple environments
        expect(exported.environments).toHaveLength(2);
        expect(exported.environments[0].name).toBe('Development');
        expect(exported.environments[1].name).toBe('Production');

        // Verify UIDs are removed
        expect(exported.environments[0].uid).toBeUndefined();
        expect(exported.environments[0].variables[0].uid).toBeUndefined();
      });
    });

    test('should export all environments with secrets when includeSecrets is true', () => {
      const environments = [
        {
          uid: 'env-1',
          name: 'Development',
          variables: [{ uid: 'var-1', name: 'SECRET', value: 'secret1', enabled: true, secret: true }]
        },
        {
          uid: 'env-2',
          name: 'Production',
          variables: [{ uid: 'var-2', name: 'SECRET', value: 'secret2', enabled: true, secret: true }]
        }
      ];

      exportEnvironments(environments, 'My Collection', { includeSecrets: true });

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.environments[0].variables[0].value).toBe('secret1');
        expect(exported.environments[1].variables[0].value).toBe('secret2');
      });
    });

    test('should clear secret values by default when exporting multiple environments', () => {
      const environments = [
        {
          uid: 'env-1',
          name: 'Development',
          variables: [
            { uid: 'var-1', name: 'PUBLIC', value: 'public', enabled: true, secret: false },
            { uid: 'var-2', name: 'SECRET', value: 'secret', enabled: true, secret: true }
          ]
        }
      ];

      exportEnvironments(environments, 'My Collection');

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.environments[0].variables[0].value).toBe('public');
        expect(exported.environments[0].variables[1].value).toBe('');
      });
    });

    test('should handle empty environments array', () => {
      const environments = [];

      exportEnvironments(environments, 'Empty Collection');

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.environments).toEqual([]);
        expect(exported.collectionName).toBe('Empty Collection');
      });
    });

    test('should handle collection name with special characters', () => {
      const environments = [
        { uid: 'env-1', name: 'Dev', variables: [] }
      ];

      exportEnvironments(environments, 'My/Collection (v2) [2024]');

      const [[blob, filename]] = FileSaver.saveAs.mock.calls;
      expect(filename).toBe('My/Collection (v2) [2024]-environments.json');
    });
  });

  describe('Export Data Validation', () => {
    test('should preserve variable enabled state', () => {
      const environment = {
        uid: 'env-1',
        name: 'Test',
        variables: [
          { uid: 'var-1', name: 'VAR1', value: 'val1', enabled: true },
          { uid: 'var-2', name: 'VAR2', value: 'val2', enabled: false }
        ]
      };

      exportEnvironment(environment);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.variables[0].enabled).toBe(true);
        expect(exported.variables[1].enabled).toBe(false);
      });
    });

    test('should preserve variable types and properties', () => {
      const environment = {
        uid: 'env-1',
        name: 'Test',
        variables: [
          { uid: 'var-1', name: 'STRING', value: 'text', enabled: true, type: 'text' },
          { uid: 'var-2', name: 'NUMBER', value: '123', enabled: true, type: 'number' },
          { uid: 'var-3', name: 'SECRET', value: 'secret', enabled: true, secret: true, type: 'text' }
        ]
      };

      exportEnvironment(environment);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.variables[0].type).toBe('text');
        expect(exported.variables[1].type).toBe('number');
        expect(exported.variables[2].secret).toBe(true);
      });
    });

    test('should handle variables with undefined/null values', () => {
      const environment = {
        uid: 'env-1',
        name: 'Test',
        variables: [
          { uid: 'var-1', name: 'UNDEFINED', value: undefined, enabled: true },
          { uid: 'var-2', name: 'NULL', value: null, enabled: true },
          { uid: 'var-3', name: 'EMPTY', value: '', enabled: true }
        ]
      };

      exportEnvironment(environment);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.variables).toHaveLength(3);
        // JSON stringify converts undefined to null
        expect([undefined, null]).toContain(exported.variables[0].value);
        expect(exported.variables[1].value).toBeNull();
        expect(exported.variables[2].value).toBe('');
      });
    });
  });

  describe('Export Edge Cases', () => {
    test('should not mutate original environment object', () => {
      const environment = {
        uid: 'env-1',
        name: 'Development',
        variables: [
          { uid: 'var-1', name: 'SECRET', value: 'secret-value', enabled: true, secret: true }
        ]
      };

      const originalEnv = JSON.parse(JSON.stringify(environment));

      exportEnvironment(environment);

      // Original should remain unchanged
      expect(environment.uid).toBe('env-1');
      expect(environment.variables[0].uid).toBe('var-1');
      expect(environment.variables[0].value).toBe('secret-value');
      expect(environment).toEqual(originalEnv);
    });

    test('should not mutate original environments array', () => {
      const environments = [
        {
          uid: 'env-1',
          name: 'Development',
          variables: [{ uid: 'var-1', name: 'SECRET', value: 'secret', secret: true }]
        }
      ];

      const originalEnvs = JSON.parse(JSON.stringify(environments));

      exportEnvironments(environments, 'Collection');

      // Original should remain unchanged
      expect(environments[0].uid).toBe('env-1');
      expect(environments[0].variables[0].value).toBe('secret');
      expect(environments).toEqual(originalEnvs);
    });

    test('should handle very long environment names', () => {
      const longName = 'A'.repeat(500);
      const environment = {
        uid: 'env-1',
        name: longName,
        variables: []
      };

      exportEnvironment(environment);

      const [[blob, filename]] = FileSaver.saveAs.mock.calls;
      expect(filename).toBe(`${longName}.json`);
    });

    test('should handle many variables in single environment', () => {
      const variables = Array.from({ length: 1000 }, (_, i) => ({
        uid: `var-${i}`,
        name: `VAR_${i}`,
        value: `value-${i}`,
        enabled: i % 2 === 0
      }));

      const environment = {
        uid: 'env-1',
        name: 'Large',
        variables
      };

      exportEnvironment(environment);

      const [[blob]] = FileSaver.saveAs.mock.calls;

      return blob.text().then((text) => {
        const exported = JSON.parse(text);
        expect(exported.variables).toHaveLength(1000);
        expect(exported.variables[0].uid).toBeUndefined();
        expect(exported.variables[999].name).toBe('VAR_999');
      });
    });
  });
});
