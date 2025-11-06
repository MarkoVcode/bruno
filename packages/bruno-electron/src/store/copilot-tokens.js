const Store = require('electron-store');
const { encryptStringSafe, decryptStringSafe } = require('../utils/encryption');

/**
 * Copilot tokens store
 *
 * Stores GitHub Copilot authentication tokens securely using encryption
 *
 * Store format:
 * {
 *   "accessToken": "<encrypted_token>",
 *   "refreshToken": "<encrypted_token>",
 *   "expiresAt": 1234567890,
 *   "tokenType": "bearer",
 *   "scopes": ["copilot"]
 * }
 */

class CopilotTokensStore {
  constructor() {
    this.store = new Store({
      name: 'copilot-tokens',
      clearInvalidConfig: true
    });
  }

  /**
   * Check if user is authenticated with Copilot
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    const expiresAt = this.store.get('expiresAt');
    if (expiresAt && Date.now() >= expiresAt) {
      return false; // Token expired
    }

    return true;
  }

  /**
   * Get decrypted access token
   * @returns {string|null}
   */
  getAccessToken() {
    const encryptedToken = this.store.get('accessToken');
    if (!encryptedToken) {
      return null;
    }

    return decryptStringSafe(encryptedToken);
  }

  /**
   * Get decrypted refresh token
   * @returns {string|null}
   */
  getRefreshToken() {
    const encryptedToken = this.store.get('refreshToken');
    if (!encryptedToken) {
      return null;
    }

    return decryptStringSafe(encryptedToken);
  }

  /**
   * Store authentication tokens
   * @param {Object} tokens
   * @param {string} tokens.accessToken
   * @param {string} tokens.refreshToken
   * @param {number} tokens.expiresIn - Expiry time in seconds
   * @param {string} tokens.tokenType
   * @param {string[]} tokens.scopes
   */
  setTokens({ accessToken, refreshToken, expiresIn, tokenType = 'bearer', scopes = [] }) {
    const encryptedAccessToken = encryptStringSafe(accessToken);
    const encryptedRefreshToken = refreshToken ? encryptStringSafe(refreshToken) : null;

    const expiresAt = expiresIn ? Date.now() + (expiresIn * 1000) : null;

    this.store.set({
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
      tokenType,
      scopes
    });
  }

  /**
   * Get all token metadata (without decrypting)
   * @returns {Object}
   */
  getTokenMetadata() {
    return {
      hasAccessToken: this.store.has('accessToken'),
      hasRefreshToken: this.store.has('refreshToken'),
      expiresAt: this.store.get('expiresAt'),
      tokenType: this.store.get('tokenType'),
      scopes: this.store.get('scopes'),
      isAuthenticated: this.isAuthenticated()
    };
  }

  /**
   * Clear all stored tokens
   */
  clearTokens() {
    this.store.clear();
  }

  /**
   * Update access token (useful for token refresh)
   * @param {string} accessToken
   * @param {number} expiresIn
   */
  updateAccessToken(accessToken, expiresIn) {
    const encryptedAccessToken = encryptStringSafe(accessToken);
    const expiresAt = expiresIn ? Date.now() + (expiresIn * 1000) : null;

    this.store.set('accessToken', encryptedAccessToken);
    if (expiresAt) {
      this.store.set('expiresAt', expiresAt);
    }
  }
}

module.exports = CopilotTokensStore;
