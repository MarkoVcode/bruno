import React, { useState, useMemo } from 'react';
import type {
  OpenAPISpec,
  HttpMethod,
  OperationObject,
  ParameterObject,
  SchemaObject,
  ResponseObject
} from '../types';
import { MethodBadge } from './MethodBadge';
import '../index.css';

interface OpenAPIExplorerProps {
  spec: OpenAPISpec;
  onOpenRequest?: (path: string, method: string) => void;
}

const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

// Helper to group endpoints by tag
function groupByTags(spec: OpenAPISpec) {
  const grouped: Record<string, Array<{ path: string; method: HttpMethod; operation: OperationObject }>> = {};
  const untagged: Array<{ path: string; method: HttpMethod; operation: OperationObject }> = [];

  Object.entries(spec.paths || {}).forEach(([path, pathItem]) => {
    HTTP_METHODS.forEach((method) => {
      const operation = pathItem[method];
      if (operation) {
        const tags = operation.tags || [];
        const endpoint = { path, method, operation };

        if (tags.length === 0) {
          untagged.push(endpoint);
        } else {
          tags.forEach((tag) => {
            if (!grouped[tag]) grouped[tag] = [];
            grouped[tag].push(endpoint);
          });
        }
      }
    });
  });

  if (untagged.length > 0) {
    grouped['Other'] = untagged;
  }

  return grouped;
}

