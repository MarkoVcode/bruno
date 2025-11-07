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

  .user-code-prominent {
    padding: 20px;
    background: ${(props) => props.theme.console.bg};
    border: 2px solid #4caf50;
    border-radius: 8px;
    margin-bottom: 20px;
    text-align: center;
  }

  .user-code-label {
    font-size: 13px;
    color: ${(props) => props.theme.textSecondary};
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .user-code-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .user-code-value-large {
    font-size: 32px;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    color: #4caf50;
    letter-spacing: 8px;
    margin: 12px 0;
    padding: 12px;
    background: rgba(76, 175, 80, 0.1);
    border-radius: 6px;
    user-select: all;
  }

  .copy-code-button {
    background: rgba(76, 175, 80, 0.1);
    border: 1px solid rgba(76, 175, 80, 0.3);
    border-radius: 6px;
    color: #4caf50;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(76, 175, 80, 0.2);
      border-color: #4caf50;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .user-code-hint {
    font-size: 12px;
    color: ${(props) => props.theme.textSecondary};
    margin-top: 8px;
  }

  .verification-steps {
    font-size: 13px;
    color: ${(props) => props.theme.textSecondary};
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .verification-step {
    padding: 8px 12px;
    margin-bottom: 8px;
    background: ${(props) => props.theme.console.bg};
    border-left: 3px solid ${(props) => props.theme.console.border};
    border-radius: 4px;

    strong {
      color: ${(props) => props.theme.text};
    }
  }

  .verification-link {
    font-size: 13px;
    color: ${(props) => props.theme.textSecondary};
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid ${(props) => props.theme.console.border};

    a {
      color: #4caf50;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
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
