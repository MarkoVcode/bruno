/**
 * Trace Tab - DevTools trace response viewer
 *
 * Split layout:
 * - Left: Response viewer (Response + Headers tabs)
 * - Right: Upstream API calls table
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import ReactJson from 'react-json-view';
import { useTheme } from 'providers/Theme';
import { IconRouteOff } from '@tabler/icons';
import UpstreamCallsTable from './UpstreamCallsTable';
import StyledWrapper from './StyledWrapper';

const TraceEmpty = () => {
  return (
    <div className="trace-empty">
      <IconRouteOff size={48} strokeWidth={1} />
      <p>No trace data available</p>
      <span>Trace responses from GET requests will appear here</span>
      <div className="trace-empty-help">
        <h4>How to enable tracing:</h4>
        <ol>
          <li>Open a GET request</li>
          <li>Go to the "Trace" tab</li>
          <li>Select a trace plugin (e.g., BFF_debug)</li>
          <li>Enable tracing</li>
          <li>Run the request</li>
        </ol>
      </div>
    </div>
  );
};

const Trace = () => {
  const { displayedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('response');

  // Get trace data from Redux store
  const traceData = useSelector((state) => state.trace?.currentTrace || null);

  // If no trace data, show empty state
  if (!traceData) {
    return (
      <StyledWrapper>
        <TraceEmpty />
      </StyledWrapper>
    );
  }

  // Extract trace information
  const {
    data,
    headers,
    status,
    statusText
  } = traceData;

  // The plugin wraps the response, so check data.originalData first
  let actualData = data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    // If data is an object with originalData property, use that
    if (data.originalData && Array.isArray(data.originalData)) {
      actualData = data.originalData;
    }
  }

  // Determine if actualData is upstream calls array
  const isUpstreamCallsArray = Array.isArray(actualData) && actualData.length > 0 && typeof actualData[0] === 'string';
  const upstreamCalls = isUpstreamCallsArray ? actualData : null;

  console.log('[Trace Component] Upstream calls detected:', upstreamCalls ? upstreamCalls.length : 0);

  const getTabClassname = (tabName) => {
    return classnames(`tab select-none ${tabName}`, {
      active: tabName === activeTab
    });
  };

  const responseHeadersCount = typeof headers === 'object' && headers ? Object.entries(headers).length : 0;

  return (
    <StyledWrapper>
      <div className="trace-split-layout">
        {/* Left Panel: Response Viewer */}
        <div className="trace-left-panel">
          <div className="trace-tabs-header">
            <div className={getTabClassname('response')} role="tab" onClick={() => setActiveTab('response')}>
              Response
            </div>
            <div className={getTabClassname('headers')} role="tab" onClick={() => setActiveTab('headers')}>
              Headers
              {responseHeadersCount > 0 && <sup className="ml-1 font-medium">{responseHeadersCount}</sup>}
            </div>
            <div className="trace-status-info">
              {status && (
                <span className={`status-badge ${status >= 200 && status < 300 ? 'success' : 'error'}`}>
                  {status} {statusText}
                </span>
              )}
            </div>
          </div>

          <div className="trace-tab-content">
            {activeTab === 'response' && (
              <div className="response-viewer">
                {actualData ? (
                  <ReactJson
                    src={Array.isArray(actualData) ? { upstreamCalls: actualData } : actualData}
                    theme={displayedTheme === 'light' ? 'rjv-default' : 'monokai'}
                    iconStyle="triangle"
                    indentWidth={2}
                    collapsed={false}
                    displayDataTypes={false}
                    displayObjectSize={true}
                    enableClipboard={true}
                    name={false}
                    style={{
                      backgroundColor: 'transparent',
                      fontSize: '13px',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
                    }}
                  />
                ) : (
                  <div className="no-data">No response data</div>
                )}
              </div>
            )}

            {activeTab === 'headers' && (
              <div className="headers-viewer">
                {headers && Object.keys(headers).length > 0 ? (
                  <table className="headers-table">
                    <thead>
                      <tr>
                        <th>Header</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(headers).map(([key, value]) => (
                        <tr key={key}>
                          <td className="header-name">{key}</td>
                          <td className="header-value">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data">No response headers</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Upstream Calls Table */}
        <div className="trace-right-panel">
          <UpstreamCallsTable upstreamCalls={upstreamCalls} />
        </div>
      </div>
    </StyledWrapper>
  );
};

export default Trace;
