import brunoToOpenApi from '../../src/openapi/bruno-to-openapi';

const buildBaseCollection = () => ({
  version: '1',
  name: 'Sample Collection',
  items: [],
  environments: [],
  root: {
    request: {
      headers: [],
      auth: {
        mode: 'none'
      },
      script: {
        req: '',
        res: ''
      },
      vars: {
        req: [],
        res: []
      },
      tests: ''
    }
  }
});

const buildHttpRequest = (overrides = {}) => ({
  uid: 'req-1',
  type: 'http-request',
  name: 'List Users',
  request: {
    method: 'GET',
    url: 'https://{{host}}/users/:id',
    headers: [
      {
        uid: 'h1',
        name: 'Accept',
        value: 'application/json',
        enabled: true
      }
    ],
    params: [
      {
        uid: 'p1',
        name: 'id',
        value: '123',
        description: 'User identifier',
        type: 'path',
        enabled: true
      },
      {
        uid: 'p2',
        name: 'filter',
        value: '{{filter}}',
        type: 'query',
        enabled: true
      }
    ],
    auth: {
      mode: 'inherit'
    },
    body: {
      mode: 'none'
    },
    script: {
      req: '',
      res: ''
    },
    vars: {
      req: [],
      res: []
    },
    assertions: [],
    tests: '',
    docs: 'Retrieve filtered users'
  },
  ...overrides
});

describe('brunoToOpenApi', () => {
  it('should convert a simple HTTP request with variables into OpenAPI format', () => {
    const collection = buildBaseCollection();

    collection.items.push({
      type: 'folder',
      name: 'Users',
      root: {
        request: {
          auth: {
            mode: 'basic',
            basic: {
              username: 'user',
              password: 'secret'
            }
          }
        }
      },
      items: [
        buildHttpRequest()
      ]
    });

    const result = brunoToOpenApi(collection, {
      variables: {
        host: 'api.example.com',
        filter: 'active'
      }
    });

    expect(result.openapi).toBe('3.0.3');
    expect(result.info.title).toBe('Sample Collection');
    expect(result.paths['/users/{id}']).toBeDefined();
    const operation = result.paths['/users/{id}'].get;
    expect(operation.summary).toBe('List Users');
    expect(operation.parameters).toHaveLength(2);

    const idParam = operation.parameters.find((param) => param.name === 'id');
    expect(idParam.in).toBe('path');
    expect(idParam.required).toBe(true);
    expect(idParam.example).toBe('123');

    const filterParam = operation.parameters.find((param) => param.name === 'filter');
    expect(filterParam.in).toBe('query');
    expect(filterParam.example).toBe('active');

    expect(operation.security[0]).toBeDefined();
    const securityKey = Object.keys(operation.security[0])[0];
    expect(result.components.securitySchemes[securityKey]).toMatchObject({
      type: 'http',
      scheme: 'basic'
    });

    expect(result.servers[0]).toMatchObject({
      url: 'https://{host}',
      variables: {
        host: { default: 'api.example.com' }
      }
    });

    expect(operation['x-sample-headers'].Accept).toBe('application/json');
  });

  it('should include request body schema for JSON payloads', () => {
    const collection = buildBaseCollection();

    const baseRequest = buildHttpRequest();

    collection.items.push(
      buildHttpRequest({
        request: {
          ...baseRequest.request,
          method: 'POST',
          url: 'https://api.example.com/users',
          params: [],
          body: {
            mode: 'json',
            json: JSON.stringify({
              name: 'Alice',
              age: 30
            })
          },
          auth: {
            mode: 'none'
          }
        }
      })
    );

    const result = brunoToOpenApi(collection);
    const operation = result.paths['/users'].post;
    expect(operation.requestBody).toBeDefined();
    const content = operation.requestBody.content['application/json'];
    expect(content.schema.type).toBe('object');
    expect(content.schema.properties).toHaveProperty('name');
    expect(content.example).toMatchObject({ name: 'Alice', age: 30 });
    expect(operation.security).toEqual([]);
  });

  it('should skip unsupported request types', () => {
    const collection = buildBaseCollection();
    collection.items.push({
      type: 'ws-request',
      name: 'WebSocket',
      request: {}
    });

    const result = brunoToOpenApi(collection);
    expect(result.paths).toEqual({});
  });
});
