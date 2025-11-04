import React, { useMemo } from 'react';
import MarkdownIt from 'markdown-it';

interface MarkdownProps {
  content: string;
  className?: string;
}

// Create markdown-it instance with safe defaults
const md = new MarkdownIt({
  html: false, // Disable HTML tags in source for security
  breaks: true, // Convert '\n' in paragraphs into <br>
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable smartquotes and other typographic replacements
  highlight: (str, lang) => {
    // Syntax highlighting for code blocks
    if (lang === 'json' || isJsonString(str)) {
      return highlightJson(str);
    }
    return ''; // Use default for other languages
  }
});

// Check if a string is valid JSON
const isJsonString = (str: string): boolean => {
  try {
    JSON.parse(str.trim());
    return true;
  } catch {
    return false;
  }
};

// JSON syntax highlighter
const highlightJson = (json: string): string => {
  // First, try to parse and format it
  let formattedJson = json;
  try {
    const parsed = JSON.parse(json.trim());
    formattedJson = JSON.stringify(parsed, null, 2);
  } catch {
    // If parsing fails, use the original
    formattedJson = json;
  }

  return formattedJson
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

export const Markdown: React.FC<MarkdownProps> = ({ content, className = '' }) => {
  const html = useMemo(() => {
    if (!content) return '';
    return md.render(content);
  }, [content]);

  if (!content) return null;

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
