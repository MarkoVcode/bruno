import styled from 'styled-components';

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: ${(props) => props.theme.console?.bg || props.theme.bg};
  min-height: 0;

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 2rem;
    color: ${(props) => props.theme.textLight};
    text-align: center;

    p {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: ${(props) => props.theme.text};
    }

    span {
      font-size: 12px;
      color: ${(props) => props.theme.textLight};
    }
  }

  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid ${(props) => props.theme.border};
    background-color: ${(props) => props.theme.bgLight};

    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: ${(props) => props.theme.text};
    }

    .sort-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      font-size: 12px;
      font-weight: 500;
      color: ${(props) => props.theme.text};
      background-color: ${(props) => props.theme.bg};
      border: 1px solid ${(props) => props.theme.border};
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background-color: ${(props) => props.theme.bgLight};
        border-color: ${(props) => props.theme.primary};
      }

      svg {
        color: ${(props) => props.theme.primary};
      }
    }
  }

  .table-container {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .upstream-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 12px;

    thead {
      background-color: ${(props) => props.theme.console?.headerBg || '#2d2d2d'};
      position: sticky;
      top: 0;
      z-index: 5;

      th {
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 600;
        color: ${(props) => props.theme.text};
        background-color: ${(props) => props.theme.console?.headerBg || '#2d2d2d'};
        border-bottom: 2px solid ${(props) => props.theme.border};
        white-space: nowrap;
      }

      .counter-column {
        width: 60px;
        text-align: center;
      }

      .uri-column {
        flex: 1;
      }

      .actions-column {
        width: 120px;
        text-align: center;
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
        padding: 0.75rem 1rem;
        color: ${(props) => props.theme.text};
        vertical-align: middle;
      }

      .counter-cell {
        text-align: center;
        font-weight: 600;
        color: ${(props) => props.theme.primary};
        width: 60px;
      }

      .uri-cell {
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.6;
        word-break: break-all;
        color: ${(props) => props.theme.text};
        user-select: all;
        cursor: text;
      }

      .actions-cell {
        text-align: center;
        width: 120px;

        .copy-button {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          font-size: 11px;
          font-weight: 500;
          color: ${(props) => props.theme.text};
          background-color: ${(props) => props.theme.bg};
          border: 1px solid ${(props) => props.theme.border};
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background-color: ${(props) => props.theme.primary};
            color: white;
            border-color: ${(props) => props.theme.primary};

            svg {
              color: white;
            }
          }

          svg {
            color: ${(props) => props.theme.primary};
            transition: color 0.2s;
          }
        }
      }
    }
  }
`;

export default StyledWrapper;
