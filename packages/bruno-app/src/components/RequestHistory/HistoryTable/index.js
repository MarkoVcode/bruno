import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadMoreDays } from 'providers/ReduxStore/slices/history';
import StyledWrapper from './StyledWrapper';

const HistoryTable = () => {
  const dispatch = useDispatch();
  const history = useSelector((state) => state.history.history);
  const isLoading = useSelector((state) => state.history.isLoading);
  const visibleDays = useSelector((state) => state.history.visibleDays);
  const scrollContainerRef = useRef(null);

  // Group history by day
  const groupedHistory = useMemo(() => {
    const groups = {};
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    history.forEach((entry) => {
      const entryDate = new Date(entry.timestamp);
      const dayKey = entryDate.toDateString();

      if (!groups[dayKey]) {
        const daysAgo = Math.floor((now - entry.timestamp) / oneDayMs);
        groups[dayKey] = {
          date: entryDate,
          daysAgo,
          entries: []
        };
      }

      groups[dayKey].entries.push(entry);
    });

    // Sort groups by date (newest first)
    return Object.values(groups).sort((a, b) => b.date - a.date);
  }, [history]);

  // Handle scroll for lazy loading
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (scrolledToBottom && !isLoading) {
      dispatch(loadMoreDays());
    }
  }, [isLoading, dispatch]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Format date for display
  const formatDayHeader = (group) => {
    const { date, daysAgo } = group;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (daysAgo === 0) {
      return `Today - ${dateStr}`;
    } else if (daysAgo === 1) {
      return `Yesterday - ${dateStr}`;
    } else {
      return `${dayName}, ${dateStr}`;
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get status color class
  const getStatusClass = (status) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'redirect';
    if (status >= 400 && status < 500) return 'client-error';
    if (status >= 500) return 'server-error';
    return 'unknown';
  };

  // Get method color class
  const getMethodClass = (method) => {
    return method?.toLowerCase() || 'unknown';
  };

  if (isLoading && history.length === 0) {
    return (
      <StyledWrapper>
        <div className="loading-message">Loading history...</div>
      </StyledWrapper>
    );
  }

  if (history.length === 0) {
    return (
      <StyledWrapper>
        <div className="empty-message">
          <p>No request history yet</p>
          <p className="hint">Execute a request to see it appear here</p>
        </div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper>
      <div className="history-container" ref={scrollContainerRef}>
        {groupedHistory.map((group, groupIndex) => (
          <div key={groupIndex} className="history-group">
            <div className="day-header">
              <span className="day-title">{formatDayHeader(group)}</span>
              <span className="entry-count">{group.entries.length} requests</span>
            </div>

            <table className="history-table">
              <thead>
                <tr>
                  <th className="col-time">Time</th>
                  <th className="col-collection">Collection / Request</th>
                  <th className="col-method">Method</th>
                  <th className="col-resource">Resource</th>
                  <th className="col-status">Status</th>
                  <th className="col-duration">Duration</th>
                </tr>
              </thead>
              <tbody>
                {group.entries.map((entry, entryIndex) => (
                  <tr key={`${entry.timestamp}-${entryIndex}`}>
                    <td className="col-time">{formatTime(entry.timestamp)}</td>
                    <td className="col-collection">
                      <div className="collection-name">{entry.collectionName}</div>
                      <div className="resource-name">{entry.resourceName}</div>
                    </td>
                    <td className="col-method">
                      <span className={`method-badge ${getMethodClass(entry.method)}`}>
                        {entry.method}
                      </span>
                    </td>
                    <td className="col-resource">
                      <div className="url-container">
                        <div className="configured-url" title={entry.configuredUrl}>
                          {entry.configuredUrl}
                        </div>
                        {entry.actualUrl && entry.actualUrl !== entry.configuredUrl && (
                          <div className="actual-url" title={entry.actualUrl}>
                            → {entry.actualUrl}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="col-status">
                      <span className={`status-badge ${getStatusClass(entry.status)}`}>
                        {entry.status} {entry.statusText}
                      </span>
                    </td>
                    <td className="col-duration">
                      {entry.duration ? `${entry.duration}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {isLoading && (
          <div className="loading-more">Loading more...</div>
        )}
      </div>
    </StyledWrapper>
  );
};

export default HistoryTable;
