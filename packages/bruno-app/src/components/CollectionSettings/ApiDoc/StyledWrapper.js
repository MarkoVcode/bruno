import styled from 'styled-components';

const StyledWrapper = styled.div`
  height: 100%;
  width: 100%;

  .redoc-wrap {
    height: 100%;
  }

  /* Override ReDoc styles for dark theme */
  ${(props) =>
    props.theme.mode === 'dark'
    && `
    background-color: ${props.theme.bg};
    color: ${props.theme.text};

    .redoc-wrap {
      background-color: ${props.theme.bg};
    }
  `}
`;

export default StyledWrapper;
