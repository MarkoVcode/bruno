import styled from 'styled-components';

const StyledWrapper = styled.div`
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    height: 1.5rem;
    background: ${(props) => props.theme.sidebar.bg};
    border-top: 1px solid ${(props) => props.theme.statusBar.border};
    color: ${(props) => props.theme.statusBar.color};
    font-size: 0.75rem;
    user-select: none;
    position: relative;
  }

  .status-bar-section {
    display: flex;
    align-items: center;
    position: relative;
  }

  .status-bar-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .status-bar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    cursor: pointer;
    position: relative;
    outline: none;
  }

  .console-button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    position: relative;
  }

  .console-label {
    white-space: nowrap;
  }

  .error-count-inline {
    font-size: 10px;
    font-weight: 600;
    color: ${(props) => props.theme.colors.text.danger};
    background: ${(props) => props.theme.colors.bg.danger}20;
    padding: 1px 4px;
    border-radius: 4px;
  }

  .status-bar-divider {
    width: 1px;
    height: 16px;
    background: ${(props) => props.theme.sidebar.dragbar};
    opacity: 0.4;
  }

  .status-bar-version {
    display: flex;
    align-items: center;
    padding: 2px 6px;
  }

  .copilot-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-left: 4px;

    &.connected {
      background: #4caf50;
      box-shadow: 0 0 4px #4caf50;
    }

    &.disconnected {
      background: #9e9e9e;
    }
  }

  .copilot-status {
    &.connected {
      color: #4caf50;
    }

    &.disconnected {
      color: #9e9e9e;
    }
  }

  .privacy-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;

    &.business-tier {
      color: #4caf50;

      svg {
        filter: drop-shadow(0 0 2px rgba(76, 175, 80, 0.3));
      }

      &:hover {
        color: #66bb6a;
      }
    }

    &.individual-tier {
      color: #ffc107;

      svg {
        filter: drop-shadow(0 0 2px rgba(255, 193, 7, 0.2));
      }

      &:hover {
        color: #ffca28;
      }
    }
  }
`;

export default StyledWrapper; 