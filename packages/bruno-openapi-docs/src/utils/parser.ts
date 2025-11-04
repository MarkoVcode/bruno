import type {
  OpenAPISpec,
  PathsObject,
  HttpMethod,
  EndpointInfo,
  GroupedEndpoints,
  SchemaObject
} from '../types';

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'];

/**
 * Group endpoints by tags
 */
export function groupEndpointsByTag(spec: OpenAPISpec): GroupedEndpoints {
  const grouped: GroupedEndpoints = {};
  const untagged: EndpointInfo[] = [];

  // Initialize groups from spec tags
  if (spec.tags) {
    spec.tags.forEach(tag => {
      grouped[tag.name] = [];
    });
  }

  // Group endpoints
  Object.entries(spec.paths || {}).forEach(([path, pathItem]) => {
    HTTP_METHODS.forEach(method => {
      const operation = pathItem[method];
      if (operation) {
        const endpoint: EndpointInfo = {
          path,
          method,
          operation,
          tags: operation.tags || []
        };

        if (endpoint.tags.length === 0) {
          untagged.push(endpoint);
        } else {
          endpoint.tags.forEach(tag => {
            if (!grouped[tag]) {
              grouped[tag] = [];
            }
            grouped[tag].push(endpoint);
          });
        }
      }
    });
  });

  // Add untagged endpoints
  if (untagged.length > 0) {
    grouped['Other'] = untagged;
  }

  return grouped;
}

/**
 * Resolve $ref references in schemas
 */
export function resolveRef(ref: string, spec: OpenAPISpec): SchemaObject | null {
  // Handle $ref like "#/components/schemas/User"
  if (!ref.startsWith('#/')) {
    return null;
  }

  const parts = ref.substring(2).split('/');
  let current: any = spec;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }

  return current as SchemaObject;
}

/**
 * Get all path parameters from a path string
 */
export function getPathParams(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map(m => m.slice(1, -1));
}

/**
 * Format path for display (replace {param} with :param for Bruno style)
 */
export function formatPathForBruno(path: string): string {
  return path.replace(/\{([^}]+)\}/g, ':$1');
}

/**
 * Get HTTP method color class
 */
export function getMethodColor(method: HttpMethod): string {
  const colors: Record<HttpMethod, string> = {
    get: 'green',
    post: 'purple',
    put: 'orange',
    delete: 'red',
    patch: 'orange',
    options: 'gray',
    head: 'gray',
    trace: 'gray'
  };
  return colors[method] || 'gray';
}

/**
 * Get schema type display name
 */
export function getSchemaType(schema: SchemaObject, spec: OpenAPISpec): string {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, spec);
    if (resolved) {
      return schema.$ref.split('/').pop() || 'object';
    }
  }

  if (schema.type) {
    if (schema.type === 'array' && schema.items) {
      const itemType = getSchemaType(schema.items, spec);
      return `${itemType}[]`;
    }
    return schema.type;
  }

  if (schema.allOf) return 'object (allOf)';
  if (schema.oneOf) return 'object (oneOf)';
  if (schema.anyOf) return 'object (anyOf)';

  return 'any';
}

/**
 * Check if schema is a simple type (not object or array)
 */
export function isSimpleType(schema: SchemaObject): boolean {
  const type = schema.type;
  return type !== 'object' && type !== 'array' && !schema.$ref && !schema.allOf && !schema.oneOf && !schema.anyOf;
}

/**
 * Get example value for a schema
 */
export function getSchemaExample(schema: SchemaObject, depth: number = 0): any {
  // Prevent infinite recursion
  if (depth > 5) {
    return null;
  }

  if (schema.example !== undefined) {
    return schema.example;
  }

  if (schema.default !== undefined) {
    return schema.default;
  }

  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  // Generate example based on type
  switch (schema.type) {
    case 'string':
      return schema.format === 'email' ? 'user@example.com' :
             schema.format === 'date-time' ? '2024-01-01T00:00:00Z' :
             schema.format === 'date' ? '2024-01-01' :
             schema.format === 'uuid' ? '123e4567-e89b-12d3-a456-426614174000' :
             schema.format === 'uri' ? 'https://example.com' :
             schema.format === 'hostname' ? 'example.com' :
             schema.format === 'ipv4' ? '192.168.1.1' :
             schema.format === 'ipv6' ? '2001:0db8:85a3:0000:0000:8a2e:0370:7334' :
             'string';
    case 'number':
      return schema.format === 'double' ? 123.45 : 42;
    case 'integer':
      return 42;
    case 'boolean':
      return true;
    case 'array':
      if (schema.items) {
        const itemExample = getSchemaExample(schema.items, depth + 1);
        return [itemExample];
      }
      return [];
    case 'object':
      if (schema.properties) {
        const example: any = {};
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
          example[key] = getSchemaExample(propSchema, depth + 1);
        });
        return example;
      }
      return {};
    default:
      return null;
  }
}
