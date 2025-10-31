const fs = require('fs');
const path = require('path');
const os = require('os');
const { isReadOnlyCollection, getOpenapiSpec } = require('../../src/utils/readonly-detection');

describe('readonly-detection', () => {
  let tempDir;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bruno-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('isReadOnlyCollection', () => {
    it('should return false when openapi.yaml does not exist', () => {
      const result = isReadOnlyCollection(tempDir, 'Test Collection');
      expect(result).toBe(false);
    });

    it('should return false when openapi.yaml exists but title does not match', () => {
      const openapiPath = path.join(tempDir, 'openapi.yaml');
      const openapiContent = `
openapi: 3.0.0
info:
  title: Different Title
  version: 1.0.0
paths: {}
`;
      fs.writeFileSync(openapiPath, openapiContent, 'utf8');

      const result = isReadOnlyCollection(tempDir, 'Test Collection');
      expect(result).toBe(false);
    });

    it('should return true when openapi.yaml exists and title matches exactly', () => {
      const openapiPath = path.join(tempDir, 'openapi.yaml');
      const openapiContent = `
openapi: 3.0.0
info:
  title: Test Collection
  version: 1.0.0
paths: {}
`;
      fs.writeFileSync(openapiPath, openapiContent, 'utf8');

      const result = isReadOnlyCollection(tempDir, 'Test Collection');
      expect(result).toBe(true);
    });

    it('should be case-sensitive for title matching', () => {
      const openapiPath = path.join(tempDir, 'openapi.yaml');
      const openapiContent = `
openapi: 3.0.0
info:
  title: test collection
  version: 1.0.0
paths: {}
`;
      fs.writeFileSync(openapiPath, openapiContent, 'utf8');

      const result = isReadOnlyCollection(tempDir, 'Test Collection');
      expect(result).toBe(false);
    });

    it('should return false when openapi.yaml has no info.title', () => {
      const openapiPath = path.join(tempDir, 'openapi.yaml');
      const openapiContent = `
openapi: 3.0.0
info:
  version: 1.0.0
paths: {}
`;
      fs.writeFileSync(openapiPath, openapiContent, 'utf8');

      const result = isReadOnlyCollection(tempDir, 'Test Collection');
      expect(result).toBe(false);
    });

    it('should handle invalid YAML gracefully', () => {
      const openapiPath = path.join(tempDir, 'openapi.yaml');
      fs.writeFileSync(openapiPath, 'invalid: yaml: content: [', 'utf8');

      const result = isReadOnlyCollection(tempDir, 'Test Collection');
      expect(result).toBe(false);
    });
  });

  describe('getOpenapiSpec', () => {
    it('should return null when openapi.yaml does not exist', () => {
      const result = getOpenapiSpec(tempDir);
      expect(result).toBeNull();
    });

    it('should return parsed OpenAPI spec when file exists', () => {
      const openapiPath = path.join(tempDir, 'openapi.yaml');
      const openapiContent = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      summary: Test endpoint
`;
      fs.writeFileSync(openapiPath, openapiContent, 'utf8');

      const result = getOpenapiSpec(tempDir);
      expect(result).not.toBeNull();
      expect(result.openapi).toBe('3.0.0');
      expect(result.info.title).toBe('Test API');
      expect(result.paths['/test']).toBeDefined();
    });

    it('should return null for invalid YAML', () => {
      const openapiPath = path.join(tempDir, 'openapi.yaml');
      fs.writeFileSync(openapiPath, 'invalid: yaml: [[[', 'utf8');

      const result = getOpenapiSpec(tempDir);
      expect(result).toBeNull();
    });
  });
});
