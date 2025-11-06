import styled from 'styled-components';

const StyledWrapper = styled.div`
  width: 100%;
  height: 100%;
  background: ${(props) => props.theme.console.bg};
  border-top: 1px solid ${(props) => props.theme.console.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .copilot-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: ${(props) => props.theme.console.headerBg};
    border-bottom: 1px solid ${(props) => props.theme.console.border};
    flex-shrink: 0;
  }

  .copilot-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .copilot-title {
    font-size: 14px;
    font-weight: 600;
    color: ${(props) => props.theme.text};
  }

  .auth-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    background: ${(props) => props.theme.console.buttonBg};
    color: ${(props) => props.theme.text};

    &.authenticated {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    &.error {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  .copilot-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .auth-container {
    max-width: 600px;
    margin: 40px auto;
    text-align: center;
  }

  .auth-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 24px;
    background: ${(props) => props.theme.console.buttonBg};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.text};
    font-size: 32px;
  }

  .auth-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${(props) => props.theme.text};
  }

  .auth-description {
    font-size: 14px;
    color: ${(props) => props.theme.textSecondary};
    margin-bottom: 24px;
    line-height: 1.6;
  }

  .auth-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: ${(props) => props.theme.button.bg};
    color: ${(props) => props.theme.button.color};
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: ${(props) => props.theme.button.hoverBg};
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .verification-box {
    margin-top: 24px;
    padding: 16px;
    background: ${(props) => props.theme.console.headerBg};
    border: 1px solid ${(props) => props.theme.console.border};
    border-radius: 8px;
    text-align: left;
  }

  .verification-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${(props) => props.theme.text};
  }

  .verification-steps {
    font-size: 13px;
    color: ${(props) => props.theme.textSecondary};
    line-height: 1.8;
    margin-bottom: 16px;

    ol {
      padding-left: 20px;
      margin: 0;
    }

    li {
      margin-bottom: 8px;
    }
  }

  .user-code {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: ${(props) => props.theme.console.bg};
    border: 1px solid ${(props) => props.theme.console.border};
    border-radius: 6px;
    margin-top: 12px;
  }

  .user-code-label {
    font-size: 12px;
    color: ${(props) => props.theme.textSecondary};
    font-weight: 500;
  }

  .user-code-value {
    font-size: 18px;
    font-weight: 600;
    font-family: 'Courier New', monospace;
    color: ${(props) => props.theme.text};
    letter-spacing: 2px;
  }

  .error-message {
    margin-top: 16px;
    padding: 12px;
    background: rgba(244, 67, 54, 0.1);
    border: 1px solid rgba(244, 67, 54, 0.3);
    border-radius: 6px;
    color: #f44336;
    font-size: 13px;
    text-align: left;
  }

  .logout-button {
    padding: 6px 12px;
    background: transparent;
    color: ${(props) => props.theme.textSecondary};
    border: 1px solid ${(props) => props.theme.console.border};
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: ${(props) => props.theme.console.buttonBg};
      color: ${(props) => props.theme.text};
    }
  }
`;

export default StyledWrapper;
