import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getHistory } from 'utils/ipc/request-history';
import { loadHistory, setLoading } from 'providers/ReduxStore/slices/history';
import HistoryTable from './HistoryTable';

const MIN_HISTORY_HEIGHT = 150;
const MAX_HISTORY_HEIGHT = window.innerHeight * 0.7;
const DEFAULT_HISTORY_HEIGHT = 300;

const RequestHistory = ({ mainSectionRef }) => {
  const dispatch = useDispatch();
  const isHistoryOpen = useSelector((state) => state.history.isHistoryOpen);
  const visibleDays = useSelector((state) => state.history.visibleDays);
  const [historyHeight, setHistoryHeight] = useState(DEFAULT_HISTORY_HEIGHT);
  const [isResizingHistory, setIsResizingHistory] = useState(false);

  // Load history when component opens
  useEffect(() => {
    if (isHistoryOpen) {
      dispatch(setLoading(true));
      getHistory({ daysToShow: visibleDays, limit: 1000 })
        .then((history) => {
          dispatch(loadHistory(history));
        })
        .catch((error) => {
          console.error('Failed to load history:', error);
          dispatch(loadHistory([]));
        });
    }
  }, [isHistoryOpen, visibleDays, dispatch]);

  const handleHistoryResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingHistory(true);
  }, []);

  const handleHistoryResize = useCallback((e) => {
    if (!isResizingHistory || !mainSectionRef.current) return;

    const windowHeight = window.innerHeight;
    const statusBarHeight = 22;
    const mouseY = e.clientY;

    // Calculate new history height - expanding upward from bottom
    const newHeight = windowHeight - mouseY - statusBarHeight;
    const clampedHeight = Math.min(MAX_HISTORY_HEIGHT, Math.max(MIN_HISTORY_HEIGHT, newHeight));
    setHistoryHeight(clampedHeight);

    // Update main section height
    if (mainSectionRef.current) {
      mainSectionRef.current.style.height = `calc(100vh - 22px - ${clampedHeight}px)`;
    }
  }, [isResizingHistory, mainSectionRef]);

  const handleHistoryResizeEnd = useCallback(() => {
    setIsResizingHistory(false);
  }, []);

  useEffect(() => {
    if (isResizingHistory) {
      document.addEventListener('mousemove', handleHistoryResize);
      document.addEventListener('mouseup', handleHistoryResizeEnd);
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleHistoryResize);
        document.removeEventListener('mouseup', handleHistoryResizeEnd);
        document.body.style.userSelect = '';
      };
    }
  }, [isResizingHistory, handleHistoryResize, handleHistoryResizeEnd]);

  // Set initial height
  useEffect(() => {
    if (mainSectionRef.current && isHistoryOpen) {
      mainSectionRef.current.style.height = `calc(100vh - 22px - ${historyHeight}px)`;
    }
  }, [isHistoryOpen, historyHeight, mainSectionRef]);

  if (!isHistoryOpen) {
    return null;
  }

  return (
    <>
      <div
        onMouseDown={handleHistoryResizeStart}
        style={{
          height: '4px',
          cursor: 'row-resize',
          backgroundColor: isResizingHistory ? '#0078d4' : 'transparent',
          transition: 'background-color 0.2s ease',
          zIndex: 20,
          position: 'relative'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#0078d4'}
        onMouseLeave={(e) => e.target.style.backgroundColor = isResizingHistory ? '#0078d4' : 'transparent'}
      />
      <div style={{ height: `${historyHeight}px`, overflow: 'hidden', position: 'relative' }}>
        <HistoryTable />
      </div>
    </>
  );
};

export default RequestHistory;
