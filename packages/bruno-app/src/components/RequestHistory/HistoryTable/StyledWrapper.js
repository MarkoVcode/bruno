import styled from 'styled-components';

const StyledWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.bg};
  border-top: 1px solid ${(props) => props.theme.border};

  .history-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px 16px;
  }

  .loading-message,
  .empty-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${(props) => props.theme.textMuted};
    font-size: 14px;

    .hint {
      font-size: 12px;
      margin-top: 8px;
      opacity: 0.7;
    }
  }

  .loading-more {
    text-align: center;
    padding: 16px;
    color: ${(props) => props.theme.textMuted};
    font-size: 13px;
  }

  .history-group {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: ${(props) => props.theme.bgSecondary};
    border-radius: 4px;
    margin-bottom: 8px;
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(8px);
  }

  .day-title {
    font-weight: 600;
    font-size: 13px;
    color: ${(props) => props.theme.text};
  }

  .entry-count {
    font-size: 12px;
    color: ${(props) => props.theme.textMuted};
  }

  .history-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 12px;
    background-color: ${(props) => props.theme.bgSecondary};
    border-radius: 4px;
    overflow: hidden;

    thead {
      background-color: ${(props) => props.theme.bgHeader};
      position: sticky;
      top: 40px;
      z-index: 5;

      th {
        padding: 8px 10px;
        text-align: left;
        font-weight: 600;
        color: ${(props) => props.theme.textMuted};
        border-bottom: 1px solid ${(props) => props.theme.border};
        white-space: nowrap;
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid ${(props) => props.theme.border};

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background-color: ${(props) => props.theme.bgHover};
        }

        td {
          padding: 10px;
          vertical-align: top;
        }
      }
    }

    .col-time {
      width: 90px;
      font-family: monospace;
      font-size: 11px;
      color: ${(props) => props.theme.textMuted};
    }

    .col-collection {
      width: 20%;
      min-width: 150px;

      .collection-name {
        font-weight: 600;
        color: ${(props) => props.theme.text};
        margin-bottom: 2px;
      }

      .resource-name {
        font-size: 11px;
        color: ${(props) => props.theme.textMuted};
      }
    }

    .col-method {
      width: 80px;
      text-align: center;
    }

    .col-resource {
      width: 35%;
      min-width: 200px;
    }

    .col-status {
      width: 120px;
    }

    .col-duration {
      width: 80px;
      text-align: right;
      font-family: monospace;
      font-size: 11px;
      color: ${(props) => props.theme.textMuted};
    }
  }

  .method-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;

    &.get {
      background-color: #61affe20;
      color: #61affe;
    }

    &.post {
      background-color: #49cc9020;
      color: #49cc90;
    }

    &.put {
      background-color: #fca13020;
      color: #fca130;
    }

    &.patch {
      background-color: #50e3c220;
      color: #50e3c2;
    }

    &.delete {
      background-color: #f9393920;
      color: #f93939;
    }

    &.head,
    &.options {
      background-color: ${(props) => props.theme.bgMuted};
      color: ${(props) => props.theme.textMuted};
    }
  }

  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-weight: 600;
    font-size: 11px;

    &.success {
      background-color: #49cc9020;
      color: #49cc90;
    }

    &.redirect {
      background-color: #61affe20;
      color: #61affe;
    }

    &.client-error {
      background-color: #fca13020;
      color: #fca130;
    }

    &.server-error {
      background-color: #f9393920;
      color: #f93939;
    }

    &.unknown {
      background-color: ${(props) => props.theme.bgMuted};
      color: ${(props) => props.theme.textMuted};
    }
  }

  .url-container {
    .configured-url {
      font-family: monospace;
      font-size: 11px;
      color: ${(props) => props.theme.text};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actual-url {
      font-family: monospace;
      font-size: 10px;
      color: ${(props) => props.theme.textMuted};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 2px;
    }
  }
`;

export default StyledWrapper;
