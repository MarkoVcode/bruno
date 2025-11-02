import React, { useState, useMemo } from 'react';
import { IconPlus, IconDownload, IconSettings, IconSearch, IconX } from '@tabler/icons';
import ToolHint from 'components/ToolHint';
import EnvironmentGroupHeader from '../EnvironmentGroupHeader';
import {
  groupEnvironments,
  filterEnvironments,
  groupHasMatches,
  sortGroupNames
} from 'utils/environment-grouping';

const EnvironmentListContent = ({
  environments,
  activeEnvironmentUid,
  description,
  onEnvironmentSelect,
  onSettingsClick,
  onCreateClick,
  onImportClick,
  isCollectionTab = false,
  isSubscriber = false
}) => {
  // Hide Configure button for collection environments when using shared environments
  const showConfigureButton = !isCollectionTab || !isSubscriber;

  // Search state
  const [searchText, setSearchText] = useState('');

  // Collapsed/expanded state for groups (default: all expanded)
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Toggle group expand/collapse
  const toggleGroup = (groupName) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Group and filter environments (only for collection environments)
  const { groupedData, ungroupedData, groupNames } = useMemo(() => {
    if (!isCollectionTab) {
      // Global environments: no grouping, just filter
      const filtered = filterEnvironments(environments, searchText);
      return { groupedData: {}, ungroupedData: filtered, groupNames: [] };
    }

    // Collection environments: group by naming convention
    const { grouped, ungrouped } = groupEnvironments(environments);

    // Filter both grouped and ungrouped environments
    const filteredGrouped = {};
    Object.keys(grouped).forEach((groupName) => {
      const filteredEnvs = filterEnvironments(grouped[groupName], searchText);
      if (filteredEnvs.length > 0) {
        filteredGrouped[groupName] = filteredEnvs;
      }
    });

    const filteredUngrouped = filterEnvironments(ungrouped, searchText);

    // Sort group names alphabetically
    const sortedGroupNames = sortGroupNames(Object.keys(filteredGrouped));

    return {
      groupedData: filteredGrouped,
      ungroupedData: filteredUngrouped,
      groupNames: sortedGroupNames
    };
  }, [environments, searchText, isCollectionTab]);

  return (
    <div>
      {environments && environments.length > 0 ? (
        <>
          {/* Search input */}
          <div className="environment-search px-2 py-2 border-b" style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <IconSearch size={14} strokeWidth={1.5} />
              </div>
              <input
                type="text"
                placeholder="Search environments..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '28px',
                  paddingRight: searchText ? '28px' : '8px',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  fontSize: '0.875rem',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '4px'
                }}
                className="environment-search-input"
              />
              {searchText && (
                <div
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={() => setSearchText('')}
                >
                  <IconX size={14} strokeWidth={1.5} />
                </div>
              )}
            </div>
          </div>

          <div className="environment-list">
            <div className="dropdown-item no-environment" onClick={() => onEnvironmentSelect(null)}>
              <span>No Environment</span>
            </div>
            <ToolHint
              anchorSelect="[data-tooltip-content]"
              place="right"
              positionStrategy="fixed"
              tooltipStyle={{
                maxWidth: '200px',
                wordWrap: 'break-word'
              }}
              delayShow={1000}
            >
              <div>
                {/* Ungrouped environments (shown at top) */}
                {ungroupedData.map((env) => (
                  <div
                    key={env.uid}
                    className={`dropdown-item ${env.uid === activeEnvironmentUid ? 'active' : ''}`}
                    onClick={() => onEnvironmentSelect(env)}
                    data-tooltip-content={env.name}
                    data-tooltip-hidden={env.name?.length < 90}
                  >
                    <span className="max-w-100% truncate no-wrap">{env.name}</span>
                  </div>
                ))}

                {/* Grouped environments (shown below ungrouped) */}
                {groupNames.map((groupName) => {
                  const groupEnvs = groupedData[groupName];
                  const isExpanded = !collapsedGroups[groupName];

                  return (
                    <div key={groupName}>
                      <EnvironmentGroupHeader
                        groupName={groupName}
                        isExpanded={isExpanded}
                        onToggle={() => toggleGroup(groupName)}
                        environmentCount={groupEnvs.length}
                      />
                      {isExpanded
                        && groupEnvs.map((env) => (
                          <div
                            key={env.uid}
                            className={`dropdown-item ${env.uid === activeEnvironmentUid ? 'active' : ''}`}
                            onClick={() => onEnvironmentSelect(env)}
                            data-tooltip-content={env.name}
                            data-tooltip-hidden={env.name?.length < 90}
                            style={{ paddingLeft: '24px' }}
                          >
                            <span className="max-w-100% truncate no-wrap">{env.name}</span>
                          </div>
                        ))}
                    </div>
                  );
                })}
              </div>
            </ToolHint>
            {showConfigureButton && (
              <div className="dropdown-item configure-button">
                <button onClick={onSettingsClick} id="configure-env">
                  <IconSettings size={16} strokeWidth={1.5} />
                  <span>Configure</span>
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <h3>Ready to get started?</h3>
          <p>{description}</p>
          <div className="space-y-2">
            <button onClick={onCreateClick} id="create-env">
              <IconPlus size={16} strokeWidth={1.5} />
              Create
            </button>
            <button onClick={onImportClick} id="import-env">
              <IconDownload size={16} strokeWidth={1.5} />
              Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentListContent;
