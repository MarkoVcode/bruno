import styled from 'styled-components';

const StyledWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;

  .trace-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    color: ${(props) => props.theme.textLight};
    text-align: center;

    svg {
      color: ${(props) => props.theme.textLight};
      opacity: 0.5;
      margin-bottom: 1rem;
    }

    p {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: ${(props) => props.theme.text};
    }

    span {
      font-size: 14px;
      color: ${(props) => props.theme.textLight};
    }

    .trace-empty-help {
      margin-top: 2rem;
      padding: 1rem;
      background-color: ${(props) => props.theme.bgLight};
      border-radius: 8px;
      border: 1px solid ${(props) => props.theme.border};
      max-width: 400px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 0.75rem;
        color: ${(props) => props.theme.text};
      }

      ol {
        text-align: left;
        font-size: 13px;
        line-height: 1.6;
        color: ${(props) => props.theme.textLight};
        padding-left: 1.5rem;

        li {
          margin-bottom: 0.25rem;
        }
      }
    }
  }

  /* Split Layout */
  .trace-split-layout {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .trace-left-panel {
    width: 50%;
    height: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border-right: 2px solid ${(props) => props.theme.border};
    background-color: ${(props) => props.theme.bg};
    overflow: hidden;
  }

  .trace-right-panel {
    width: 50%;
    height: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background-color: ${(props) => props.theme.bg};
    overflow: hidden;
  }

  /* Tabs Header */
  .trace-tabs-header {
    display: flex;
    align-items: center;
    padding: 0 1rem;
    border-bottom: 1px solid ${(props) => props.theme.border};
    background-color: ${(props) => props.theme.bgLight};

    .tab {
      padding: 0.75rem 1rem;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: ${(props) => props.theme.textLight};
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      user-select: none;

      &:hover {
        color: ${(props) => props.theme.text};
        background-color: ${(props) => props.theme.bg};
      }

      &.active {
        color: ${(props) => props.theme.primary};
        border-bottom-color: ${(props) => props.theme.primary};
        background-color: ${(props) => props.theme.bg};
      }

      sup {
        margin-left: 0.25rem;
        font-size: 10px;
        font-weight: 600;
        padding: 0.125rem 0.375rem;
        background-color: ${(props) => props.theme.primary};
        color: white;
        border-radius: 10px;
      }
    }

    .trace-status-info {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .status-badge {
        padding: 0.25rem 0.75rem;
        font-size: 12px;
        font-weight: 600;
        border-radius: 4px;

        &.success {
          background-color: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        &.error {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
      }
    }
  }

  /* Tab Content */
  .trace-tab-content {
    flex: 1;
    min-height: 0;
    background-color: ${(props) => props.theme.bg};
    display: flex;
    flex-direction: column;
  }

  .response-viewer,
  .headers-viewer {
    flex: 1;
    min-width: 0;
    padding: 1rem;
    overflow-y: auto;
  }

  .response-viewer {
    > div {
      min-width: 0;
      word-break: break-word;
    }
  }

  .no-data {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    color: ${(props) => props.theme.textLight};
    font-size: 14px;
  }

  /* Headers Table */
  .headers-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;

    thead {
      position: sticky;
      top: 0;
      background-color: ${(props) => props.theme.bgLight};
      z-index: 1;

      th {
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 600;
        color: ${(props) => props.theme.text};
        border-bottom: 2px solid ${(props) => props.theme.border};
        white-space: nowrap;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid ${(props) => props.theme.border};
        transition: background-color 0.15s;

        &:hover {
          background-color: ${(props) => props.theme.bgLight};
        }

        &:last-child {
          border-bottom: none;
        }
      }

      td {
        padding: 0.5rem 1rem;
        color: ${(props) => props.theme.text};
        vertical-align: top;
      }

      .header-name {
        font-weight: 600;
        color: ${(props) => props.theme.primary};
        white-space: nowrap;
        width: 200px;
      }

      .header-value {
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.6;
        word-break: break-all;
        user-select: all;
      }
    }
  }
`;

export default StyledWrapper;