// Simple schema renderer
const SchemaDisplay: React.FC<{ schema: SchemaObject; spec: OpenAPISpec; level?: number }> = ({
  schema,
  spec,
  level = 0
}) => {
  const [expanded, setExpanded] = useState(level < 2);

  if (schema.$ref) {
    const parts = schema.$ref.split('/');
    const schemaName = parts[parts.length - 1];
    return <span style={{ color: '#569cd6' }}>{schemaName}</span>;
  }

  if (schema.type === 'object' && schema.properties) {
    return (
      <div style={{ marginLeft: level > 0 ? '20px' : '0' }}>
        <span
          onClick={() => setExpanded(!expanded)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          {expanded ? '▼' : '▶'} object
        </span>
        {expanded && (
          <div style={{ marginLeft: '20px', borderLeft: '1px solid #ddd', paddingLeft: '10px' }}>
            {Object.entries(schema.properties).map(([propName, propSchema]) => (
              <div key={propName} style={{ margin: '4px 0' }}>
                <strong>{propName}</strong>
                {schema.required?.includes(propName) && (
                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                )}
                {': '}
                <SchemaDisplay schema={propSchema} spec={spec} level={level + 1} />
                {propSchema.description && (
                  <span style={{ color: '#6b7280', marginLeft: '8px', fontSize: '12px' }}>
                    {propSchema.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (schema.type === 'array' && schema.items) {
    return (
      <span>
        array&lt;
        <SchemaDisplay schema={schema.items} spec={spec} level={level + 1} />
        &gt;
      </span>
    );
  }

  const typeStr = schema.type || 'any';
  const format = schema.format ? `(${schema.format})` : '';
  return (
    <span style={{ color: '#059669' }}>
      {typeStr}
      {format}
    </span>
  );
};

export const OpenAPIExplorer: React.FC<OpenAPIExplorerProps> = ({ spec, onOpenRequest }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<{
    path: string;
    method: HttpMethod;
    operation: OperationObject;
  } | null>(null);

  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});

  const groupedEndpoints = useMemo(() => groupByTags(spec), [spec]);

  const toggleTag = (tag: string) => {
    setExpandedTags((prev) => ({ ...prev, [tag]: !prev[tag] }));
  };

  // Render sidebar
  const renderSidebar = () => (
    <div className="openapi-sidebar">
      <div className="openapi-sidebar-header">
        <h2>{spec.info.title}</h2>
        <span className="openapi-version">{spec.info.version}</span>
      </div>

      {Object.entries(groupedEndpoints).map(([tag, endpoints]) => {
        const isExpanded = expandedTags[tag] !== false;
        return (
          <div key={tag} className="openapi-tag-group">
            <div className="openapi-tag-header" onClick={() => toggleTag(tag)}>
              <span>{isExpanded ? '▼' : '▶'}</span>
              <span>{tag}</span>
              <span className="openapi-tag-count">({endpoints.length})</span>
            </div>
            {isExpanded && (
              <div className="openapi-endpoints">
                {endpoints.map((endpoint) => (
                  <div
                    key={`${endpoint.method}-${endpoint.path}`}
                    className={`openapi-endpoint-item ${
                      selectedEndpoint?.path === endpoint.path &&
                      selectedEndpoint?.method === endpoint.method
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() => setSelectedEndpoint(endpoint)}
                  >
                    <MethodBadge method={endpoint.method} />
                    <span className="openapi-endpoint-path">{endpoint.path}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Render main content
  const renderContent = () => {
    if (!selectedEndpoint) {
      return (
        <div className="openapi-overview">
          <h1>{spec.info.title}</h1>
          <p className="version">Version: {spec.info.version}</p>
          {spec.info.description && (
            <div className="description">{spec.info.description}</div>
          )}

          {spec.servers && spec.servers.length > 0 && (
            <div className="servers">
              <h3>Servers</h3>
              {spec.servers.map((server, idx) => (
                <div key={idx} className="server">
                  <code>{server.url}</code>
                  {server.description && <p>{server.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    const { path, method, operation } = selectedEndpoint;
    const parameters = operation.parameters || [];
    const pathParams = parameters.filter((p) => p.in === 'path');
    const queryParams = parameters.filter((p) => p.in === 'query');
    const headerParams = parameters.filter((p) => p.in === 'header');

    return (
      <div className="openapi-endpoint-details">
        <div className="openapi-endpoint-header">
          <MethodBadge method={method} />
          <h2>{path}</h2>
        </div>

        {operation.summary && <p className="summary">{operation.summary}</p>}
        {operation.description && <p className="description">{operation.description}</p>}

        {operation.deprecated && (
          <div className="deprecated-warning">⚠️ This endpoint is deprecated</div>
        )}

        {onOpenRequest && (
          <button
            className="open-in-bruno-btn"
            onClick={() => onOpenRequest(path, method)}
          >
            Open in Bruno →
          </button>
        )}

        {pathParams.length > 0 && (
          <div className="params-section">
            <h3>Path Parameters</h3>
            {pathParams.map((param) => (
              <div key={param.name} className="param-item">
                <code>{param.name}</code>
                {param.required && <span className="required">*</span>}
                {param.schema && (
                  <span className="param-type">
                    <SchemaDisplay schema={param.schema} spec={spec} />
                  </span>
                )}
                {param.description && <p className="param-description">{param.description}</p>}
              </div>
            ))}
          </div>
        )}

        {queryParams.length > 0 && (
          <div className="params-section">
            <h3>Query Parameters</h3>
            {queryParams.map((param) => (
              <div key={param.name} className="param-item">
                <code>{param.name}</code>
                {param.required && <span className="required">*</span>}
                {param.schema && (
                  <span className="param-type">
                    <SchemaDisplay schema={param.schema} spec={spec} />
                  </span>
                )}
                {param.description && <p className="param-description">{param.description}</p>}
              </div>
            ))}
          </div>
        )}

        {operation.requestBody && (
          <div className="request-body-section">
            <h3>Request Body</h3>
            {Object.entries(operation.requestBody.content || {}).map(([contentType, media]) => (
              <div key={contentType} className="content-type">
                <code>{contentType}</code>
                {media.schema && <SchemaDisplay schema={media.schema} spec={spec} />}
              </div>
            ))}
          </div>
        )}

        <div className="responses-section">
          <h3>Responses</h3>
          {Object.entries(operation.responses || {}).map(([status, response]) => (
            <div key={status} className="response-item">
              <div className="response-status">
                <span className={`status-code status-${status[0]}xx`}>{status}</span>
                <span>{(response as ResponseObject).description}</span>
              </div>
              {(response as ResponseObject).content && (
                <div className="response-content">
                  {Object.entries((response as ResponseObject).content || {}).map(
                    ([contentType, media]) => (
                      <div key={contentType}>
                        <code>{contentType}</code>
                        {media.schema && <SchemaDisplay schema={media.schema} spec={spec} />}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="openapi-explorer">
      {renderSidebar()}
      <div className="openapi-content">{renderContent()}</div>
    </div>
  );
};
