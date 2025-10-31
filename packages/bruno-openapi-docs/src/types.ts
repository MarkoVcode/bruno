// Simplified OpenAPI 3.x types - only what we need for rendering

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace';

export interface OpenAPISpec {
  openapi: string;
  info: InfoObject;
  servers?: ServerObject[];
  paths: PathsObject;
  components?: ComponentsObject;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
}

export interface InfoObject {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
}

export interface ContactObject {
  name?: string;
  url?: string;
  email?: string;
}

export interface LicenseObject {
  name: string;
  url?: string;
}

export interface ServerObject {
  url: string;
  description?: string;
}

export interface PathsObject {
  [path: string]: PathItemObject;
}

export interface PathItemObject {
  summary?: string;
  description?: string;
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  delete?: OperationObject;
  patch?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  trace?: OperationObject;
  parameters?: ParameterObject[];
}

export interface OperationObject {
  summary?: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: ResponsesObject;
  security?: SecurityRequirementObject[];
  deprecated?: boolean;
}

export interface ParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: SchemaObject;
  example?: any;
}

export interface RequestBodyObject {
  description?: string;
  content: ContentObject;
  required?: boolean;
}

export interface ContentObject {
  [mediaType: string]: MediaTypeObject;
}

export interface MediaTypeObject {
  schema?: SchemaObject;
  example?: any;
  examples?: { [key: string]: ExampleObject };
}

export interface ExampleObject {
  summary?: string;
  description?: string;
  value?: any;
}

export interface ResponsesObject {
  [statusCode: string]: ResponseObject;
}

export interface ResponseObject {
  description: string;
  content?: ContentObject;
  headers?: { [header: string]: HeaderObject };
}

export interface HeaderObject {
  description?: string;
  schema?: SchemaObject;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  default?: any;
  enum?: any[];
  required?: string[];
  properties?: { [property: string]: SchemaObject };
  items?: SchemaObject;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  not?: SchemaObject;
  $ref?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  example?: any;
  deprecated?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface ComponentsObject {
  schemas?: { [schema: string]: SchemaObject };
  responses?: { [response: string]: ResponseObject };
  parameters?: { [parameter: string]: ParameterObject };
  requestBodies?: { [requestBody: string]: RequestBodyObject };
  headers?: { [header: string]: HeaderObject };
  securitySchemes?: { [securityScheme: string]: SecuritySchemeObject };
}

export interface SecuritySchemeObject {
  type: string;
  description?: string;
  name?: string;
  in?: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlowsObject;
  openIdConnectUrl?: string;
}

export interface OAuthFlowsObject {
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
}

export interface OAuthFlowObject {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: { [scope: string]: string };
}

export interface SecurityRequirementObject {
  [name: string]: string[];
}

export interface TagObject {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
}

export interface ExternalDocumentationObject {
  description?: string;
  url: string;
}

// Helper types for our components
export interface EndpointInfo {
  path: string;
  method: HttpMethod;
  operation: OperationObject;
  tags: string[];
}

export interface GroupedEndpoints {
  [tag: string]: EndpointInfo[];
}
