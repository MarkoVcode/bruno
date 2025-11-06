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

/**
 * Send chat completion request
 * @param {Object} options - Request options
 * @param {Array} options.messages - Array of message objects {role, content}
 * @param {string} options.model - Model to use (default: gpt-4o)
 * @param {number} options.temperature - Temperature (0-1, default: 0.7)
 * @param {number} options.maxTokens - Max tokens to generate
 * @returns {Promise<Object>} Completion result
 */
export const sendChatCompletion = ({ messages, model = 'gpt-4o', temperature = 0.7, maxTokens = 2000 }) => {
  return window.ipcRenderer.invoke('copilot:chat-completion', {
    messages,
    model,
    temperature,
    maxTokens
  });
};

/**
 * Send streaming chat completion request
 * @param {Object} options - Request options
 * @param {Array} options.messages - Array of message objects {role, content}
 * @param {string} options.model - Model to use (default: gpt-4o)
 * @param {number} options.temperature - Temperature (0-1, default: 0.7)
 * @param {number} options.maxTokens - Max tokens to generate
 * @returns {Promise<Object>} Completion result
 */
export const sendChatCompletionStream = ({ messages, model = 'gpt-4o', temperature = 0.7, maxTokens = 2000 }) => {
  return window.ipcRenderer.invoke('copilot:chat-completion-stream', {
    messages,
    model,
    temperature,
    maxTokens
  });
};

/**
 * Listen for streaming chat chunks
 * @param {Function} callback - Callback function to handle each chunk
 */
export const onChatChunk = (callback) => {
  return window.ipcRenderer.on('copilot:chat-chunk', (event, data) => {
    callback(data);
  });
};

/**
 * Listen for chat completion event
 * @param {Function} callback - Callback function when streaming completes
 */
export const onChatComplete = (callback) => {
  return window.ipcRenderer.on('copilot:chat-complete', () => {
    callback();
  });
};

/**
 * Listen for chat error event
 * @param {Function} callback - Callback function to handle errors
 */
export const onChatError = (callback) => {
  return window.ipcRenderer.on('copilot:chat-error', (event, data) => {
    callback(data);
  });
};
