const { ipcMain, BrowserWindow } = require('electron');
const CopilotTokensStore = require('../store/copilot-tokens');
const {
  startDeviceFlow,
  verifyCopilotAccess,
  getCopilotToken,
  refreshAccessToken
} = require('../services/copilot/authentication');
const {
  sendChatCompletion,
  sendChatCompletionStream,
  getAvailableModels,
  createMessage
} = require('../services/copilot/api-client');

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
      console.log('[Copilot IPC] ===== Starting authentication =====');
      console.log('[Copilot IPC] Event sender exists:', !!event.sender);
      let verificationInfo = null;

      // Start device flow, callback will receive verification URL
      console.log('[Copilot IPC] About to call startDeviceFlow...');
      const tokens = await startDeviceFlow((info) => {
        console.log('[Copilot IPC] ===== Verification callback triggered =====');
        console.log('[Copilot IPC] Verification info received:', JSON.stringify(info, null, 2));
        console.log('[Copilot IPC] Info has verificationUri:', !!info?.verificationUri);
        console.log('[Copilot IPC] Info has userCode:', !!info?.userCode);

        verificationInfo = info;

        // Send verification info to renderer process
        const win = BrowserWindow.fromWebContents(event.sender);
        console.log('[Copilot IPC] Window found:', !!win);

        if (win) {
          console.log('[Copilot IPC] About to send verification-required event with data:', JSON.stringify(info, null, 2));
          win.webContents.send('copilot:verification-required', info);
          console.log('[Copilot IPC] Event sent successfully');
        } else {
          console.error('[Copilot IPC] ERROR: No window found for sender - cannot send event!');
        }
      });

      console.log('[Copilot IPC] Device flow completed, got tokens');
      console.log('[Copilot IPC] Tokens have accessToken:', !!tokens?.accessToken);
      console.log('[Copilot IPC] Tokens have refreshToken:', !!tokens?.refreshToken);
      console.log('[Copilot IPC] Captured verificationInfo:', JSON.stringify(verificationInfo, null, 2));

      // Calculate expiry time
      const expiresIn = tokens.expiresAt ? Math.floor((tokens.expiresAt - Date.now()) / 1000) : null;

      // Store tokens securely
      console.log('[Copilot IPC] Storing tokens...');
      copilotTokensStore.setTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn,
        tokenType: 'bearer',
        scopes: tokens.scopes
      });
      console.log('[Copilot IPC] Tokens stored successfully');

      // Verify Copilot access
      console.log('[Copilot IPC] Verifying Copilot access...');
      const hasCopilotAccess = await verifyCopilotAccess(tokens.accessToken);
      console.log('[Copilot IPC] Has Copilot access:', hasCopilotAccess);

      if (!hasCopilotAccess) {
        console.log('[Copilot IPC] User does not have Copilot access');
        return {
          success: false,
          error: 'GitHub account does not have Copilot access. Please subscribe to GitHub Copilot.'
        };
      }

      // Get Copilot API token
      console.log('[Copilot IPC] Getting Copilot API token...');
      const copilotToken = await getCopilotToken(tokens.accessToken);
      console.log('[Copilot IPC] Got Copilot token, expires at:', copilotToken.expiresAt);

      const response = {
        success: true,
        authenticated: true,
        hasCopilotAccess,
        copilotToken: {
          expiresAt: copilotToken.expiresAt,
          organizations: copilotToken.organizationsList
        },
        verificationInfo // Include verification info as fallback
      };

      console.log('[Copilot IPC] ===== Returning success response =====');
      console.log('[Copilot IPC] Response includes verificationInfo:', !!response.verificationInfo);
      console.log('[Copilot IPC] verificationInfo data:', JSON.stringify(response.verificationInfo, null, 2));

      return response;
    } catch (error) {
      console.error('[Copilot IPC] ===== Authentication error =====');
      console.error('[Copilot IPC] Error:', error);
      console.error('[Copilot IPC] Error message:', error.message);
      console.error('[Copilot IPC] Error stack:', error.stack);
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

  /**
   * Send chat completion request
   */
  ipcMain.handle('copilot:chat-completion', async (event, { messages, model, temperature, maxTokens }) => {
    try {
      if (!copilotTokensStore.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated with GitHub Copilot. Please authenticate first.'
        };
      }

      const response = await sendChatCompletion({
        messages,
        model,
        temperature,
        maxTokens,
        stream: false
      });

      return {
        success: true,
        response
      };
    } catch (error) {
      console.error('Error sending chat completion:', error);
      return {
        success: false,
        error: error.message || 'Failed to send chat completion'
      };
    }
  });

  /**
   * Send streaming chat completion request
   */
  ipcMain.handle('copilot:chat-completion-stream', async (event, { messages, model, temperature, maxTokens }) => {
    try {
      if (!copilotTokensStore.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated with GitHub Copilot. Please authenticate first.'
        };
      }

      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) {
        return {
          success: false,
          error: 'Window not found'
        };
      }

      // Start streaming
      await sendChatCompletionStream({
        messages,
        model,
        temperature,
        maxTokens,
        onChunk: (chunk) => {
          // Send each chunk to the renderer process
          win.webContents.send('copilot:chat-chunk', chunk);
        }
      });

      // Send completion signal
      win.webContents.send('copilot:chat-complete');

      return {
        success: true
      };
    } catch (error) {
      console.error('Error sending streaming chat completion:', error);

      // Send error to renderer
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        win.webContents.send('copilot:chat-error', { error: error.message });
      }

      return {
        success: false,
        error: error.message || 'Failed to send streaming chat completion'
      };
    }
  });

  /**
   * Get available models
   */
  ipcMain.handle('copilot:get-models', async () => {
    try {
      if (!copilotTokensStore.isAuthenticated()) {
        // Return default models if not authenticated
        return {
          success: true,
          models: [
            { id: 'gpt-4o', name: 'GPT-4o' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
            { id: 'gpt-4', name: 'GPT-4' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
            { id: 'o1-preview', name: 'O1 Preview' },
            { id: 'o1-mini', name: 'O1 Mini' }
          ]
        };
      }

      const result = await getAvailableModels();

      return {
        success: true,
        models: result.data || result
      };
    } catch (error) {
      console.error('Error getting available models:', error);
      // Return default models on error
      return {
        success: true,
        models: [
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
          { id: 'o1-preview', name: 'O1 Preview' },
          { id: 'o1-mini', name: 'O1 Mini' }
        ]
      };
    }
  });
};

module.exports = registerCopilotIpc;
