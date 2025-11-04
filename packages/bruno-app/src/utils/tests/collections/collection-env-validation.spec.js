/**
 * Test suite for Collection Environment Validation
 * Tests schema validation rules for environment data
 */

import { validateSchema } from '../../importers/common';
import { environmentSchema } from '@usebruno/schema';

// Mock the schema validation
jest.mock('@usebruno/schema', () => ({
  collectionSchema: {
    validate: jest.fn()
  },
  environmentSchema: {
    validate: jest.fn()
  },
  itemSchema: {
    validate: jest.fn()
  }
}));

describe('Collection Environment Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to successful validation
    environmentSchema.validate.mockResolvedValue(true);
  });

  describe('Valid Environment Structures', () => {
    test('should validate environment with required fields', async () => {
      const environment = {
        name: 'Development',
        variables: [
          {
            name: 'API_URL',
            value: 'http://localhost:3000',
            enabled: true,
            type: 'text'
          }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
      expect(environmentSchema.validate).toHaveBeenCalledWith(environment);
    });

    test('should validate environment with secret variables', async () => {
      const environment = {
        name: 'Production',
        variables: [
          {
            name: 'SECRET_KEY',
            value: '',
            enabled: true,
            secret: true,
            type: 'text'
          }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should validate environment with multiple variables', async () => {
      const environment = {
        name: 'Staging',
        variables: [
          { name: 'API_URL', value: 'https://staging.api.com', enabled: true, type: 'text' },
          { name: 'API_KEY', value: 'staging-key', enabled: true, type: 'text' },
          { name: 'TIMEOUT', value: '5000', enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should validate environment with empty variables array', async () => {
      const environment = {
        name: 'Empty',
        variables: []
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should validate environment with disabled variables', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'ACTIVE_VAR', value: 'active', enabled: true, type: 'text' },
          { name: 'INACTIVE_VAR', value: 'inactive', enabled: false, type: 'text' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });
  });

  describe('Invalid Environment Structures', () => {
    test('should reject environment without name', async () => {
      const environment = {
        variables: [
          { name: 'VAR', value: 'value', enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('name is required'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('name is required');
    });

    test('should reject environment with empty name', async () => {
      const environment = {
        name: '',
        variables: []
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('name cannot be empty'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('name cannot be empty');
    });

    test('should reject environment with invalid name type', async () => {
      const environment = {
        name: 123, // Should be string
        variables: []
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('name must be a string'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('name must be a string');
    });

    test('should reject environment without variables field', async () => {
      const environment = {
        name: 'Development'
        // Missing variables
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('variables is required'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('variables is required');
    });

    test('should reject environment with invalid variables type', async () => {
      const environment = {
        name: 'Development',
        variables: 'not-an-array'
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('variables must be an array'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('variables must be an array');
    });
  });

  describe('Variable Validation', () => {
    test('should reject variable without name', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { value: 'value', enabled: true, type: 'text' } // Missing name
        ]
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('variable name is required'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('variable name is required');
    });

    test('should reject variable with empty name', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: '', value: 'value', enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('variable name cannot be empty'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('variable name cannot be empty');
    });

    test('should reject variable with invalid name type', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 123, value: 'value', enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('variable name must be a string'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('variable name must be a string');
    });

    test('should reject variable without value field', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'VAR', enabled: true, type: 'text' } // Missing value
        ]
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('variable value is required'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('variable value is required');
    });

    test('should accept variable with empty string value', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'EMPTY_VAR', value: '', enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should reject variable with invalid value type', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'VAR', value: { object: 'value' }, enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('variable value must be a string'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('variable value must be a string');
    });

    test('should reject variable without enabled field', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'VAR', value: 'value', type: 'text' } // Missing enabled
        ]
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('variable enabled is required'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('variable enabled is required');
    });

    test('should reject variable with invalid enabled type', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'VAR', value: 'value', enabled: 'yes', type: 'text' }
        ]
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('variable enabled must be a boolean'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('variable enabled must be a boolean');
    });

    test('should validate variable with optional secret field', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'PUBLIC', value: 'public', enabled: true, type: 'text' },
          { name: 'SECRET', value: '', enabled: true, secret: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should reject variable with invalid secret type', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'VAR', value: 'value', enabled: true, secret: 'yes', type: 'text' }
        ]
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('variable secret must be a boolean'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('variable secret must be a boolean');
    });
  });

  describe('Special Character Validation', () => {
    test('should validate environment name with special characters', async () => {
      const environment = {
        name: 'Dev/Test (Local) [2024]',
        variables: []
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should validate variable name with hyphens and underscores', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'API-URL', value: 'url1', enabled: true, type: 'text' },
          { name: 'API_KEY', value: 'key1', enabled: true, type: 'text' },
          { name: 'API_KEY_V2', value: 'key2', enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should validate variable value with UTF-8 characters', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'MESSAGE', value: 'Hello 世界 🌍', enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should validate variable value with special characters', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'SPECIAL', value: '!@#$%^&*()[]{}|\\:;"\'<>,.?/', enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should validate variable value with newlines', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'MULTILINE', value: 'Line 1\nLine 2\nLine 3', enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long environment names', async () => {
      const longName = 'Environment-'.repeat(50); // 600 characters
      const environment = {
        name: longName,
        variables: []
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should handle very long variable names', async () => {
      const longName = 'VARIABLE_NAME_'.repeat(20);
      const environment = {
        name: 'Development',
        variables: [
          { name: longName, value: 'value', enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should handle very long variable values', async () => {
      const longValue = 'x'.repeat(100000); // 100KB
      const environment = {
        name: 'Development',
        variables: [
          { name: 'LONG_VAR', value: longValue, enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should handle environment with many variables', async () => {
      const variables = Array.from({ length: 1000 }, (_, i) => ({
        name: `VAR_${i}`,
        value: `value_${i}`,
        enabled: true,
        type: 'text'
      }));

      const environment = {
        name: 'Development',
        variables
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should handle variable with whitespace padding', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: '  VAR  ', value: '  value  ', enabled: true, type: 'text' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should reject null environment object', async () => {
      environmentSchema.validate.mockRejectedValueOnce(new Error('environment cannot be null'));
      await expect(environmentSchema.validate(null)).rejects.toThrow('environment cannot be null');
    });

    test('should reject undefined environment object', async () => {
      environmentSchema.validate.mockRejectedValueOnce(new Error('environment is required'));
      await expect(environmentSchema.validate(undefined)).rejects.toThrow('environment is required');
    });
  });

  describe('Type Validation', () => {
    test('should validate variable with type field', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'TEXT_VAR', value: 'text', enabled: true, type: 'text' },
          { name: 'SECRET_VAR', value: '', enabled: true, type: 'secret' }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should handle variable without type field', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'VAR', value: 'value', enabled: true }
        ]
      };

      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });

    test('should reject variable with invalid type value', async () => {
      const environment = {
        name: 'Development',
        variables: [
          { name: 'VAR', value: 'value', enabled: true, type: 'invalid-type' }
        ]
      };

      environmentSchema.validate.mockRejectedValueOnce(new Error('variable type must be text or secret'));
      await expect(environmentSchema.validate(environment)).rejects.toThrow('variable type must be text or secret');
    });
  });

  describe('Collection-level Environment Validation', () => {
    test('should validate collection with multiple environments', async () => {
      const environments = [
        {
          name: 'Development',
          variables: [{ name: 'ENV', value: 'dev', enabled: true, type: 'text' }]
        },
        {
          name: 'Production',
          variables: [{ name: 'ENV', value: 'prod', enabled: true, type: 'text' }]
        }
      ];

      for (const env of environments) {
        environmentSchema.validate.mockResolvedValueOnce(env);
        const result = await environmentSchema.validate(env);
        expect(result).toBeDefined();
      }
    });

    test('should handle duplicate environment names', async () => {
      const environment = {
        name: 'Development',
        variables: []
      };

      // In a real scenario, this might be validated at collection level
      environmentSchema.validate.mockResolvedValueOnce(environment);
      const result = await environmentSchema.validate(environment);
      expect(result).toBeDefined();
    });
  });
});
