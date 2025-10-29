import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import each from 'lodash/each';
import { deleteSecretsInEnvs, deleteUidsInEnvs, deleteUidsInItems } from '../common';

const VARIABLE_PATTERN = /{{\s*([\w\.\-]+)\s*}}/g;

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
};

const sanitizePath = (rawPath = '') => {
  if (!rawPath || typeof rawPath !== 'string') {
    return '/';
  }

  let path = rawPath.trim();
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  // Collapse duplicate slashes while preserving protocol specifiers
  path = path.replace(/\/{2,}/g, '/');

  if (!path.length) {
    return '/';
  }

  return path;
};

const resolveTemplateString = (value, variables = {}) => {
  if (typeof value !== 'string') {
    return {
      resolved: value,
      templated: value,
      used: [],
      unresolved: []
    };
  }

  const used = new Set();
  const unresolved = new Set();

  let resolved = value;
  let templated = value;

  resolved = resolved.replace(VARIABLE_PATTERN, (_match, varName) => {
    used.add(varName);
    if (variables[varName] !== undefined && variables[varName] !== null) {
      return String(variables[varName]);
    }
    unresolved.add(varName);
    return varName;
  });

  templated = templated.replace(VARIABLE_PATTERN, (_match, varName) => {
    used.add(varName);
    if (variables[varName] !== undefined && variables[varName] !== null) {
      return `{${varName}}`;
    }
    unresolved.add(varName);
    return `{${varName}}`;
  });

  return {
    resolved,
    templated,
    used: [...used],
    unresolved: [...unresolved]
  };
};

const splitUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return {
      scheme: 'https',
      host: '',
      path: '/',
      query: ''
    };
  }

  let working = url.trim();
  let scheme = 'https';

  const schemeMatch = working.match(/^([a-zA-Z][\w+\-.]*):\/\//);
  if (schemeMatch) {
    scheme = schemeMatch[1];
    working = working.slice(schemeMatch[0].length);
  }

  let query = '';
  const queryIndex = working.indexOf('?');
  if (queryIndex >= 0) {
    query = working.slice(queryIndex + 1);
    working = working.slice(0, queryIndex);
  }

  let host = '';
  let path = working;

  if (working.startsWith('/')) {
    path = working;
  } else {
    const slashIndex = working.indexOf('/');
    if (slashIndex >= 0) {
      host = working.slice(0, slashIndex);
      path = working.slice(slashIndex);
    } else {
      host = working;
      path = '/';
    }
  }

  path = sanitizePath(path);

  return {
    scheme,
    host,
    path,
    query
  };
};

const inferSchemaFromExample = (example) => {
  if (example === null || example === undefined) {
    return { type: 'string', nullable: true };
  }

  if (Array.isArray(example)) {
    if (!example.length) {
      return {
        type: 'array',
        items: { type: 'string' }
      };
    }

    return {
      type: 'array',
      items: inferSchemaFromExample(example[0])
    };
  }

  switch (typeof example) {
    case 'boolean':
      return { type: 'boolean' };
    case 'number':
      if (Number.isInteger(example)) {
        return { type: 'integer', format: 'int32' };
      }
      return { type: 'number', format: 'float' };
    case 'string':
      return { type: 'string' };
    case 'object': {
      const properties = {};
      each(example, (value, key) => {
        properties[key] = inferSchemaFromExample(value);
      });
      return {
        type: 'object',
        properties
      };
    }
    default:
      return { type: 'string' };
  }
};

