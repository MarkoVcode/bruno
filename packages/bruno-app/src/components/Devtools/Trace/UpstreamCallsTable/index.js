/**
 * UpstreamCallsTable Component
 *
 * Displays upstream API calls in a sortable table with copy functionality
 */

import React, { useState, useMemo } from 'react';
import { IconCopy, IconCheck, IconSortAscending, IconSortDescending } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';

const UpstreamCallsTable = ({ upstreamCalls }) => {
  const [sortOrder, setSortOrder] = useState('original'); // 'original', 'asc', 'desc'
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Sort the upstream calls based on current sort order
  const sortedCalls = useMemo(() => {
    if (!upstreamCalls || !Array.isArray(upstreamCalls)) {
      return [];
    }

    const callsWithIndex = upstreamCalls.map((call, index) => ({
      originalIndex: index + 1,
      uri: call
    }));

    if (sortOrder === 'asc') {
      return [...callsWithIndex].sort((a, b) => a.uri.localeCompare(b.uri));
    } else if (sortOrder === 'desc') {
      return [...callsWithIndex].sort((a, b) => b.uri.localeCompare(a.uri));
    }
    return callsWithIndex;
  }, [upstreamCalls, sortOrder]);

  const handleCopy = (uri, index) => {
    navigator.clipboard.writeText(uri);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleSort = () => {
    if (sortOrder === 'original') {
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder('original');
    }
  };

  if (!upstreamCalls || upstreamCalls.length === 0) {
    return (
      <StyledWrapper>
        <div className="empty-state">
          <p>No upstream API calls captured</p>
          <span>Enable trace debugging to capture upstream calls</span>
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <div className="table-header">
        <h3>Upstream API Calls ({upstreamCalls.length})</h3>
        <button className="sort-button" onClick={toggleSort}>
          {sortOrder === 'asc' && <><IconSortAscending size={16} /> Sorted A-Z</>}
          {sortOrder === 'desc' && <><IconSortDescending size={16} /> Sorted Z-A</>}
          {sortOrder === 'original' && <>Original Order</>}
        </button>
      </div>
      <div className="table-container">
        <table className="upstream-table">
          <thead>
            <tr>
              <th className="counter-column">#</th>
              <th className="uri-column">API Endpoint</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCalls.map((call, displayIndex) => (
              <tr key={displayIndex}>
                <td className="counter-cell">{call.originalIndex}</td>
                <td className="uri-cell" title={call.uri}>
                  {call.uri}
                </td>
                <td className="actions-cell">
                  <button
                    className="copy-button"
                    onClick={() => handleCopy(call.uri, displayIndex)}
                    title="Copy to clipboard"
                  >
                    {copiedIndex === displayIndex ? (
                      <><IconCheck size={16} /> Copied</>
                    ) : (
                      <><IconCopy size={16} /> Copy</>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StyledWrapper>
  );
};

export default UpstreamCallsTable;
