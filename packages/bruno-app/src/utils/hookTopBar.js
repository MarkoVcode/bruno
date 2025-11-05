/**
 * hookTopBar Utility
 *
 * Processes the special "hookTopBar" environment variable.
 * Format: "URL|jqSelector"
 * Example: "https://www.example.com/api/version|'.releaseVersion'"
 *
 * Makes a GET request to the URL and extracts the value using the jq-style selector.
 */

/**
 * Parses a jq-style selector and extracts value from JSON object
 * Supports basic selectors like '.key', '.nested.key', '.array[0]'
 *
 * @param {Object} jsonData - The JSON response data
 * @param {string} selector - jq-style selector (e.g., '.releaseVersion', '.data.version')
 * @returns {string|null} - Extracted value or null if not found
 */
export const extractValueFromJson = (jsonData, selector) => {
  if (!selector || !jsonData) {
    return null;
  }

  try {
    // Remove leading dot if present
    const path = selector.startsWith('.') ? selector.slice(1) : selector;

    // Split by dots to handle nested paths
    const keys = path.split('.');

    let value = jsonData;
    for (const key of keys) {
      // Handle array access like 'items[0]'
      const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch;
        value = value?.[arrayKey]?.[parseInt(index, 10)];
      } else {
        value = value?.[key];
      }

      if (value === undefined || value === null) {
        return null;
      }
    }

    // Convert to string if it's a primitive value
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  } catch (error) {
    console.error('Error extracting value from JSON:', error);
    return null;
  }
};

/**
 * Parses the hookTopBar variable value
 *
 * @param {string} hookTopBarValue - Format: "URL|jqSelector"
 * @returns {{url: string, selector: string}|null} - Parsed components or null if invalid
 */
export const parseHookTopBarValue = (hookTopBarValue) => {
  if (!hookTopBarValue || typeof hookTopBarValue !== 'string') {
    return null;
  }

  const parts = hookTopBarValue.split('|');
  if (parts.length !== 2) {
    console.warn('Invalid hookTopBar format. Expected: "URL|selector"');
    return null;
  }

  const [url, selector] = parts;

  if (!url.trim() || !selector.trim()) {
    return null;
  }

  return {
    url: url.trim(),
    selector: selector.trim()
  };
};

/**
 * Fetches data from URL and extracts value using selector
 * Makes a single GET request with no retries
 * Uses Electron IPC to bypass CSP restrictions
 *
 * @param {string} url - The URL to fetch
 * @param {string} selector - jq-style selector for extracting value
 * @returns {Promise<string|null>} - Resolved value or null on failure
 */
export const fetchHookTopBarValue = async (url, selector) => {
  try {
    const { ipcRenderer } = window;

    // Use IPC to make the request from the main process (no CSP restrictions)
    const result = await ipcRenderer.invoke('fetch-hook-topbar', url);

    if (!result.success) {
      console.warn(`hookTopBar fetch failed: ${result.error}`);
      return null;
    }

    const jsonData = result.data;
    const extractedValue = extractValueFromJson(jsonData, selector);

    return extractedValue;
  } catch (error) {
    console.error('Error fetching hookTopBar value:', error);
    return null;
  }
};

/**
 * Main function to process hookTopBar environment variable
 *
 * @param {string} hookTopBarValue - The hookTopBar variable value ("URL|selector")
 * @returns {Promise<string|null>} - Resolved display value or null on failure
 */
export const processHookTopBar = async (hookTopBarValue) => {
  const parsed = parseHookTopBarValue(hookTopBarValue);

  if (!parsed) {
    return null;
  }

  const { url, selector } = parsed;
  return await fetchHookTopBarValue(url, selector);
};