const buildRequestBody = (body = {}) => {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const mode = body.mode || 'none';

  switch (mode) {
    case 'none':
      return undefined;
    case 'json': {
      let example;
      try {
        example = body.json ? JSON.parse(body.json) : {};
      } catch (err) {
        example = body.json || '';
      }
      return {
        content: {
          'application/json': {
            schema: inferSchemaFromExample(example),
            example
          }
        }
      };
    }
    case 'text':
      return {
        content: {
          'text/plain': {
            schema: { type: 'string' },
            example: body.text || ''
          }
        }
      };
    case 'xml':
      return {
        content: {
          'application/xml': {
            schema: { type: 'string' },
            example: body.xml || ''
          }
        }
      };
    case 'sparql':
      return {
        content: {
          'application/sparql-query': {
            schema: { type: 'string' },
            example: body.sparql || ''
          }
        }
      };
    case 'graphql':
      return {
        content: {
          'application/graphql': {
            schema: { type: 'string' },
            example: get(body, 'graphql.query', '') || ''
          }
        }
      };
    case 'formUrlEncoded': {
      const properties = {};
      const example = {};

      ensureArray(body.formUrlEncoded).forEach((field) => {
        const name = field.name || 'field';
        properties[name] = { type: 'string' };
        if (field.value) {
          example[name] = field.value;
        }
      });

      return {
        content: {
          'application/x-www-form-urlencoded': {
            schema: {
              type: 'object',
              properties
            },
            example: Object.keys(example).length ? example : undefined
          }
        }
      };
    }
    case 'multipartForm': {
      const properties = {};

      ensureArray(body.multipartForm).forEach((field) => {
        const name = field.name || 'field';

        if (field.type === 'file') {
          properties[name] = {
            type: 'string',
            format: 'binary'
          };
        } else {
          properties[name] = { type: 'string' };
        }
      });

      return {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties
            }
          }
        }
      };
    }
    case 'file':
      return {
        content: {
          'application/octet-stream': {
            schema: {
              type: 'string',
              format: 'binary'
            }
          }
        }
      };
    default:
      return undefined;
  }
};

const getDefaultInfo = (collection) => {
  const title = (collection && collection.name) || 'Untitled Collection';
  const description = get(collection, 'root.docs', '') || '';

  return {
    title,
    version: '1.0.0',
    description
  };
};

const buildResponseStub = (request) => {
  const content = {};

  if (request.body?.mode === 'json') {
    const requestBody = buildRequestBody(request.body);
    if (requestBody?.content?.['application/json']?.schema) {
      content['application/json'] = {
        schema: requestBody.content['application/json'].schema
      };
    }
  }

  if (!Object.keys(content).length) {
    content['text/plain'] = {
      schema: { type: 'string' }
    };
  }

  return {
    description: 'Successful response',
    content
  };
};

const registerSecurityScheme = (auth, registry) => {
  if (!auth || !auth.mode || auth.mode === 'none') {
    return null;
  }

  const mode = auth.mode;
  const key = JSON.stringify({ mode, details: auth[mode] || {} });

  if (registry.has(key)) {
    return registry.get(key);
  }

  const schemeName = `auth_${registry.size + 1}`;
  let schemeDefinition;
  let securityRequirement;

  switch (mode) {
    case 'basic':
      schemeDefinition = {
        type: 'http',
        scheme: 'basic',
        description: 'HTTP Basic authentication exported from Bruno.'
      };
      securityRequirement = { [schemeName]: [] };
      break;
    case 'bearer':
      schemeDefinition = {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'HTTP Bearer authentication exported from Bruno.'
      };
      securityRequirement = { [schemeName]: [] };
      break;
    case 'apikey': {
      const placement = get(auth, 'apikey.placement', 'header') === 'queryparams' ? 'query' : 'header';
      const name = get(auth, 'apikey.key', 'X-API-Key') || 'X-API-Key';
      schemeDefinition = {
        type: 'apiKey',
        in: placement,
        name,
        description: 'API Key authentication exported from Bruno.'
      };
      securityRequirement = { [schemeName]: [] };
      break;
    }
    case 'oauth2': {
      const grantType = get(auth, 'oauth2.grantType', 'client_credentials');
      const tokenUrl = get(auth, 'oauth2.accessTokenUrl', '') || '';
      const authorizationUrl = get(auth, 'oauth2.authorizationUrl', '') || tokenUrl;
      const refreshUrl = get(auth, 'oauth2.refreshTokenUrl', '') || undefined;
      const scopesRaw = get(auth, 'oauth2.scope', '') || '';
      const scopes = scopesRaw
        .split(/\s+/)
        .filter(Boolean)
        .reduce((acc, scope) => {
          acc[scope] = '';
          return acc;
        }, {});

      const flows = {};

      if (grantType === 'client_credentials') {
        flows.clientCredentials = {
          tokenUrl,
          refreshUrl,
          scopes
        };
      } else if (grantType === 'authorization_code') {
        flows.authorizationCode = {
          authorizationUrl,
          tokenUrl,
          refreshUrl,
          scopes
        };
      } else if (grantType === 'implicit') {
        flows.implicit = {
          authorizationUrl,
          refreshUrl,
          scopes
        };
      } else if (grantType === 'password') {
        flows.password = {
          tokenUrl,
          refreshUrl,
          scopes
        };
      } else {
        flows.clientCredentials = {
          tokenUrl,
          refreshUrl,
          scopes
        };
      }

      schemeDefinition = {
        type: 'oauth2',
        flows
      };
      securityRequirement = { [schemeName]: Object.keys(scopes) };
      break;
    }
    default:
      schemeDefinition = {
        type: 'http',
        scheme: 'basic',
        description: `Authentication mode "${mode}" is not natively supported by OpenAPI. Exported as HTTP Basic placeholder.`
      };
      securityRequirement = { [schemeName]: [] };
      break;
  }

  registry.set(key, { name: schemeName, definition: schemeDefinition });
  return { schemeName, securityRequirement };
};

