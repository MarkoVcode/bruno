import React from 'react';
import { IconChevronDown, IconChevronRight } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';

/**
 * Collapsible group header for grouped environments
 */
const EnvironmentGroupHeader = ({ groupName, isExpanded, onToggle, environmentCount }) => {
  return (
    <StyledWrapper>
      <div className="group-header" onClick={onToggle}>
        <div className="group-header-icon">
          {isExpanded ? <IconChevronDown size={14} strokeWidth={2} /> : <IconChevronRight size={14} strokeWidth={2} />}
        </div>
        <span className="group-name">{groupName}</span>
        <span className="group-count">({environmentCount})</span>
      </div>
    </StyledWrapper>
  );
};

export default EnvironmentGroupHeader;
