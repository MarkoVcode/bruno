/**
 * Test suite for Environment File Format Validation
 * Tests JSON format validation, file picker, and file reading
 */

import importPostmanEnvironment from 'utils/importers/postman-environment';
import { BrunoError } from 'utils/common/error';
import { postmanToBrunoEnvironment } from '@usebruno/converters';

// Mock file-dialog
jest.mock('file-dialog');
jest.mock('@usebruno/converters');

const fileDialog = require('file-dialog');

describe('Environment File Format Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Postman Environment Import - File Selection', () => {
    test('should accept JSON files through file dialog', async () => {
      const mockFile = new File([JSON.stringify({ name: 'Development', values: [] })],
        'environment.json',
        { type: 'application/json' });

      fileDialog.mockResolvedValue([mockFile]);
      postmanToBrunoEnvironment.mockReturnValue({
        name: 'Development',
        variables: []
      });

      const result = await importPostmanEnvironment();

      expect(fileDialog).toHaveBeenCalledWith({
        multiple: true,
        accept: 'application/json'
      });
      expect(result).toHaveLength(1);
    });

    test('should support multiple file selection', async () => {
      const mockFiles = [
        new File([JSON.stringify({ name: 'Dev', values: [] })], 'dev.json', { type: 'application/json' }),
        new File([JSON.stringify({ name: 'Prod', values: [] })], 'prod.json', { type: 'application/json' })
      ];

      fileDialog.mockResolvedValue(mockFiles);
      postmanToBrunoEnvironment.mockReturnValue({
        name: 'Environment',
        variables: []
      });

      const result = await importPostmanEnvironment();

      expect(result).toHaveLength(2);
    });

    test('should handle file dialog cancellation', async () => {
      fileDialog.mockResolvedValue(null);

      await expect(importPostmanEnvironment()).rejects.toThrow(BrunoError);
    });

    test('should handle empty file selection', async () => {
      fileDialog.mockResolvedValue([]);

      const result = await importPostmanEnvironment();

      expect(result).toEqual([]);
    });
  });

  describe('JSON Format Validation', () => {
    test('should parse valid Postman environment JSON', async () => {
      const validJSON = JSON.stringify({
        name: 'Development',
        values: [
          { key: 'API_URL', value: 'http://localhost:3000', enabled: true }
        ]
      });

      const mockFile = new File([validJSON], 'env.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      postmanToBrunoEnvironment.mockReturnValue({
        name: 'Development',
        variables: [
          { name: 'API_URL', value: 'http://localhost:3000', enabled: true }
        ]
      });

      const result = await importPostmanEnvironment();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('name', 'Development');
      expect(result[0]).toHaveProperty('variables');
    });

    test('should reject invalid JSON format', async () => {
      const invalidJSON = '{ invalid json content }';

      const mockFile = new File([invalidJSON], 'invalid.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      await expect(importPostmanEnvironment()).rejects.toThrow(BrunoError);
      await expect(importPostmanEnvironment()).rejects.toThrow('Unable to parse the postman environment json file');
    });

    test('should reject empty JSON file', async () => {
      const mockFile = new File([''], 'empty.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      await expect(importPostmanEnvironment()).rejects.toThrow(BrunoError);
    });

    test('should reject malformed JSON with syntax errors', async () => {
      const malformedJSON = '{"name": "Dev", "values": [}';

      const mockFile = new File([malformedJSON], 'malformed.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      await expect(importPostmanEnvironment()).rejects.toThrow(BrunoError);
    });

    test('should handle JSON with Unicode characters', async () => {
      const unicodeJSON = JSON.stringify({
        name: 'Development 世界',
        values: [
          { key: 'MESSAGE', value: 'Hello 🌍', enabled: true }
        ]
      });

      const mockFile = new File([unicodeJSON], 'unicode.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      postmanToBrunoEnvironment.mockReturnValue({
        name: 'Development 世界',
        variables: [
          { name: 'MESSAGE', value: 'Hello 🌍', enabled: true }
        ]
      });

      const result = await importPostmanEnvironment();

      expect(result[0].name).toBe('Development 世界');
      expect(result[0].variables[0].value).toBe('Hello 🌍');
    });

    test('should handle very large JSON files', async () => {
      const largeEnv = {
        name: 'Large Environment',
        values: Array.from({ length: 10000 }, (_, i) => ({
          key: `VAR_${i}`,
          value: `value_${i}`,
          enabled: true
        }))
      };

      const mockFile = new File([JSON.stringify(largeEnv)], 'large.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      postmanToBrunoEnvironment.mockReturnValue({
        name: 'Large Environment',
        variables: largeEnv.values.map((v) => ({ name: v.key, value: v.value, enabled: v.enabled }))
      });

      const result = await importPostmanEnvironment();

      expect(result[0].variables).toHaveLength(10000);
    });
  });

  describe('Postman Environment Schema Validation', () => {
    test('should validate Postman environment with required fields', async () => {
      const validPostman = {
        id: 'env-id',
        name: 'Development',
        values: [
          {
            key: 'API_URL',
            value: 'http://localhost:3000',
            enabled: true,
            type: 'default'
          }
        ],
        _postman_variable_scope: 'environment',
        _postman_exported_at: '2024-01-01T00:00:00.000Z',
        _postman_exported_using: 'Postman/10.0.0'
      };

      const mockFile = new File([JSON.stringify(validPostman)], 'postman.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      postmanToBrunoEnvironment.mockReturnValue({
        name: 'Development',
        variables: [
          { name: 'API_URL', value: 'http://localhost:3000', enabled: true }
        ]
      });

      const result = await importPostmanEnvironment();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Development');
    });

    test('should handle Postman environment with minimal fields', async () => {
      const minimalPostman = {
        name: 'Minimal',
        values: []
      };

      const mockFile = new File([JSON.stringify(minimalPostman)], 'minimal.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      postmanToBrunoEnvironment.mockReturnValue({
        name: 'Minimal',
        variables: []
      });

      const result = await importPostmanEnvironment();

      expect(result[0].name).toBe('Minimal');
      expect(result[0].variables).toEqual([]);
    });

    test('should handle Postman environment with secret variables', async () => {
      const secretEnv = {
        name: 'Production',
        values: [
          { key: 'PUBLIC', value: 'public-value', enabled: true, type: 'default' },
          { key: 'SECRET', value: 'secret-value', enabled: true, type: 'secret' }
        ]
      };

      const mockFile = new File([JSON.stringify(secretEnv)], 'secret.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      postmanToBrunoEnvironment.mockReturnValue({
        name: 'Production',
        variables: [
          { name: 'PUBLIC', value: 'public-value', enabled: true, secret: false },
          { name: 'SECRET', value: 'secret-value', enabled: true, secret: true }
        ]
      });

      const result = await importPostmanEnvironment();

      expect(result[0].variables).toHaveLength(2);
      expect(result[0].variables[1].secret).toBe(true);
    });

    test('should handle Postman environment with disabled variables', async () => {
      const disabledEnv = {
        name: 'Test',
        values: [
          { key: 'ENABLED', value: 'enabled-value', enabled: true },
          { key: 'DISABLED', value: 'disabled-value', enabled: false }
        ]
      };

      const mockFile = new File([JSON.stringify(disabledEnv)], 'disabled.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      postmanToBrunoEnvironment.mockReturnValue({
        name: 'Test',
        variables: [
          { name: 'ENABLED', value: 'enabled-value', enabled: true },
          { name: 'DISABLED', value: 'disabled-value', enabled: false }
        ]
      });

      const result = await importPostmanEnvironment();

      expect(result[0].variables[0].enabled).toBe(true);
      expect(result[0].variables[1].enabled).toBe(false);
    });
  });

  describe('File Reading Errors', () => {
    test('should handle FileReader errors', async () => {
      const mockFile = new File(['content'], 'test.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn().mockImplementation(() => ({
        readAsText: jest.fn(function () {
          if (this.onerror) {
            this.onerror(new Error('File read error'));
          }
        }),
        onload: null,
        onerror: null
      }));

      await expect(importPostmanEnvironment()).rejects.toThrow();

      global.FileReader = originalFileReader;
    });

    test('should handle corrupted file content', async () => {
      const corruptedContent = '\x00\x01\x02\x03\x04';

      const mockFile = new File([corruptedContent], 'corrupted.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      await expect(importPostmanEnvironment()).rejects.toThrow(BrunoError);
    });

    test('should handle non-text file content', async () => {
      const binaryContent = new ArrayBuffer(100);

      const mockFile = new File([binaryContent], 'binary.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      // This will fail JSON parsing
      await expect(importPostmanEnvironment()).rejects.toThrow(BrunoError);
    });
  });

  describe('Multiple File Import Validation', () => {
    test('should validate all files in multiple selection', async () => {
      const files = [
        new File([JSON.stringify({ name: 'Dev', values: [] })], 'dev.json', { type: 'application/json' }),
        new File([JSON.stringify({ name: 'Prod', values: [] })], 'prod.json', { type: 'application/json' }),
        new File([JSON.stringify({ name: 'Staging', values: [] })], 'staging.json', { type: 'application/json' })
      ];

      fileDialog.mockResolvedValue(files);
      postmanToBrunoEnvironment
        .mockReturnValueOnce({ name: 'Dev', variables: [] })
        .mockReturnValueOnce({ name: 'Prod', variables: [] })
        .mockReturnValueOnce({ name: 'Staging', variables: [] });

      const result = await importPostmanEnvironment();

      expect(result).toHaveLength(3);
      expect(result.map((e) => e.name)).toEqual(['Dev', 'Prod', 'Staging']);
    });

    test('should handle mixed valid and invalid files', async () => {
      const files = [
        new File([JSON.stringify({ name: 'Valid', values: [] })], 'valid.json', { type: 'application/json' }),
        new File(['{ invalid json }'], 'invalid.json', { type: 'application/json' })
      ];

      fileDialog.mockResolvedValue(files);
      postmanToBrunoEnvironment.mockReturnValueOnce({ name: 'Valid', variables: [] });

      // Should reject on first invalid file
      await expect(importPostmanEnvironment()).rejects.toThrow();
    });

    test('should process files in order', async () => {
      const files = [
        new File([JSON.stringify({ name: 'First', values: [] })], '1.json', { type: 'application/json' }),
        new File([JSON.stringify({ name: 'Second', values: [] })], '2.json', { type: 'application/json' }),
        new File([JSON.stringify({ name: 'Third', values: [] })], '3.json', { type: 'application/json' })
      ];

      fileDialog.mockResolvedValue(files);
      postmanToBrunoEnvironment
        .mockReturnValueOnce({ name: 'First', variables: [] })
        .mockReturnValueOnce({ name: 'Second', variables: [] })
        .mockReturnValueOnce({ name: 'Third', variables: [] });

      const result = await importPostmanEnvironment();

      expect(result[0].name).toBe('First');
      expect(result[1].name).toBe('Second');
      expect(result[2].name).toBe('Third');
    });
  });

  describe('Edge Cases', () => {
    test('should handle file with BOM (Byte Order Mark)', async () => {
      const jsonWithBOM = '\uFEFF' + JSON.stringify({ name: 'BOM', values: [] });

      const mockFile = new File([jsonWithBOM], 'bom.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      postmanToBrunoEnvironment.mockReturnValue({
        name: 'BOM',
        variables: []
      });

      const result = await importPostmanEnvironment();

      expect(result[0].name).toBe('BOM');
    });

    test('should handle JSON with trailing commas (if parser supports)', async () => {
      // Note: Standard JSON doesn't support trailing commas, but some parsers do
      const jsonWithTrailingComma = '{"name": "Test", "values": [],}';

      const mockFile = new File([jsonWithTrailingComma], 'trailing.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      // Most JSON parsers will reject this
      await expect(importPostmanEnvironment()).rejects.toThrow(BrunoError);
    });

    test('should handle JSON with comments (not valid JSON)', async () => {
      const jsonWithComments = `{
        // This is a comment
        "name": "Test",
        "values": []
      }`;

      const mockFile = new File([jsonWithComments], 'comments.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      await expect(importPostmanEnvironment()).rejects.toThrow(BrunoError);
    });

    test('should handle extremely nested JSON structures', async () => {
      const deeplyNested = {
        name: 'Deep',
        values: [{
          key: 'NESTED',
          value: JSON.stringify({ level1: { level2: { level3: { data: 'deep' } } } }),
          enabled: true
        }]
      };

      const mockFile = new File([JSON.stringify(deeplyNested)], 'nested.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      postmanToBrunoEnvironment.mockReturnValue({
        name: 'Deep',
        variables: [{
          name: 'NESTED',
          value: JSON.stringify({ level1: { level2: { level3: { data: 'deep' } } } }),
          enabled: true
        }]
      });

      const result = await importPostmanEnvironment();

      expect(result[0].variables[0].value).toContain('deep');
    });

    test('should handle file with null bytes', async () => {
      const nullByteContent = 'test\x00content';

      const mockFile = new File([nullByteContent], 'null.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      await expect(importPostmanEnvironment()).rejects.toThrow(BrunoError);
    });

    test('should handle files with different line endings (CRLF, LF)', async () => {
      const crlfJSON = '{\r\n  "name": "CRLF",\r\n  "values": []\r\n}';

      const mockFile = new File([crlfJSON], 'crlf.json', { type: 'application/json' });
      fileDialog.mockResolvedValue([mockFile]);

      postmanToBrunoEnvironment.mockReturnValue({
        name: 'CRLF',
        variables: []
      });

      const result = await importPostmanEnvironment();

      expect(result[0].name).toBe('CRLF');
    });
  });
});
