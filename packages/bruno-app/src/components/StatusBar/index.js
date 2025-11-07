import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { IconSettings, IconCookie, IconTool, IconSearch, IconHistory, IconBrandGithubCopilot } from '@tabler/icons';
import Mousetrap from 'mousetrap';
import { getKeyBindingsForActionAllOS } from 'providers/Hotkeys/keyMappings';
import ToolHint from 'components/ToolHint';
import Preferences from 'components/Preferences';
import IconSidebarToggle from 'components/Icons/IconSidebarToggle';
import Cookies from 'components/Cookies';
import Notifications from 'components/Notifications';
import Portal from 'components/Portal';
import { showPreferences, toggleSidebarCollapse } from 'providers/ReduxStore/slices/app';
import { openConsole, setActiveTab } from 'providers/ReduxStore/slices/logs';
import { toggleHistory } from 'providers/ReduxStore/slices/history';
import { copilotActions } from 'providers/ReduxStore/slices/copilot';
import { checkCopilotAuthStatus } from 'utils/ipc/copilot';
import { useApp } from 'providers/App';
import StyledWrapper from './StyledWrapper';

const StatusBar = () => {
  const dispatch = useDispatch();
  const preferencesOpen = useSelector((state) => state.app.showPreferences);
  const logs = useSelector((state) => state.logs.logs);
  const sidebarCollapsed = useSelector((state) => state.app.sidebarCollapsed);
  const isHistoryOpen = useSelector((state) => state.history.isHistoryOpen);
  const { authenticated, hasCopilotAccess } = useSelector((state) => state.copilot);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const { version } = useApp();
  const brunonReleaseTag = '';

  const errorCount = logs.filter(log => log.type === 'error').length;

  // Check Copilot authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await checkCopilotAuthStatus();
        if (result.authenticated) {
          dispatch(copilotActions.setAuthStatus({
            authenticated: result.authenticated,
            hasCopilotAccess: result.hasCopilotAccess,
            metadata: result.metadata
          }));
        }
      } catch (err) {
        console.error('Failed to check Copilot auth status:', err);
      }
    };
    checkAuth();
  }, [dispatch]);

  const handleConsoleClick = () => {
    dispatch(openConsole());
  };

  const handleHistoryClick = () => {
    dispatch(toggleHistory());
  };

  const handleCopilotClick = () => {
    dispatch(openConsole());
    dispatch(setActiveTab('copilot'));
  };

  const openGlobalSearch = () => {
    const bindings = getKeyBindingsForActionAllOS('globalSearch') || [];
    bindings.forEach((binding) => {
      Mousetrap.trigger(binding);
    });
  };

  return (
    <StyledWrapper>
      {preferencesOpen && (
        <Portal>
          <Preferences
            onClose={() => {
              dispatch(showPreferences(false));
              document.querySelector('[data-trigger="preferences"]').focus();
            }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="preferences-title"
            aria-describedby="preferences-description"
          />
        </Portal>
      )}
      
      {cookiesOpen && (
        <Portal>
          <Cookies
            onClose={() => {
              setCookiesOpen(false);
              document.querySelector('[data-trigger="cookies"]').focus();
            }}
            aria-modal="true"
            role="dialog"
            aria-labelledby="cookies-title"
            aria-describedby="cookies-description"
          />
        </Portal>
      )}

      <div className="status-bar">
        <div className="status-bar-section">
          <div className="status-bar-group">
            <ToolHint text="Toggle Sidebar" toolhintId="Toggle Sidebar" place="top-start" offset={10}>
              <button
                className="status-bar-button"
                aria-label="Toggle Sidebar"
                onClick={() => dispatch(toggleSidebarCollapse())}
              >
                <IconSidebarToggle collapsed={sidebarCollapsed} size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </ToolHint>

            <ToolHint text="Preferences" toolhintId="Preferences" place="top-start" offset={10}>
              <button
                className="status-bar-button preferences-button"
                data-trigger="preferences"
                onClick={() => dispatch(showPreferences(true))}
                tabIndex={0}
                aria-label="Open Preferences"
              >
                <IconSettings size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </ToolHint>
            
            <ToolHint text="Notifications" toolhintId="Notifications" place="top" offset={10}>
              <div className="status-bar-button">
                <Notifications />
              </div>
            </ToolHint>
          </div>
        </div>

        <div className="status-bar-section">
          <div className="flex items-center gap-3">
            <button
              className="status-bar-button"
              data-trigger="search"
              onClick={openGlobalSearch}
              tabIndex={0}
              aria-label="Global Search"
            >
              <div className="console-button-content">
                <IconSearch size={16} strokeWidth={1.5} aria-hidden="true" />
                <span className="console-label">Search</span>
              </div>
            </button>
            
            <button
              className="status-bar-button"
              data-trigger="cookies"
              onClick={() => setCookiesOpen(true)}
              tabIndex={0}
              aria-label="Open Cookies"
            >
              <div className="console-button-content">
                <IconCookie size={16} strokeWidth={1.5} aria-hidden="true" />
                <span className="console-label">Cookies</span>
              </div>
            </button>

            <button
              className={`status-bar-button ${isHistoryOpen ? 'active' : ''}`}
              data-trigger="history"
              onClick={handleHistoryClick}
              tabIndex={0}
              aria-label="Request History"
            >
              <div className="console-button-content">
                <IconHistory size={16} strokeWidth={1.5} aria-hidden="true" />
                <span className="console-label">History</span>
              </div>
            </button>

            <button
              className={`status-bar-button ${errorCount > 0 ? 'has-errors' : ''}`}
              data-trigger="dev-tools"
              onClick={handleConsoleClick}
              tabIndex={0}
              aria-label={`Open Dev Tools${errorCount > 0 ? ` (${errorCount} errors)` : ''}`}
            >
              <div className="console-button-content">
                <IconTool size={16} strokeWidth={1.5} aria-hidden="true" />
                <span className="console-label">Dev Tools</span>
                {errorCount > 0 && (
                  <span className="error-count-inline">{errorCount}</span>
                )}
              </div>
            </button>

            <ToolHint text={authenticated && hasCopilotAccess ? 'GitHub Copilot Connected' : 'GitHub Copilot Disconnected'} toolhintId="Copilot Status" place="top" offset={10}>
              <button
                className={`status-bar-button copilot-status ${authenticated && hasCopilotAccess ? 'connected' : 'disconnected'}`}
                data-trigger="copilot"
                onClick={handleCopilotClick}
                tabIndex={0}
                aria-label={`GitHub Copilot ${authenticated && hasCopilotAccess ? 'Connected' : 'Disconnected'}`}
              >
                <div className="console-button-content">
                  <IconBrandGithubCopilot size={16} strokeWidth={1.5} aria-hidden="true" />
                  <span className={`copilot-status-dot ${authenticated && hasCopilotAccess ? 'connected' : 'disconnected'}`}></span>
                </div>
              </button>
            </ToolHint>

            <div className="status-bar-divider"></div>

            <div className="status-bar-version">
              {brunonReleaseTag || `v${version}`}
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default StatusBar; 