const { createOAuthDeviceAuth } = require('@octokit/auth-oauth-device');
const { shell } = require('electron');
const axios = require('axios');

/**
 * GitHub Copilot Authentication Service
 *
 * Implements OAuth Device Flow for GitHub Copilot authentication
 * Using the same client ID as VSCode for GitHub Copilot access
 */

// VSCode's GitHub OAuth client ID (publicly available)
const GITHUB_OAUTH_CLIENT_ID = '01ab8ac9400c4e429b23';
const GITHUB_OAUTH_SCOPES = ['read:user'];

/**
 * Start OAuth Device Flow authentication
 * @param {Function} onVerificationUrl - Callback when user needs to verify
 * @returns {Promise<Object>} Authentication tokens
 */
async function startDeviceFlow(onVerificationUrl) {
  try {
    const auth = createOAuthDeviceAuth({
      clientType: 'github-app',
      clientId: GITHUB_OAUTH_CLIENT_ID,
      scopes: GITHUB_OAUTH_SCOPES,
      onVerification: async (verification) => {
        // Call callback with verification URL and user code
        if (onVerificationUrl) {
          onVerificationUrl({
            verificationUri: verification.verification_uri,
            userCode: verification.user_code,
            expiresIn: verification.expires_in
          });
        }

        // Open the complete verification URL in the default browser
        // This URL has the code pre-filled, so users don't need to enter it manually
        const urlToOpen = verification.verification_uri_complete || verification.verification_uri;
        await shell.openExternal(urlToOpen);
      }
    });

    // This will wait for the user to authorize in the browser
    const { token, expiresAt, refreshToken, refreshTokenExpiresAt } = await auth({
      type: 'oauth'
    });

    return {
      accessToken: token,
      refreshToken,
      expiresAt,
      refreshTokenExpiresAt,
      scopes: GITHUB_OAUTH_SCOPES
    };
  } catch (error) {
    console.error('GitHub Copilot authentication failed:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Verify Copilot access with the token
 * @param {string} token - Access token
 * @returns {Promise<boolean>} Whether user has Copilot access
 */
async function verifyCopilotAccess(token) {
  try {
    // Check if user has Copilot subscription
    const response = await axios.get('https://api.github.com/copilot_internal/v2/token', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    return response.status === 200 && response.data;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return false; // No Copilot access
    }
    throw error;
  }
}

/**
 * Get Copilot API token (different from GitHub token)
 * @param {string} githubToken - GitHub access token
 * @returns {Promise<Object>} Copilot API token details
 */
async function getCopilotToken(githubToken) {
  try {
    const response = await axios.get('https://api.github.com/copilot_internal/v2/token', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/json',
        'Editor-Version': 'vscode/1.85.0',
        'Editor-Plugin-Version': 'copilot/1.0.0',
        'User-Agent': 'Bruno'
      }
    });

    return {
      token: response.data.token,
      expiresAt: response.data.expires_at,
      organizationsList: response.data.organizations_list
    };
  } catch (error) {
    console.error('Failed to get Copilot token:', error);
    throw new Error(`Failed to get Copilot token: ${error.message}`);
  }
}

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New tokens
 */
async function refreshAccessToken(refreshToken) {
  try {
    const auth = createOAuthDeviceAuth({
      clientType: 'github-app',
      clientId: GITHUB_OAUTH_CLIENT_ID,
      refreshToken
    });

    const { token, expiresAt, refreshToken: newRefreshToken, refreshTokenExpiresAt } = await auth({
      type: 'oauth'
    });

    return {
      accessToken: token,
      refreshToken: newRefreshToken,
      expiresAt,
      refreshTokenExpiresAt
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

module.exports = {
  startDeviceFlow,
  verifyCopilotAccess,
  getCopilotToken,
  refreshAccessToken,
  GITHUB_OAUTH_CLIENT_ID,
  GITHUB_OAUTH_SCOPES
};