const getEffectiveAuth = (auth, parentAuth) => {
  if (!auth || !auth.mode) {
    return parentAuth;
  }
  if (auth.mode === 'inherit') {
    return parentAuth;
  }
  return auth;
};

const collectTags = (ancestors) => {
  return ancestors.filter(Boolean);
};

const normalizeCollection = (inputCollection) => {
  const collection = cloneDeep(inputCollection);
  deleteUidsInItems(collection.items || []);
  deleteUidsInEnvs(collection.environments || []);
  deleteSecretsInEnvs(collection.environments || []);
  return collection;
};

const buildServerObject = ({ scheme, hostTemplated, hostVariables, variablesValues }) => {
  if (!hostTemplated || !hostTemplated.trim()) {
    return null;
  }

  const serverVariables = {};
  hostVariables.forEach((variable) => {
    serverVariables[variable] = {
      default: variablesValues[variable] !== undefined ? String(variablesValues[variable]) : ''
    };
  });

  return {
    url: `${scheme}://${hostTemplated}`,
    variables: Object.keys(serverVariables).length ? serverVariables : undefined
  };
};

const collectHeaderExamples = (headers = [], variables = {}) => {
  const examples = {};
  headers.forEach((header) => {
    if (!header || !header.enabled) {
      return;
    }

    const name = header.name;
    if (!name) {
      return;
    }

    const { resolved } = resolveTemplateString(header.value || '', variables);
    examples[name] = resolved;
  });

  return examples;
};

