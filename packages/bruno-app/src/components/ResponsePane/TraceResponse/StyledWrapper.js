import styled from 'styled-components';

const StyledWrapper = styled.div`
  .trace-response-container {
    border-top: 2px solid var(--color-border);
    margin-top: 1rem;
    background-color: var(--color-bg);
  }

  .trace-header {
    background-color: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .trace-title-bar {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--color-bg-hover);
    }
  }

  .trace-icon {
    margin-right: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .trace-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    flex: 1;
  }

  .trace-plugin-badge {
    display: inline-block;
    margin-left: 0.5rem;
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    background-color: ${(props) => props.theme.tabs.active.border || '#8b5cf6'};
    color: white;
    border-radius: 0.25rem;
  }

  .trace-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.75rem;
  }

  .trace-status {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: 500;

    &[data-status='success'] {
      background-color: #10b98126;
      color: #10b981;
    }

    &[data-status='error'] {
      background-color: #ef444426;
      color: #ef4444;
    }
  }

  .trace-timestamp {
    color: var(--color-text-muted);
  }

  .trace-content {
    padding: 1rem;
  }

  .trace-section {
    margin-bottom: 1.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .trace-section-title {
    font-size: 0.813rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 0.75rem 0;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .trace-headers {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    padding: 0.75rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .trace-header-item {
    display: flex;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.813rem;

    &:last-child {
      border-bottom: none;
    }
  }

  .trace-header-key {
    font-weight: 600;
    color: var(--color-text);
    margin-right: 0.5rem;
    min-width: 150px;
  }

  .trace-header-value {
    color: var(--color-text-secondary);
    word-break: break-all;
  }

  .trace-body {
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    overflow: hidden;
    max-height: 400px;
    overflow-y: auto;
  }

  .trace-json {
    margin: 0;
    padding: 1rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
    font-size: 0.813rem;
    line-height: 1.5;
    color: var(--color-text);
    background-color: var(--color-bg-secondary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .trace-info {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    padding: 0.75rem;
  }

  .trace-info-item {
    display: flex;
    align-items: center;
    padding: 0.375rem 0;
    font-size: 0.813rem;

    &:not(:last-child) {
      border-bottom: 1px solid var(--color-border);
    }
  }

  .trace-info-label {
    font-weight: 600;
    color: var(--color-text-muted);
    margin-right: 0.75rem;
    min-width: 80px;
  }

  .trace-info-value {
    color: var(--color-text);
    word-break: break-all;
  }
`;

export default StyledWrapper;
