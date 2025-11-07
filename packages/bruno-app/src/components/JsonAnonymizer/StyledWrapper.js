import styled from 'styled-components';

const StyledWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.bg};
  position: relative;

  .json-anonymizer-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .json-anonymizer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid ${(props) => props.theme.border};
    background: ${(props) => props.theme.bg};
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .model-selector {
    display: flex;
    align-items: center;
    gap: 8px;

    label {
      font-size: 13px;
      color: ${(props) => props.theme.textSecondary};
      font-weight: 500;
    }

    .model-select {
      padding: 6px 12px;
      border: 1px solid ${(props) => props.theme.border};
      border-radius: 4px;
      background: ${(props) => props.theme.bg};
      color: ${(props) => props.theme.text};
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        border-color: ${(props) => props.theme.button.bg};
      }

      &:focus {
        outline: none;
        border-color: #4caf50;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .title-icon {
    color: ${(props) => props.theme.text};
  }

  .title {
    font-size: 20px;
    font-weight: 600;
    color: ${(props) => props.theme.text};
    margin: 0;
  }

  .subtitle {
    font-size: 12px;
    color: ${(props) => props.theme.textSecondary};
    padding: 4px 8px;
    background: ${(props) => props.theme.button.bg};
    border-radius: 4px;
  }

  .close-button {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    border: none;
    background: transparent;
    color: ${(props) => props.theme.text};
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: ${(props) => props.theme.button.bg};
    }
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: rgba(244, 67, 54, 0.1);
    border-bottom: 1px solid rgba(244, 67, 54, 0.3);
    color: #f44336;
    font-size: 13px;
  }

  .json-anonymizer-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 0;
    min-height: 0;
    overflow: hidden;
  }

  .json-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: ${(props) => props.theme.bg};
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid ${(props) => props.theme.border};

    h2 {
      font-size: 14px;
      font-weight: 600;
      color: ${(props) => props.theme.text};
      margin: 0;
    }

    .panel-hint {
      font-size: 12px;
      color: ${(props) => props.theme.textSecondary};
    }
  }

  .json-textarea {
    flex: 1;
    padding: 16px 24px;
    border: none;
    background: ${(props) => props.theme.bg};
    color: ${(props) => props.theme.text};
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
    font-size: 13px;
    line-height: 1.5;
    resize: none;
    outline: none;
    overflow-y: auto;

    &::placeholder {
      color: ${(props) => props.theme.textSecondary};
      opacity: 0.6;
    }

    &:read-only {
      background: ${(props) => props.theme.bgDarker || props.theme.bg};
    }
  }

  .divider {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px 16px;
    background: ${(props) => props.theme.bgDarker || props.theme.bg};
    border-left: 1px solid ${(props) => props.theme.border};
    border-right: 1px solid ${(props) => props.theme.border};
  }

  .anonymize-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: ${(props) => props.theme.button.bg};
    color: ${(props) => props.theme.button.color};
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover:not(:disabled) {
      background: ${(props) => props.theme.button.hoverBg};
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  }

  .auth-hint-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: rgba(76, 175, 80, 0.1);
    color: #4caf50;
    border: 1px solid rgba(76, 175, 80, 0.3);
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(76, 175, 80, 0.2);
      transform: translateY(-1px);
    }
  }

  .copy-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: ${(props) => props.theme.button.bg};
    color: ${(props) => props.theme.button.color};
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: ${(props) => props.theme.button.hoverBg};
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .console-drawer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 400px;
    z-index: 1000;
    box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1);
  }
`;

export default StyledWrapper;
