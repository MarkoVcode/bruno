const { makeAxiosInstance } = require('../ipc/network/axios-instance');
const jsyaml = require('js-yaml');

/**
 * Fetches OpenAPI specification from a URL
 * @param {string} url - The URL to fetch the OpenAPI spec from
 * @returns {Promise<{spec: object, format: 'json'|'yaml'}>} - The parsed spec and detected format
 * @throws {Error} - If the URL is invalid, fetch fails, or response is not valid OpenAPI
 */
async function fetchOpenapiFromUrl(url) {
  // Validate URL format
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required and must be a string');
  }

  // Ensure URL is HTTP/HTTPS
  const urlPattern = /^https?:\/\/.+/i;
  if (!urlPattern.test(url)) {
    throw new Error('URL must start with http:// or https://');
  }

  // Create axios instance with simple configuration
  const axios = makeAxiosInstance({
    proxyMode: 'off',
    requestMaxRedirects: 5
  });

  try {
    // Fetch the URL with 30 second timeout
    const response = await axios.get(url, {
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300
    });

    if (!response.data) {
      throw new Error('Response body is empty');
    }

    // Detect format from Content-Type header or URL extension
    let format = 'json';
    let spec;

    const contentType = response.headers['content-type'] || '';
    const urlLower = url.toLowerCase();

    // Determine format
    if (contentType.includes('yaml') || contentType.includes('yml') || urlLower.endsWith('.yaml') || urlLower.endsWith('.yml')) {
      format = 'yaml';
    } else if (contentType.includes('json') || urlLower.endsWith('.json')) {
      format = 'json';
    }

    // Parse based on detected format
    try {
      if (typeof response.data === 'object') {
        // Already parsed by axios
        spec = response.data;
      } else if (format === 'yaml') {
        spec = jsyaml.load(response.data);
      } else {
        spec = JSON.parse(response.data);
      }
    } catch (parseError) {
      // If parsing fails with detected format, try the other format
      try {
        if (format === 'yaml') {
          spec = JSON.parse(response.data);
          format = 'json';
        } else {
          spec = jsyaml.load(response.data);
          format = 'yaml';
        }
      } catch (fallbackError) {
        throw new Error(`Failed to parse response as JSON or YAML: ${parseError.message}`);
      }
    }

    // Validate that it's an OpenAPI spec
    if (!spec || typeof spec !== 'object') {
      throw new Error('Response is not a valid object');
    }

    if (!spec.openapi && !spec.swagger) {
      throw new Error('Response does not appear to be an OpenAPI specification (missing "openapi" or "swagger" field)');
    }

    return { spec, format };
  } catch (error) {
    // Provide more specific error messages
    if (error.code === 'ENOTFOUND') {
      throw new Error(`Unable to resolve hostname: ${error.message}`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Connection refused by server');
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      throw new Error('Request timed out after 30 seconds');
    } else if (error.response) {
      throw new Error(`Server returned ${error.response.status}: ${error.response.statusText}`);
    } else if (error.message) {
      throw error; // Re-throw our custom errors
    } else {
      throw new Error(`Failed to fetch OpenAPI spec: ${error}`);
    }
  }
}

module.exports = {
  fetchOpenapiFromUrl
};
