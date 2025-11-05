import styled from 'styled-components';

const StyledWrapper = styled.div`
  .hook-topbar-display {
    display: inline-flex;
    align-items: center;
    padding: 1px 9px;
    margin: 0 9px;
    font-size: 13px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.text.default};
    background-color: ${(props) => props.theme.colors.bg.hover};
    border: 1px solid ${(props) => props.theme.colors.border};
    border-radius: 4px;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: default;

    &:hover {
      background-color: ${(props) => props.theme.colors.bg.active};
    }
  }
`;

export default StyledWrapper;
