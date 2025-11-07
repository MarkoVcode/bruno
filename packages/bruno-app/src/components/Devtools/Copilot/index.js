import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IconBrandGithubCopilot, IconCheck, IconX, IconLoader2 } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';
import { copilotActions } from 'providers/ReduxStore/slices/copilot';
import {
  startCopilotAuth,
  checkCopilotAuthStatus,
  copilotLogout,
  onVerificationRequired
} from 'utils/ipc/copilot';

const Copilot = () => {
  const dispatch = useDispatch();
  const {
    authenticated,
    authStatus,
    verificationUri,
    userCode,
    hasCopilotAccess,
    error
  } = useSelector((state) => state.copilot);

  const [checking, setChecking] = useState(true);

  // Check authentication status on mount
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
        console.error('Failed to check auth status:', err);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();

    // Listen for verification events
    console.log('Setting up verification listener...');
    const unsubscribe = onVerificationRequired((info) => {
      console.log('Verification required event received:', info);
      dispatch(copilotActions.setVerificationInfo({
        verificationUri: info.verificationUri,
        userCode: info.userCode
      }));
    });

    return () => {
      console.log('Cleaning up verification listener');
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch]);

  const handleStartAuth = async () => {
    try {
      dispatch(copilotActions.startAuthentication());

      const result = await startCopilotAuth();

      if (result.success) {
        dispatch(copilotActions.authenticationSuccess({
          hasCopilotAccess: result.hasCopilotAccess,
          metadata: result.metadata
        }));
      } else {
        dispatch(copilotActions.authenticationFailure({
          error: result.error || 'Authentication failed'
        }));
      }
    } catch (err) {
      console.error('Authentication error:', err);
      dispatch(copilotActions.authenticationFailure({
        error: err.message || 'An unexpected error occurred'
      }));
    }
  };

  const handleLogout = async () => {
    try {
      await copilotLogout();
      dispatch(copilotActions.logout());
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const renderAuthStatus = () => {
    if (checking) {
      return (
        <div className="auth-status">
          <IconLoader2 size={12} className="animate-spin" />
          <span>Checking...</span>
        </div>
      );
    }

    if (authenticated) {
      return (
        <div className="auth-status authenticated">
          <span className="status-dot" />
          <span>Authenticated</span>
        </div>
      );
    }

    if (authStatus === 'error') {
      return (
        <div className="auth-status error">
          <IconX size={12} />
          <span>Error</span>
        </div>
      );
    }

    return (
      <div className="auth-status">
        <span className="status-dot" />
        <span>Not authenticated</span>
      </div>
    );
  };

  const renderContent = () => {
    if (checking) {
      return (
        <div className="copilot-content">
          <div className="auth-container">
            <div className="auth-icon">
              <IconLoader2 size={32} className="animate-spin" />
            </div>
            <div className="auth-title">Checking authentication...</div>
          </div>
        </div>
      );
    }

    if (!authenticated) {
      return (
        <div className="copilot-content">
          <div className="auth-container">
            <div className="auth-icon">
              <IconBrandGithubCopilot size={32} />
            </div>
            <div className="auth-title">GitHub Copilot</div>
            <div className="auth-description">
              Authenticate with GitHub Copilot to access AI-powered features in Bruno.
              <br />
              You'll need an active GitHub Copilot subscription.
            </div>

            <button
              className="auth-button"
              onClick={handleStartAuth}
              disabled={authStatus === 'authenticating'}
            >
              {authStatus === 'authenticating' ? (
                <>
                  <IconLoader2 size={16} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <IconBrandGithubCopilot size={16} />
                  <span>Authenticate with GitHub</span>
                </>
              )}
            </button>

            {verificationUri && userCode && (
              <div className="verification-box">
                <div className="verification-title">Complete Authentication in Browser</div>

                <div className="user-code-prominent">
                  <div className="user-code-label">Your Verification Code:</div>
                  <div className="user-code-value-large">{userCode}</div>
                  <div className="user-code-hint">Enter this code on the GitHub page that just opened</div>
                </div>

                <div className="verification-steps">
                  <div className="verification-step">
                    <strong>Step 1:</strong> A browser window should have opened to GitHub
                  </div>
                  <div className="verification-step">
                    <strong>Step 2:</strong> Enter the code above when prompted (it may auto-fill)
                  </div>
                  <div className="verification-step">
                    <strong>Step 3:</strong> Click "Continue" and authorize BrunoN
                  </div>
                </div>

                <div className="verification-link">
                  <span>Browser didn't open? </span>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault(); window.open(verificationUri);
                  }}
                  >
                    Click here to open GitHub
                  </a>
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <strong>Authentication Error:</strong> {error}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Authenticated view - placeholder for Phase 1.2+
    return (
      <div className="copilot-content">
        <div className="auth-container">
          <div className="auth-icon">
            <IconCheck size={32} style={{ color: '#4caf50' }} />
          </div>
          <div className="auth-title">Successfully Authenticated!</div>
          <div className="auth-description">
            You're now connected to GitHub Copilot.
            {hasCopilotAccess ? (
              <>
                <br />
                Copilot features will be available in the next phase.
              </>
            ) : (
              <>
                <br />
                <strong>Note:</strong> Your GitHub account doesn't have Copilot access.
                Please subscribe to GitHub Copilot to use AI features.
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <StyledWrapper>
      <div className="copilot-header">
        <div className="copilot-header-left">
          <div className="copilot-title">
            <IconBrandGithubCopilot size={16} style={{ display: 'inline', marginRight: '8px' }} />
            GitHub Copilot
          </div>
          {renderAuthStatus()}
        </div>
        {authenticated && (
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
      {renderContent()}
    </StyledWrapper>
  );
};

export default Copilot;