const brunoToOpenApi = (inputCollection, options = {}) => {
  if (!inputCollection) {
    throw new Error('Collection is required');
  }

  const collection = normalizeCollection(inputCollection);
  const variables = options.variables || {};

  const openApiDoc = {
    openapi: '3.0.3',
    info: getDefaultInfo(collection),
    servers: [],
    paths: {},
    components: {
      securitySchemes: {}
    }
  };

  const serverRegistry = new Map();
  const securitySchemeRegistry = new Map();

  const registerServer = ({ scheme, hostTemplated, hostVariables }) => {
    const key = `${scheme}://${hostTemplated}`;
    if (serverRegistry.has(key)) {
      return serverRegistry.get(key);
    }

    const server = buildServerObject({
      scheme,
      hostTemplated,
      hostVariables,
      variablesValues: variables
    });

    if (!server) {
      return null;
    }

    const index = openApiDoc.servers.push(server) - 1;
    serverRegistry.set(key, index);
    return openApiDoc.servers[index];
  };

  const processRequest = ({ item, ancestors, parentAuth }) => {
    if (!item || !item.request) {
      return;
    }

    const { request } = item;
    const urlResult = splitUrl(request.url || '');
    const hostTemplateInfo = resolveTemplateString(urlResult.host, variables);
    const pathTemplateInfo = resolveTemplateString(urlResult.path, variables);

    const tags = collectTags(ancestors);
    const pathParams = ensureArray(request.params).filter((param) => param.type === 'path');
    const queryParams = ensureArray(request.params).filter((param) => param.type === 'query');

    let openApiPath = pathTemplateInfo.templated;

    pathParams.forEach((param) => {
      if (!param.name) {
        return;
      }
      const name = param.name;
      const colonPattern = new RegExp(`:${name}(?=/|$)`);
      openApiPath = openApiPath.replace(colonPattern, `{${name}}`);
      const moustachePattern = new RegExp(`{{\\s*${name}\\s*}}`, 'g');
      openApiPath = openApiPath.replace(moustachePattern, `{${name}}`);
    });

    const resolvedPathVars = [];
    const pathVarMatches = openApiPath.match(/{([^}]+)}/g) || [];
    pathVarMatches.forEach((match) => {
      resolvedPathVars.push(match.replace(/[{}]/g, ''));
    });

    const server = registerServer({
      scheme: urlResult.scheme,
      hostTemplated: hostTemplateInfo.templated,
      hostVariables: hostTemplateInfo.used
    });

    const method = (request.method || 'GET').toLowerCase();
    if (!openApiDoc.paths[openApiPath]) {
      openApiDoc.paths[openApiPath] = {};
    }

    const operation = openApiDoc.paths[openApiPath][method] || {};

    operation.summary = item.name || request.name || 'Untitled Request';
    operation.description = request.docs || '';
    operation.tags = tags.length ? tags : undefined;

    const parameters = [];

    pathParams.forEach((param) => {
      if (!param || !param.name) {
        return;
      }

      const templateInfo = resolveTemplateString(param.value || '', variables);
      parameters.push({
        name: param.name,
        in: 'path',
        required: true,
        description: param.description || '',
        schema: { type: 'string' },
        example: templateInfo.resolved || undefined
      });
    });

    // Add inferred path params if missing from params array
    resolvedPathVars.forEach((paramName) => {
      const alreadyDefined = parameters.some((param) => param.name === paramName && param.in === 'path');
      if (!alreadyDefined) {
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' }
        });
      }
    });

    queryParams.forEach((param) => {
      if (!param || !param.name) {
        return;
      }

      const templateInfo = resolveTemplateString(param.value || '', variables);
      parameters.push({
        name: param.name,
        in: 'query',
        required: false,
        description: param.description || '',
        schema: { type: 'string' },
        example: templateInfo.resolved || undefined
      });
    });

    operation.parameters = parameters.length ? parameters : undefined;

    const headerExamples = collectHeaderExamples(request.headers, variables);
    if (Object.keys(headerExamples).length) {
      operation['x-sample-headers'] = headerExamples;
    }

    const requestBody = buildRequestBody(request.body);
    if (requestBody) {
      operation.requestBody = requestBody;
    }

    operation.responses = operation.responses || {
      200: buildResponseStub(request)
    };

    const effectiveAuth = getEffectiveAuth(request.auth, parentAuth);
    const scheme = registerSecurityScheme(effectiveAuth, securitySchemeRegistry);

    if (scheme && scheme.securityRequirement) {
      operation.security = [scheme.securityRequirement];
    } else if (effectiveAuth && effectiveAuth.mode === 'none') {
      operation.security = [];
    }

    if (server) {
      operation.servers = operation.servers || [];
      if (!operation.servers.length) {
        operation.servers.push(server);
      }
    }

    openApiDoc.paths[openApiPath][method] = operation;
  };

  const traverseItems = (items = [], context = {}) => {
    ensureArray(items).forEach((item) => {
      if (!item) {
        return;
      }

      if (item.type === 'folder') {
        const folderAuth = get(item, 'root.request.auth');
        const effectiveAuth = getEffectiveAuth(folderAuth, context.parentAuth);
        const folderAncestors = [...context.ancestors, item.name].filter(Boolean);

        traverseItems(item.items, {
          ancestors: folderAncestors,
          parentAuth: effectiveAuth
        });
        return;
      }

      if (!['http-request', 'graphql-request'].includes(item.type)) {
        return;
      }

      const effectiveAuth = getEffectiveAuth(item.request?.auth, context.parentAuth);

      processRequest({
        item,
        ancestors: context.ancestors,
        parentAuth: effectiveAuth
      });
    });
  };

  const rootAuth = getEffectiveAuth(get(collection, 'root.request.auth'), { mode: 'none' });

  traverseItems(collection.items, {
    ancestors: [],
    parentAuth: rootAuth
  });

  if (!openApiDoc.servers.length) {
    delete openApiDoc.servers;
  }

  if (securitySchemeRegistry.size) {
    openApiDoc.components = openApiDoc.components || {};
    openApiDoc.components.securitySchemes = {};
    securitySchemeRegistry.forEach((value) => {
      openApiDoc.components.securitySchemes[value.name] = value.definition;
    });
  } else {
    delete openApiDoc.components;
  }

  return openApiDoc;
};

export default brunoToOpenApi;
