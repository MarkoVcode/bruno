const { ipcMain, BrowserWindow } = require('electron');
const CopilotTokensStore = require('../store/copilot-tokens');
const {
  startDeviceFlow,
  verifyCopilotAccess,
  getCopilotToken,
  refreshAccessToken
} = require('../services/copilot/authentication');

const copilotTokensStore = new CopilotTokensStore();

/**
 * Register Copilot IPC handlers
 */
const registerCopilotIpc = () => {
  /**
   * Start OAuth Device Flow authentication
   */
  ipcMain.handle('copilot:start-auth', async (event) => {
    try {
      let verificationInfo = null;

      // Start device flow, callback will receive verification URL
      const tokens = await startDeviceFlow((info) => {
        verificationInfo = info;

        // Send verification info to renderer process
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win) {
          win.webContents.send('copilot:verification-required', info);
        }
      });

      // Calculate expiry time
      const expiresIn = tokens.expiresAt ? Math.floor((tokens.expiresAt - Date.now()) / 1000) : null;

      // Store tokens securely
      copilotTokensStore.setTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn,
        tokenType: 'bearer',
        scopes: tokens.scopes
      });

      // Verify Copilot access
      const hasCopilotAccess = await verifyCopilotAccess(tokens.accessToken);

      if (!hasCopilotAccess) {
        return {
          success: false,
          error: 'GitHub account does not have Copilot access. Please subscribe to GitHub Copilot.'
        };
      }

      // Get Copilot API token
      const copilotToken = await getCopilotToken(tokens.accessToken);

      return {
        success: true,
        authenticated: true,
        hasCopilotAccess,
        copilotToken: {
          expiresAt: copilotToken.expiresAt,
          organizations: copilotToken.organizationsList
        }
      };
    } catch (error) {
      console.error('Copilot authentication error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  /**
   * Check authentication status
   */
  ipcMain.handle('copilot:check-auth-status', async () => {
    try {
      const metadata = copilotTokensStore.getTokenMetadata();

      if (!metadata.isAuthenticated) {
        return {
          authenticated: false,
          metadata
        };
      }

      // Get actual token and verify Copilot access
      const accessToken = copilotTokensStore.getAccessToken();
      const hasCopilotAccess = await verifyCopilotAccess(accessToken);

      return {
        authenticated: true,
        hasCopilotAccess,
        metadata
      };
    } catch (error) {
      console.error('Error checking auth status:', error);
      return {
        authenticated: false,
        error: error.message
      };
    }
  });

  /**
   * Get Copilot API token
   */
  ipcMain.handle('copilot:get-token', async () => {
    try {
      if (!copilotTokensStore.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated with GitHub Copilot'
        };
      }

      const accessToken = copilotTokensStore.getAccessToken();
      const copilotToken = await getCopilotToken(accessToken);

      return {
        success: true,
        token: copilotToken.token,
        expiresAt: copilotToken.expiresAt
      };
    } catch (error) {
      console.error('Error getting Copilot token:', error);

      // If token is invalid, try to refresh
      if (error.response?.status === 401) {
        try {
          const refreshToken = copilotTokensStore.getRefreshToken();
          if (refreshToken) {
            const newTokens = await refreshAccessToken(refreshToken);

            const expiresIn = newTokens.expiresAt
              ? Math.floor((newTokens.expiresAt - Date.now()) / 1000) : null;

            copilotTokensStore.setTokens({
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
              expiresIn,
              tokenType: 'bearer',
              scopes: []
            });

            // Try again with new token
            const copilotToken = await getCopilotToken(newTokens.accessToken);
            return {
              success: true,
              token: copilotToken.token,
              expiresAt: copilotToken.expiresAt,
              refreshed: true
            };
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          copilotTokensStore.clearTokens();
          return {
            success: false,
            error: 'Authentication expired. Please re-authenticate.',
            needsReauth: true
          };
        }
      }

      return {
        success: false,
        error: error.message
      };
    }
  });

  /**
   * Logout and clear tokens
   */
  ipcMain.handle('copilot:logout', async () => {
    try {
      copilotTokensStore.clearTokens();
      return {
        success: true
      };
    } catch (error) {
      console.error('Error during logout:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });

  /**
   * Refresh access token manually
   */
  ipcMain.handle('copilot:refresh-token', async () => {
    try {
      const refreshToken = copilotTokensStore.getRefreshToken();

      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token available'
        };
      }

      const newTokens = await refreshAccessToken(refreshToken);

      const expiresIn = newTokens.expiresAt
        ? Math.floor((newTokens.expiresAt - Date.now()) / 1000) : null;

      copilotTokensStore.setTokens({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn,
        tokenType: 'bearer',
        scopes: []
      });

      return {
        success: true,
        expiresAt: newTokens.expiresAt
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
};

module.exports = registerCopilotIpc;
