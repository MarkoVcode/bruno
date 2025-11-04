import React from 'react';

interface JsonViewerProps {
  data: any;
  className?: string;
}

/**
 * JSON Viewer component with syntax highlighting
 * Works with both light and dark themes using CSS variables
 */
export const JsonViewer: React.FC<JsonViewerProps> = ({ data, className = '' }) => {
  // Convert data to formatted JSON string
  const jsonString = typeof data === 'string'
    ? data
    : JSON.stringify(data, null, 2);

  // Syntax highlighting function
  const highlightJson = (json: string): string => {
    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          let cls = 'json-number';

          // String (key or value)
          if (/^"/.test(match)) {
            // Check if it's a key (ends with :)
            if (/:$/.test(match)) {
              cls = 'json-key';
            } else {
              cls = 'json-string';
            }
          }
          // Boolean
          else if (/true|false/.test(match)) {
            cls = 'json-boolean';
          }
          // Null
          else if (/null/.test(match)) {
            cls = 'json-null';
          }

          return `<span class="${cls}">${match}</span>`;
        }
      );
  };

  const highlightedJson = highlightJson(jsonString);

  return (
    <pre className={`json-viewer ${className}`}>
      <code dangerouslySetInnerHTML={{ __html: highlightedJson }} />
    </pre>
  );
};
