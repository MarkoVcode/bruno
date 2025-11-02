import styled from 'styled-components';

const StyledWrapper = styled.div`
  .group-header {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    cursor: pointer;
    user-select: none;
    font-size: 0.875rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.text.muted};
    background-color: ${(props) => props.theme.dropdown.bg};
    border-bottom: 1px solid ${(props) => props.theme.dropdown.separator};

    &:hover {
      background-color: ${(props) => props.theme.dropdown.hoverBg};
    }

    .group-header-icon {
      display: flex;
      align-items: center;
      margin-right: 6px;
    }

    .group-name {
      flex: 1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .group-count {
      font-size: 0.75rem;
      font-weight: 400;
      opacity: 0.7;
      margin-left: 4px;
    }
  }
`;

export default StyledWrapper;
