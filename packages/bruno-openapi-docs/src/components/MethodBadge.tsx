import React from 'react';
import type { HttpMethod } from '../types';

interface MethodBadgeProps {
  method: HttpMethod;
}

const methodStyles: Record<HttpMethod, { bg: string; text: string }> = {
  get: { bg: '#10b981', text: '#fff' },
  post: { bg: '#8b5cf6', text: '#fff' },
  put: { bg: '#f59e0b', text: '#fff' },
  delete: { bg: '#ef4444', text: '#fff' },
  patch: { bg: '#f59e0b', text: '#fff' },
  options: { bg: '#6b7280', text: '#fff' },
  head: { bg: '#6b7280', text: '#fff' },
  trace: { bg: '#6b7280', text: '#fff' }
};

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method }) => {
  const style = methodStyles[method] || methodStyles.get;

  return (
    <span
      className="openapi-method-badge"
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase',
        backgroundColor: style.bg,
        color: style.text,
        marginRight: '8px'
      }}
    >
      {method}
    </span>
  );
};
