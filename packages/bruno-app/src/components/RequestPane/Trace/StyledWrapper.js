import styled from 'styled-components';

const StyledWrapper = styled.div`
  .trace-container {
    padding: 1rem;
    max-width: 100%;
  }

  .trace-header {
    h3 {
      color: ${(props) => props.theme.text};
    }

    p {
      color: ${(props) => props.theme.textLight};
    }
  }

  .trace-toggle {
    input[type='checkbox'] {
      cursor: pointer;
      width: 16px;
      height: 16px;
    }

    label {
      color: ${(props) => props.theme.text};
    }
  }

  .trace-plugin-selector {
    label {
      color: ${(props) => props.theme.text};
    }

    select {
      background-color: ${(props) => props.theme.bg};
      color: ${(props) => props.theme.text};
      border-color: ${(props) => props.theme.border};

      &:focus {
        border-color: ${(props) => props.theme.primary};
        box-shadow: 0 0 0 3px ${(props) => props.theme.primaryFaded};
      }

      &:disabled {
        background-color: rgba(0, 0, 0, 0.15);
        color: ${(props) => props.theme.textLight};
        opacity: 0.6;
      }
    }
  }

  .trace-config-display {
    h4 {
      color: ${(props) => props.theme.text};
    }

    code {
      background-color: rgba(0, 0, 0, 0.2);
      color: ${(props) => props.theme.primary};
      border-color: ${(props) => props.theme.border};
    }

    .bg-gray-50 {
      background-color: rgba(0, 0, 0, 0.15);
      border: 1px solid ${(props) => props.theme.border}40;
    }

    .border-gray-200 {
      border-color: ${(props) => props.theme.border}40;
    }

    .text-gray-500 {
      color: ${(props) => props.theme.textLight};
    }

    .text-gray-600 {
      color: ${(props) => props.theme.textLight};
    }
  }

  .trace-notes {
    background-color: rgba(0, 0, 0, 0.15);
    border: 1px solid ${(props) => props.theme.primary}40;
    border-left: 3px solid ${(props) => props.theme.primary};

    h4 {
      color: ${(props) => props.theme.text};
    }

    ul li {
      color: ${(props) => props.theme.text};
      opacity: 0.9;
    }
  }

  .trace-empty-state,
  .trace-disabled-state {
    background-color: rgba(0, 0, 0, 0.15);
    border-color: ${(props) => props.theme.border}40;

    p {
      color: ${(props) => props.theme.textLight};
    }
  }
`;

export default StyledWrapper;
