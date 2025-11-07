/**
 * GitHub Copilot API Client
 *
 * Provides methods to interact with GitHub Copilot's API endpoints
 * using authenticated tokens from the token store.
 */

const axios = require('axios');
const { getCopilotToken, refreshAccessToken } = require('./authentication');
const CopilotTokensStore = require('../../store/copilot-tokens');

const copilotTokensStore = new CopilotTokensStore();

// GitHub Copilot API endpoints
const COPILOT_API_BASE = 'https://api.githubcopilot.com';
const COPILOT_COMPLETIONS_ENDPOINT = `${COPILOT_API_BASE}/chat/completions`;

/**
 * Create axios instance with authentication
 * @param {string} token - Access token
 * @returns {Object} Configured axios instance
 */
function createAuthenticatedClient(token) {
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Editor-Version': 'Bruno/2.0.0',
      'Editor-Plugin-Version': 'copilot-bruno/1.0.0',
      'User-Agent': 'Bruno-Copilot-Client/1.0.0'
    },
    timeout: 30000 // 30 seconds
  });
}

/**
 * Handle API request with automatic token refresh on 401
 * @param {Function} requestFn - Function that makes the API request
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<Object>} API response
 */
async function executeWithTokenRefresh(requestFn, retries = 1) {
  try {
    return await requestFn();
  } catch (error) {
    // If unauthorized and we have retries left, try refreshing token
    if (error.response?.status === 401 && retries > 0) {
      try {
        await refreshAccessToken();
        return await executeWithTokenRefresh(requestFn, retries - 1);
      } catch (refreshError) {
        throw new Error(`Token refresh failed: ${refreshError.message}`);
      }
    }
    throw error;
  }
}

/**
 * Send a chat completion request to GitHub Copilot
 * @param {Object} options - Request options
 * @param {Array} options.messages - Array of message objects {role, content}
 * @param {string} options.model - Model to use (default: gpt-4o)
 * @param {number} options.temperature - Temperature (0-1, default: 0.7)
 * @param {number} options.maxTokens - Max tokens to generate
 * @param {boolean} options.stream - Whether to stream the response
 * @returns {Promise<Object>} Completion response
 */
async function sendChatCompletion({ messages, model = 'gpt-4o', temperature = 0.7, maxTokens = 2000, stream = false }) {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages array is required and must not be empty');
  }

  const makeRequest = async () => {
    // Get GitHub access token from store
    const githubToken = copilotTokensStore.getAccessToken();
    if (!githubToken) {
      throw new Error('Not authenticated. Please authenticate with GitHub Copilot first.');
    }

    // Get Copilot API token using GitHub token
    const copilotTokenData = await getCopilotToken(githubToken);
    if (!copilotTokenData || !copilotTokenData.token) {
      throw new Error('Failed to obtain Copilot API token.');
    }

    const client = createAuthenticatedClient(copilotTokenData.token);

    const requestBody = {
      messages,
      model,
      temperature,
      max_tokens: maxTokens,
      stream
    };

    const response = await client.post(COPILOT_COMPLETIONS_ENDPOINT, requestBody);
    return response.data;
  };

  return executeWithTokenRefresh(makeRequest);
}

/**
 * Send a chat completion request with streaming
 * @param {Object} options - Request options
 * @param {Function} onChunk - Callback for each streaming chunk
 * @returns {Promise<void>}
 */
async function sendChatCompletionStream({ messages, model = 'gpt-4o', temperature = 0.7, maxTokens = 2000, onChunk }) {
  if (!onChunk || typeof onChunk !== 'function') {
    throw new Error('onChunk callback is required for streaming');
  }

  const makeRequest = async () => {
    // Get GitHub access token from store
    const githubToken = copilotTokensStore.getAccessToken();
    if (!githubToken) {
      throw new Error('Not authenticated. Please authenticate with GitHub Copilot first.');
    }

    // Get Copilot API token using GitHub token
    const copilotTokenData = await getCopilotToken(githubToken);
    if (!copilotTokenData || !copilotTokenData.token) {
      throw new Error('Failed to obtain Copilot API token.');
    }

    const client = createAuthenticatedClient(copilotTokenData.token);

    const requestBody = {
      messages,
      model,
      temperature,
      max_tokens: maxTokens,
      stream: true
    };

    const response = await client.post(COPILOT_COMPLETIONS_ENDPOINT, requestBody, {
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
      let buffer = '';

      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              resolve();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              onChunk(parsed);
            } catch (e) {
              // Skip invalid JSON chunks
            }
          }
        }
      });

      response.data.on('end', () => {
        resolve();
      });

      response.data.on('error', (error) => {
        reject(error);
      });
    });
  };

  return executeWithTokenRefresh(makeRequest);
}

/**
 * Helper function to create a simple chat message
 * @param {string} role - Role (system, user, assistant)
 * @param {string} content - Message content
 * @returns {Object} Message object
 */
function createMessage(role, content) {
  return { role, content };
}

module.exports = {
  sendChatCompletion,
  sendChatCompletionStream,
  createMessage,
  COPILOT_API_BASE
};
