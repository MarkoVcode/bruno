/**
 * TraceResponse Component
 *
 * Displays trace response data below the main response pane.
 * Shows debug information captured from trace requests with expanded headers/params.
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import StyledWrapper from './StyledWrapper';

const TraceResponse = ({ item, collection }) => {
  const [expanded, setExpanded] = useState(true);

  // Get trace data for this specific request
  const traceData = useSelector((state) => {
    return state.trace?.tracesByItem?.[item.uid] || null;
  });

  if (!traceData) {
    return null;
  }

  const { metadata, data, status, statusText, headers } = traceData;

  return (
    <StyledWrapper className="trace-response-container">
      <div className="trace-header">
        <div className="trace-title-bar" onClick={() => setExpanded(!expanded)}>
          <span className="trace-icon">{expanded ? '▼' : '▶'}</span>
          <h3 className="trace-title">
            Trace Response <span className="trace-plugin-badge">{metadata?.plugin}</span>
          </h3>
          <div className="trace-meta">
            <span className="trace-status" data-status={status >= 200 && status < 300 ? 'success' : 'error'}>
              {status} {statusText}
            </span>
            <span className="trace-timestamp">{new Date(metadata?.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="trace-content">
          {/* Response Headers */}
          {headers && Object.keys(headers).length > 0 && (
            <div className="trace-section">
              <h4 className="trace-section-title">Trace Response Headers ({Object.keys(headers).length})</h4>
              <div className="trace-headers">
                {Object.entries(headers).map(([key, value]) => (
                  <div key={key} className="trace-header-item">
                    <span className="trace-header-key">{key}:</span>
                    <span className="trace-header-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Body */}
          <div className="trace-section">
            <h4 className="trace-section-title">Trace Response Body</h4>
            <div className="trace-body">
              <pre className="trace-json">
                {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>

          {/* Metadata Info */}
          <div className="trace-section trace-info">
            <div className="trace-info-item">
              <span className="trace-info-label">URL:</span>
              <span className="trace-info-value">{metadata?.url}</span>
            </div>
            <div className="trace-info-item">
              <span className="trace-info-label">Method:</span>
              <span className="trace-info-value">{metadata?.method}</span>
            </div>
            <div className="trace-info-item">
              <span className="trace-info-label">Plugin:</span>
              <span className="trace-info-value">{metadata?.plugin}</span>
            </div>
          </div>
        </div>
      )}
    </StyledWrapper>
  );
};

export default TraceResponse;
