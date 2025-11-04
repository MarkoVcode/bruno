import styled from 'styled-components';

const StyledWrapper = styled.div`
  height: 100%;
  width: 100%;

  .redoc-wrap {
    height: 100%;
  }

  /* CSS Variables for JSON Viewer - Light Theme */
  --code-block-bg: #f8f9fa;
  --border-color: #e0e0e0;
  --text-primary: #1a1a1a;
  --text-muted: #666;
  --code-bg: rgba(0, 0, 0, 0.05);
  --json-key-color: #0550ae;
  --json-string-color: #0a3069;
  --json-number-color: #cf222e;
  --json-boolean-color: #8250df;
  --json-null-color: #57606a;

  /* Override styles for dark theme */
  ${(props) =>
    props.theme.mode === 'dark'
    && `
    background-color: ${props.theme.bg};
    color: ${props.theme.text};

    .redoc-wrap {
      background-color: ${props.theme.bg};
    }

    /* CSS Variables for JSON Viewer - Dark Theme */
    --code-block-bg: rgba(255, 255, 255, 0.05);
    --border-color: #444;
    --text-primary: #d4d4d4;
    --text-muted: #9d9d9d;
    --code-bg: rgba(255, 255, 255, 0.08);
    --json-key-color: #79c0ff;
    --json-string-color: #a5d6ff;
    --json-number-color: #ff7b72;
    --json-boolean-color: #d2a8ff;
    --json-null-color: #8b949e;
  `}
`;

export default StyledWrapper;
