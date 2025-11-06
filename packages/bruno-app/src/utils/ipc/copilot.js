/**
 * Copilot IPC utilities for renderer process
 *
 * Provides functions to communicate with the main process for Copilot operations
 */

/**
 * Start Copilot authentication flow
 * @returns {Promise<Object>} Authentication result
 */
export const startCopilotAuth = () => {
  return window.ipcRenderer.invoke('copilot:start-auth');
};

/**
 * Check Copilot authentication status
 * @returns {Promise<Object>} Authentication status
 */
export const checkCopilotAuthStatus = () => {
  return window.ipcRenderer.invoke('copilot:check-auth-status');
};

/**
 * Get Copilot API token
 * @returns {Promise<Object>} Token details
 */
export const getCopilotToken = () => {
  return window.ipcRenderer.invoke('copilot:get-token');
};

/**
 * Logout from Copilot
 * @returns {Promise<Object>} Logout result
 */
export const copilotLogout = () => {
  return window.ipcRenderer.invoke('copilot:logout');
};

/**
 * Refresh Copilot access token
 * @returns {Promise<Object>} Refresh result
 */
export const refreshCopilotToken = () => {
  return window.ipcRenderer.invoke('copilot:refresh-token');
};

/**
 * Listen for verification required event
 * @param {Function} callback - Callback function to handle verification info
 */
export const onVerificationRequired = (callback) => {
  return window.ipcRenderer.on('copilot:verification-required', (event, data) => {
    callback(data);
  });
};
